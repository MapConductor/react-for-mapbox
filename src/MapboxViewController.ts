import type { Map as MapboxMap } from 'mapbox-gl';
import {
  BaseMapViewController,
  type CameraRestriction,
  type CircleCapable,
  type GeoRectBounds,
  type GroundImageCapable,
  type MapCameraPosition,
  type OnMapInitializedHandler,
  type MapViewControllerInterface,
  type MarkerAnimationOverlayHost,
  type MarkerCapable,
  type MarkerState,
  type OnGroundImageEventHandler,
  type OnMarkerEventHandler,
  type PolygonCapable,
  type PolylineCapable,
  type RasterLayerCapable,
  type MapUISettings,
  type GlGestureHandlers,
  applyGlMapUISettings,
  isEmptyCameraRestriction,
  MapProjection,
  type GeoPoint,
} from '@mapconductor/js-sdk-core';
import { ZoomAltitudeConverter } from './zoom/ZoomAltitudeConverter';
import { MapboxMapViewHolder } from './MapboxMapViewHolder';
import { MapboxMarkerController } from './marker/MapboxMarkerController';
import { MapboxMarkerEventController } from './marker/MapboxMarkerEventController';
import { MapboxCircleController } from './circle/MapboxCircleController';
import { MapboxPolylineController } from './polyline/MapboxPolylineController';
import { MapboxPolygonConductor } from './polygon/MapboxPolygonConductor';
import { MapboxGroundImageController } from './groundimage/MapboxGroundImageController';
import { MapboxRasterLayerController } from './raster/MapboxRasterLayerController';
import { installMapEventListeners } from './MapboxViewControllerEvents';
import {
  easeToPosition,
  fitMapBounds,
  jumpToPosition,
  readCameraPosition,
} from './MapboxViewControllerCamera';

export class MapboxViewController
  extends BaseMapViewController
  implements
    MapViewControllerInterface,
    MarkerCapable,
    CircleCapable,
    PolylineCapable,
    PolygonCapable,
    GroundImageCapable,
    RasterLayerCapable
{
  private readonly mapInstance: MapboxMap;
  private initialized = false;
  private logicalTiltHint: number | null = null;
  private readonly styleReadyRef: { current: boolean };
  /** 現在の投影法。android-sdk の MapboxMapViewController の projection と同じ役割。 */
  private projection: MapProjection;

  readonly holder: MapboxMapViewHolder;
  private readonly markerController: MapboxMarkerController;
  private readonly markerEventController: MapboxMarkerEventController;
  private readonly circleController: MapboxCircleController;
  private readonly polylineController: MapboxPolylineController;
  private readonly polygonController: MapboxPolygonConductor;
  private readonly groundImageController: MapboxGroundImageController;
  private readonly rasterLayerController: MapboxRasterLayerController;

  constructor(
    holder: MapboxMapViewHolder,
    markerController: MapboxMarkerController,
    markerEventController: MapboxMarkerEventController,
    circleController: MapboxCircleController,
    polylineController: MapboxPolylineController,
    polygonController: MapboxPolygonConductor,
    groundImageController: MapboxGroundImageController,
    rasterLayerController: MapboxRasterLayerController,
    styleReadyRef: { current: boolean } = { current: true },
    logicalTiltHint: number | null = null,
    projection: MapProjection = MapProjection.Mercator,
  ) {
    super();
    this.mapInstance = holder.map;
    this.initialized = holder.map.loaded();
    this.holder = holder;
    this.holder.setController(this);
    this.styleReadyRef = styleReadyRef;
    this.logicalTiltHint = logicalTiltHint;
    this.projection = projection;
    this.markerController = markerController;
    this.markerEventController = markerEventController;
    this.circleController = circleController;
    this.polylineController = polylineController;
    this.polygonController = polygonController;
    this.groundImageController = groundImageController;
    this.rasterLayerController = rasterLayerController;

    // Capable ファサードの既定実装がここから kind で引く。
    // **登録を忘れると composition が黙って捨てられる。**
    this.registerOverlayController(this.markerController);
    this.registerOverlayController(this.circleController);
    this.registerOverlayController(this.polylineController);
    this.registerOverlayController(this.polygonController);
    this.registerOverlayController(this.groundImageController);
    this.registerOverlayController(this.rasterLayerController);
    this.markerController.onRasterLayerUpdate = async (state) => {
      if (state) {
        await this.rasterLayerController.composition([state]);
      } else {
        await this.rasterLayerController.clear();
      }
    };
    this.setupEventListeners();
  }

  getMap(): MapboxMap {
    return this.mapInstance;
  }

  /**
   * 投影法を切り替える。android-sdk の `MapboxMapViewController.setProjection` /
   * ios-sdk の `Coordinator.setProjection` と同じく、同値なら何もしない。
   */
  setProjection(projection: MapProjection): void {
    if (this.projection === projection) return;
    this.projection = projection;
    this.mapInstance.setProjection(
      projection === MapProjection.Globe ? 'globe' : 'mercator',
    );
  }

  applyUISettings(settings: MapUISettings): void {
    applyGlMapUISettings(this.mapInstance as unknown as Partial<GlGestureHandlers>, settings, 'Mapbox');
  }

  private setupEventListeners(): void {
    installMapEventListeners({
      map: this.mapInstance,
      styleReadyRef: this.styleReadyRef,
      markerController: this.markerController,
      markerEventController: this.markerEventController,
      circleController: this.circleController,
      polylineController: this.polylineController,
      polygonController: this.polygonController,
      groundImageController: this.groundImageController,
      rasterLayerController: this.rasterLayerController,
      getCameraPosition: () => this.getCameraPosition(),
      markInitialized: () => {
        this.initialized = true;
      },
      onMapInitialized: () => this.notifyMapInitialized(),
      onMapClick: (point) => this.notifyMapClick(point),
      dispatchTap: (point) => this.dispatchTap(point),
      onMapLongClick: (point) => this.notifyMapLongClick(point),
      onCameraMoveStart: (camera) => this.notifyCameraMoveStart(camera),
      onCameraMove: (camera) => this.notifyCameraMove(camera),
      onCameraMoveEnd: (camera) => this.notifyCameraMoveEnd(camera),
    });
  }

  override setMapInitializedListener(listener: OnMapInitializedHandler | null): void {
    super.setMapInitializedListener(listener);
    if (listener && this.initialized) this.notifyMapInitialized();
  }

  moveCamera(position: MapCameraPosition): Promise<boolean> {
    this.logicalTiltHint = position.tilt;
    return jumpToPosition(this.mapInstance, position);
  }

  animateCamera(position: MapCameraPosition, durationMillis: number): Promise<boolean> {
    this.logicalTiltHint = position.tilt;
    return easeToPosition(this.mapInstance, position, durationMillis);
  }

  fitBounds(bounds: GeoRectBounds, padding: number): Promise<boolean> {
    return fitMapBounds(this.mapInstance, bounds, padding);
  }

  getCameraPosition(): MapCameraPosition | null {
    return readCameraPosition(this.mapInstance, this.holder, this.logicalTiltHint);
  }

  // --- Marker ---

  /**
   * マーカーのヒットテストと配送。カスケードの先頭。
   *
   * ズームとポインタ種別（タッチかマウスかで許容半径が変わる）が要るので
   * コアの既定ではなくここで持つ。判定自体は core の MarkerManager。
   */
  protected override dispatchMarkerTap(point: GeoPoint): boolean {
    const entity = this.markerController.findWithZoom(
      point,
      this.mapInstance.getZoom(),
      this.markerEventController.lastPointerType,
    );
    if (!entity?.state.clickable) return false;
    this.markerController.dispatchClick(entity.state);
    return true;
  }

  async compositionMarkers(data: MarkerState[]): Promise<void> {
    await this.markerController.composition(data);
    this.markerEventController.resync();
  }

  async updateMarker(state: MarkerState): Promise<void> {
    await this.markerController.update(state);
    this.markerEventController.resync();
  }

  setOnMarkerClickListener(_listener: OnMarkerEventHandler | null): void {
    this.markerEventController.setClickListener(_listener);
  }
  setOnMarkerDragStart(_listener: OnMarkerEventHandler | null): void {
    this.markerEventController.setDragStartListener(_listener);
  }
  setOnMarkerDrag(_listener: OnMarkerEventHandler | null): void {
    this.markerEventController.setDragListener(_listener);
  }
  setOnMarkerDragEnd(_listener: OnMarkerEventHandler | null): void {
    this.markerEventController.setDragEndListener(_listener);
  }
  setOnMarkerAnimateStart(_listener: OnMarkerEventHandler | null): void {
    this.markerEventController.setAnimateStartListener(_listener);
  }
  setOnMarkerAnimateEnd(_listener: OnMarkerEventHandler | null): void {
    this.markerEventController.setAnimateEndListener(_listener);
  }
  setMarkerAnimationOverlayHost(host: MarkerAnimationOverlayHost | null): void {
    this.markerController.setMarkerAnimationOverlayHost(host);
  }

  // --- Circle ---

  // --- Polyline ---

  // --- Polygon ---

  // --- GroundImage ---

  setOnGroundImageClickListener(_listener: OnGroundImageEventHandler | null): void {}

  // --- RasterLayer ---

  // --- Lifecycle ---

  async clearOverlays(): Promise<void> {
    await this.markerController.clear();
    await this.circleController.clear();
    await this.polylineController.clear();
    await this.polygonController.clear();
    this.groundImageController.clear();
    await this.rasterLayerController.clear();
  }

  /**
   * Mapbox はネイティブの範囲制限 API を持つので、
   * `BaseMapViewController` のクランプ方式ではなく直接適用する。
   * android-sdk の `MapboxMapViewController.setCameraRestriction` と同じ方針。
   */
  override setCameraRestriction(restriction: CameraRestriction | null): void {
    // super は呼ばない。基底クラスに保持させるとカメラ停止時のクランプ補正まで走ってしまう。
    // ネイティブ API 側で既に制限されているので二重適用になる（android-sdk と同じ振り分け）。
    const effective = isEmptyCameraRestriction(restriction) ? null : restriction;

    const bounds = effective?.bounds ?? null;
    const sw = bounds?.southWest ?? null;
    const ne = bounds?.northEast ?? null;
    if (sw != null && ne != null) {
      this.mapInstance.setMaxBounds([
        [sw.longitude, sw.latitude],
        [ne.longitude, ne.latitude],
      ]);
    } else {
      // 解除は null を渡す。mapbox-gl の型は非 null の LngLatBoundsLike しか受けないが、
      // 実装は null で制限解除する（公式ドキュメント記載の挙動）。
      (this.mapInstance as unknown as { setMaxBounds(bounds: null): void }).setMaxBounds(null);
    }

    // 統一ズーム（Google 準拠）を Mapbox のズーム体系へ変換する。
    const minZoom = effective?.minZoom;
    const maxZoom = effective?.maxZoom;
    this.mapInstance.setMinZoom(
      minZoom == null ? null : ZoomAltitudeConverter.googleZoomToMapboxZoom(minZoom),
    );
    this.mapInstance.setMaxZoom(
      maxZoom == null ? null : ZoomAltitudeConverter.googleZoomToMapboxZoom(maxZoom),
    );
  }

  destroy(): void {
    super.destroy();
    this.markerEventController.destroy();
    void this.clearOverlays().finally(() => {
      this.markerController.destroy();
      this.mapInstance.remove();
    });
  }
}
