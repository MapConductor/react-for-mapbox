import mapboxgl from 'mapbox-gl';
import {
  CircleManager,
  MapProjection,
  MapProvider,
  MarkerManager,
  MarkerTilingOptions,
  PolygonManager,
  PolylineManager,
  type GeoRectBounds,
  type MapConfig,
  type MapViewControllerInterface,
  withRasterHeaderTransform,
} from '@mapconductor/js-sdk-core';
import { MapboxViewController } from './MapboxViewController';
import { ZoomAltitudeConverter } from './zoom/ZoomAltitudeConverter';
import { toCameraPosition } from './MapCameraPosition';
import { MapboxMapViewHolder } from './MapboxMapViewHolder';
import { MapboxMarkerController } from './marker/MapboxMarkerController';
import { MapboxMarkerEventController } from './marker/MapboxMarkerEventController';
import { MapboxMarkerOverlayRenderer } from './marker/MapboxMarkerOverlayRenderer';
import { MarkerLayer, type MapboxActualMarker } from './marker/MarkerLayer';
import { MarkerDragLayer } from './marker/MarkerDragLayer';
import { MapboxCircleController } from './circle/MapboxCircleController';
import { MapboxCircleLayer, type MapboxActualCircle } from './circle/MapboxCircleLayer';
import { MapboxCircleOverlayRenderer } from './circle/MapboxCircleOverlayRenderer';
import { MapboxPolylineController } from './polyline/MapboxPolylineController';
import { MapboxPolylineLayer, type MapboxActualPolyline } from './polyline/MapboxPolylineLayer';
import { MapboxPolylineOverlayRenderer } from './polyline/MapboxPolylineOverlayRenderer';
import { MapboxPolygonConductor } from './polygon/MapboxPolygonConductor';
import { MapboxPolygonLayer, type MapboxActualPolygon } from './polygon/MapboxPolygonLayer';
import { MapboxPolygonOverlayRenderer } from './polygon/MapboxPolygonOverlayRenderer';
import { MapboxGroundImageController } from './groundimage/MapboxGroundImageController';
import { MapboxGroundImageOverlayRenderer } from './groundimage/MapboxGroundImageOverlayRenderer';
import { MapboxRasterLayerController } from './raster/MapboxRasterLayerController';
import { MapboxRasterLayerOverlayRenderer } from './raster/MapboxRasterLayerOverlayRenderer';

export interface MapboxConfig extends MapConfig {
  style?: string | mapboxgl.StyleSpecification;
  accessToken?: string;
  maxZoom?: number;
  minZoom?: number;
  /** Restricts panning/zooming so the viewport cannot leave this rectangle. */
  restrictBounds?: GeoRectBounds;
  projection?: MapProjection;
  markerTilingOptions?: MarkerTilingOptions;
}

function toLngLatBounds(bounds: GeoRectBounds | undefined): mapboxgl.LngLatBoundsLike | undefined {
  if (!bounds?.southWest || !bounds.northEast) return undefined;
  return [
    [bounds.southWest.longitude, bounds.southWest.latitude],
    [bounds.northEast.longitude, bounds.northEast.latitude],
  ];
}

// Sentinel used to silently cancel initialization when destroy() is called before load.
// Distinct from real errors so callers can ignore it without swallowing actual failures.
const DESTROYED_BEFORE_LOAD = Symbol('DESTROYED_BEFORE_LOAD');

/**
 * Mapbox provider implementation
 */
export class MapboxProvider extends MapProvider {
  // Track map separately from controller so destroy() works even during async init
  private map: mapboxgl.Map | null = null;

  async initialize(config: MapboxConfig): Promise<MapViewControllerInterface> {
    if (this.controller) {
      return this.controller;
    }

    const container =
      typeof config.container === 'string'
        ? document.getElementById(config.container)
        : config.container;

    if (!container) {
      throw new Error('Container element not found');
    }

    const initialCamera = config.initCameraPosition ? toCameraPosition(config.initCameraPosition) : null;
    if (config.accessToken !== undefined) {
      mapboxgl.accessToken = config.accessToken;
    }
    const map = new mapboxgl.Map({
      container,
      style: config.style || 'mapbox://styles/mapbox/streets-v12',
      center: initialCamera?.center ?? [0, 0],
      zoom: initialCamera?.zoom ?? ZoomAltitudeConverter.googleZoomToMapboxZoom(10),
      bearing: initialCamera?.bearing ?? 0,
      pitch: initialCamera?.tilt ?? 0,
      maxZoom: config.maxZoom !== undefined ? ZoomAltitudeConverter.googleZoomToMapboxZoom(config.maxZoom) : undefined,
      minZoom: config.minZoom !== undefined ? ZoomAltitudeConverter.googleZoomToMapboxZoom(config.minZoom) : undefined,
      maxBounds: toLngLatBounds(config.restrictBounds),
      ...config.options,
      projection: config.projection === MapProjection.Globe ? 'globe' : 'mercator',
      // RasterLayer の extraHeaders をタイル要求に載せる唯一の口。mapbox-gl には
      // setTransformRequest が無く、生成時に渡す以外の方法がない。
      transformRequest: withRasterHeaderTransform(config.options?.transformRequest),
    } as mapboxgl.MapOptions);

    // Track map immediately so destroy() can remove it even before load fires
    this.map = map;

    await new Promise<void>((resolve, reject) => {
      map.once('load', () => {
        resolve();
      });
      // If destroy() is called before load fires, reject with the sentinel so the
      // caller can distinguish an intentional cleanup from an unexpected error.
      map.once('remove', () => reject(DESTROYED_BEFORE_LOAD));
    });

    // If destroy() was called during initialization, bail out silently
    if (!this.map) {
      throw DESTROYED_BEFORE_LOAD;
    }

    const holder = new MapboxMapViewHolder(map.getContainer(), map);
    // Rely solely on styleReady rather than also calling isStyleLoaded() here.
    // isStyleLoaded() can return false transiently while Mapbox processes an
    // addLayer/addSource call, which would incorrectly block overlay resync.
    const styleReadyRef = { current: true };
    const canEditStyle = () => styleReadyRef.current;
    const markerController = getMarkerController(holder, canEditStyle, config);
    const markerEventController = new MapboxMarkerEventController(markerController);
    const circleController = getCircleController(holder, canEditStyle);
    const polylineController = getPolylineController(holder, canEditStyle);
    const polygonController = getPolygonController(holder, canEditStyle);
    const groundImageController = getGroundImageController(holder, canEditStyle);
    const rasterLayerController = getRasterLayerController(holder, canEditStyle);

    this.controller = new MapboxViewController(
      holder,
      markerController,
      markerEventController,
      circleController,
      polylineController,
      polygonController,
      groundImageController,
      rasterLayerController,
      styleReadyRef,
      config.initCameraPosition?.tilt ?? null,
      config.projection ?? MapProjection.Mercator,
    );
    return this.controller;
  }

  destroy(): void {
    if (this.controller) {
      this.controller.destroy();
      this.controller = null;
    } else if (this.map) {
      // Map was created but controller hasn't been set yet (load not fired)
      this.map.remove();
    }
    this.map = null;
  }

  /** Returns true if the rejection was caused by an intentional destroy() call. */
  static isDestroyedBeforeLoad(error: unknown): boolean {
    return error === DESTROYED_BEFORE_LOAD;
  }
}

function getMarkerController(
  holder: MapboxMapViewHolder,
  canEditStyle: () => boolean,
  config: MapboxConfig,
): MapboxMarkerController {
  const markerManager = MarkerManager.defaultManager<MapboxActualMarker>();
  const markerLayer = new MarkerLayer({
    holder,
    canEditStyle,
    sourceId: 'mc-markers',
    layerId: 'mc-marker-layer',
  });
  const dragLayer = new MarkerDragLayer({
    holder,
    canEditStyle,
    sourceId: 'mc-marker-drag',
    layerId: 'mc-marker-drag-layer',
  });
  const renderer = new MapboxMarkerOverlayRenderer({
    holder,
    markerManager,
    markerLayer,
    dragLayer,
  });
  return new MapboxMarkerController(holder, renderer, config.markerTilingOptions);
}

function getCircleController(
  holder: MapboxMapViewHolder,
  canEditStyle: () => boolean,
): MapboxCircleController {
  const circleManager = new CircleManager<MapboxActualCircle>();
  const layer = new MapboxCircleLayer({ holder, canEditStyle });
  const renderer = new MapboxCircleOverlayRenderer({ layer, circleManager, holder });
  return new MapboxCircleController(renderer);
}

function getPolylineController(
  holder: MapboxMapViewHolder,
  canEditStyle: () => boolean,
): MapboxPolylineController {
  const polylineManager = new PolylineManager<MapboxActualPolyline>();
  const layer = new MapboxPolylineLayer({ holder, canEditStyle });
  const renderer = new MapboxPolylineOverlayRenderer({ layer, polylineManager, holder });
  return new MapboxPolylineController(renderer);
}

function getPolygonController(
  holder: MapboxMapViewHolder,
  canEditStyle: () => boolean,
): MapboxPolygonConductor {
  const polygonManager = new PolygonManager<MapboxActualPolygon>();
  const layer = new MapboxPolygonLayer({ holder, canEditStyle });
  const renderer = new MapboxPolygonOverlayRenderer({ layer, polygonManager, holder });
  return new MapboxPolygonConductor(renderer);
}

function getGroundImageController(
  holder: MapboxMapViewHolder,
  canEditStyle: () => boolean,
): MapboxGroundImageController {
  const renderer = new MapboxGroundImageOverlayRenderer({ holder, canEditStyle });
  return new MapboxGroundImageController(renderer);
}

function getRasterLayerController(
  holder: MapboxMapViewHolder,
  canEditStyle: () => boolean,
): MapboxRasterLayerController {
  const renderer = new MapboxRasterLayerOverlayRenderer(holder, canEditStyle);
  return new MapboxRasterLayerController(renderer);
}
