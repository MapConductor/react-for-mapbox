import { MapConfig, GeoRectBounds, MapProjection, MarkerTilingOptions, MapProvider, MapViewControllerInterface, MapViewHolderBase, GeoPointInterface, Offset, GeoPoint, MarkerEntity, AbstractMarkerOverlayRenderer, MarkerManager, AddParams, ChangeParams, MarkerState, BitmapIcon, AbstractMarkerController, RasterLayerState, OnMarkerEventHandler, CircleEntity, AbstractCircleOverlayRenderer, CircleManagerInterface, CircleState, CircleController, PolylineEntity, AbstractPolylineOverlayRenderer, PolylineManagerInterface, PolylineState, PolylineController, MapCameraPosition, PolygonEntity, AbstractPolygonOverlayRenderer, PolygonManagerInterface, PolygonState, OnPolygonEventHandler, AbstractGroundImageOverlayRenderer, GroundImageState, GroundImageEntity, RasterLayerOverlayRenderer, RasterLayerAddParams, RasterLayerChangeParams, RasterLayerEntity, RasterLayerController, RasterHeaderSupport, BaseMapViewController, MarkerCapable, CircleCapable, PolylineCapable, PolygonCapable, GroundImageCapable, RasterLayerCapable, MapUISettings, OnMapInitializedHandler, MarkerAnimationOverlayHost, OnCircleEventHandler, OnPolylineEventHandler, OnGroundImageEventHandler, CameraRestriction, MapDesignTypeInterface, AttributionRule, MapViewStateInterface, MapViewState, MapViewHolder, MapViewBaseProps, AbstractZoomAltitudeConverter } from '@mapconductor/js-sdk-core';
import { Map } from 'mapbox-gl';
import React from 'react';

interface MapboxConfig extends MapConfig {
    style?: string | mapboxgl.StyleSpecification;
    accessToken?: string;
    maxZoom?: number;
    minZoom?: number;
    /** Restricts panning/zooming so the viewport cannot leave this rectangle. */
    restrictBounds?: GeoRectBounds;
    projection?: MapProjection;
    markerTilingOptions?: MarkerTilingOptions;
}
/**
 * Mapbox provider implementation
 */
declare class MapboxProvider extends MapProvider {
    private map;
    initialize(config: MapboxConfig): Promise<MapViewControllerInterface>;
    destroy(): void;
    /** Returns true if the rejection was caused by an intentional destroy() call. */
    static isDestroyedBeforeLoad(error: unknown): boolean;
}

declare class MapboxMapViewHolder extends MapViewHolderBase<HTMLElement, Map> {
    readonly mapView: HTMLElement;
    readonly map: Map;
    private _controller;
    constructor(mapView: HTMLElement, map: Map);
    getController(): MapboxViewController | null;
    setController(controller: MapboxViewController): void;
    toScreenOffset(position: GeoPointInterface): Offset;
    fromScreenOffsetSync(offset: Offset): GeoPoint;
}

type Coordinate = [number, number];
type PointFeature = {
    type: 'Feature';
    id?: string | number;
    geometry: {
        type: 'Point';
        coordinates: Coordinate;
    };
    properties: Record<string, unknown>;
};
type LineFeature = {
    type: 'Feature';
    id?: string | number;
    geometry: {
        type: 'LineString';
        coordinates: Coordinate[];
    };
    properties: Record<string, unknown>;
};
type PolygonFeature = {
    type: 'Feature';
    geometry: {
        type: 'Polygon';
        coordinates: Coordinate[][];
    };
    properties: Record<string, unknown>;
};
type FeatureCollection = {
    type: 'FeatureCollection';
    features: Array<PointFeature | LineFeature | PolygonFeature>;
};

type MapboxActualMarker = PointFeature;
declare class MarkerLayer {
    protected readonly holder: MapboxMapViewHolder;
    protected readonly canEditStyle: () => boolean;
    readonly sourceId: string;
    readonly layerId: string;
    constructor({ holder, canEditStyle, sourceId, layerId, }: {
        holder: MapboxMapViewHolder;
        canEditStyle: () => boolean;
        sourceId: string;
        layerId: string;
    });
    draw(entities: MarkerEntity<MapboxActualMarker>[]): boolean;
    ensureStyleResources(): boolean;
    protected setData(data: FeatureCollection): boolean;
    setIconOffsets(offsets: ReadonlyMap<string, [number, number]>, fallback: [number, number]): void;
}

declare class MarkerDragLayer extends MarkerLayer {
    selected: MarkerEntity<MapboxActualMarker> | null;
    constructor({ holder, canEditStyle, sourceId, layerId, }: {
        holder: MapboxMapViewHolder;
        canEditStyle: () => boolean;
        sourceId: string;
        layerId: string;
    });
    updatePosition(position: GeoPoint): boolean;
    drawSelected(): boolean;
}

declare class MapboxMarkerOverlayRenderer extends AbstractMarkerOverlayRenderer<MapboxMapViewHolder, MapboxActualMarker> {
    private readonly defaultMarkerIcon;
    private readonly iconRefCounter;
    private readonly iconBitmaps;
    private readonly pendingImageRemovals;
    readonly markerManager: MarkerManager<MapboxActualMarker>;
    readonly markerLayer: MarkerLayer;
    readonly dragLayer: MarkerDragLayer;
    constructor({ holder, markerManager, markerLayer, dragLayer, }: {
        holder: MapboxMapViewHolder;
        markerManager: MarkerManager<MapboxActualMarker>;
        markerLayer: MarkerLayer;
        dragLayer: MarkerDragLayer;
    });
    onAdd(data: AddParams[]): Promise<(MapboxActualMarker | null)[]>;
    onChange(data: ChangeParams<MapboxActualMarker>[]): Promise<(MapboxActualMarker | null)[]>;
    onRemove(data: MarkerEntity<MapboxActualMarker>[]): Promise<void>;
    onPostProcess(): Promise<void>;
    setMarkerVisible(entity: MarkerEntity<MapboxActualMarker>, visible: boolean): void;
    setMarkerPosition(entity: MarkerEntity<MapboxActualMarker>, position: GeoPoint): void;
    updateSelectedMarker({ entity, state, bitmapIcon, }: {
        entity: MarkerEntity<MapboxActualMarker>;
        state: MarkerState;
        bitmapIcon: BitmapIcon;
    }): Promise<void>;
    drawDragLayer(): void;
    redraw(): void;
    resync(): Promise<void>;
    private createMarkerFeature;
    private retainIcon;
    private releaseIcon;
    private customIconKey;
    private ensureImages;
    private ensureImage;
    private loadBitmapIcon;
    private ensureFallbackDefaultIcon;
    private removeUnusedImages;
    private syncIconOffsets;
    buildEntity(marker: MapboxActualMarker, state: MarkerState): MarkerEntity<MapboxActualMarker>;
}

declare class MapboxMarkerController extends AbstractMarkerController<MapboxActualMarker> {
    private readonly holder;
    readonly renderer: MapboxMarkerOverlayRenderer;
    private selected;
    private pendingSelectedPosition;
    private selectedPositionFrame;
    private readonly tilingOptions;
    private tileRenderer;
    private tileRouteId;
    private tileVersion;
    private tileGeneration;
    /** Called by MapboxViewController when RasterLayerState changes. */
    onRasterLayerUpdate: ((state: RasterLayerState | null) => Promise<void>) | null;
    constructor(holder: MapboxMapViewHolder, renderer: MapboxMarkerOverlayRenderer, tilingOptions?: MarkerTilingOptions);
    protected shouldTile(state: MarkerState, totalCount: number): boolean;
    protected onTiledMarkersChanged(): Promise<void>;
    private syncTiledOverlay;
    private serviceWorkerTileTemplate;
    private localTileTemplate;
    private removeTileOverlay;
    composition(data: MarkerState[]): Promise<void>;
    find(position: GeoPoint): MarkerEntity<MapboxActualMarker> | null;
    /**
     * Find the marker nearest to `position` at the given zoom level.
     * Handles both regular markers (icon-bounds check) and tiled markers (geographic radius).
     * Mirrors Android's `GoogleMapMarkerController.find(position, zoom)`.
     */
    findWithZoom(position: GeoPoint, zoom: number, pointerType: 'touch' | 'mouse'): MarkerEntity<MapboxActualMarker> | null;
    update(state: MarkerState): Promise<void>;
    has(state: MarkerState): boolean;
    getSelectedMarker(): MarkerEntity<MapboxActualMarker> | null;
    setSelectedMarker(entity: MarkerEntity<MapboxActualMarker> | null): Promise<void>;
    updateSelectedPosition(position: GeoPoint): void;
    resync(): Promise<void>;
    clear(): Promise<void>;
    destroy(): void;
    private flushSelectedPosition;
    private cancelSelectedPositionFrame;
    private hasCompositionChanges;
}

declare class MapboxMarkerEventController {
    private readonly controller;
    private activePointerId;
    private dragPanWasEnabled;
    private pointerDownOffset;
    private dragStarted;
    /** Last observed pointer input type — used by MapboxViewController for tile-marker hit radius. */
    lastPointerType: 'touch' | 'mouse';
    constructor(controller: MapboxMarkerController);
    resync(): void;
    setClickListener(listener: OnMarkerEventHandler | null): void;
    setDragStartListener(listener: OnMarkerEventHandler | null): void;
    setDragListener(listener: OnMarkerEventHandler | null): void;
    setDragEndListener(listener: OnMarkerEventHandler | null): void;
    setAnimateStartListener(listener: OnMarkerEventHandler | null): void;
    setAnimateEndListener(listener: OnMarkerEventHandler | null): void;
    destroy(): void;
    private readonly handlePointerDown;
    private readonly handlePointerMove;
    private readonly handlePointerUp;
    private readonly handlePointerCancel;
    private finishDrag;
    private restoreMapInteraction;
    private findMarkerAtPointer;
    private positionFromPointer;
    private localPoint;
}

type MapboxActualCircle = PolygonFeature & {
    id?: string | number;
};
declare class MapboxCircleLayer {
    static readonly Prop: {
        readonly FILL_COLOR: "fillColor";
        readonly STROKE_COLOR: "strokeColor";
        readonly STROKE_WIDTH: "strokeWidth";
        readonly Z_INDEX: "zIndex";
    };
    private readonly holder;
    private readonly canEditStyle;
    readonly sourceId: string;
    readonly layerId: string;
    readonly strokeLayerId: string;
    constructor({ holder, canEditStyle, sourceId, layerId, }: {
        holder: MapboxMapViewHolder;
        canEditStyle: () => boolean;
        sourceId?: string;
        layerId?: string;
    });
    draw(entities: CircleEntity<MapboxActualCircle>[]): boolean;
    private ensureStyleResources;
}

declare class MapboxCircleOverlayRenderer extends AbstractCircleOverlayRenderer<MapboxMapViewHolder, MapboxActualCircle> {
    readonly layer: MapboxCircleLayer;
    readonly circleManager: CircleManagerInterface<MapboxActualCircle>;
    constructor({ layer, circleManager, holder, }: {
        layer: MapboxCircleLayer;
        circleManager: CircleManagerInterface<MapboxActualCircle>;
        holder: MapboxMapViewHolder;
    });
    createCircle(state: CircleState): Promise<MapboxActualCircle | null>;
    updateCircleProperties({ current, }: {
        circle: MapboxActualCircle;
        current: CircleEntity<MapboxActualCircle>;
        prev: CircleEntity<MapboxActualCircle>;
    }): Promise<MapboxActualCircle | null>;
    removeCircle(_entity: CircleEntity<MapboxActualCircle>): Promise<void>;
    onPostProcess(): Promise<void>;
    redraw(): Promise<void>;
}

declare class MapboxCircleController extends CircleController<MapboxActualCircle> {
    readonly renderer: MapboxCircleOverlayRenderer;
    constructor(renderer: MapboxCircleOverlayRenderer);
    update(state: CircleState): Promise<void>;
    resync(): Promise<void>;
    clear(): Promise<void>;
    /**
     * Hit-test a map click (its lat/lng) against the circles geometrically (inside
     * the fill radius) and dispatch the click on the matching circle. Does NOT use
     * a MapLibre layer/overlay click event — detection is driven by the map click
     * position, matching the marker/polyline paths and android. Returns true if hit.
     */
    handleMapClick(clicked: GeoPoint): boolean;
}

type MapboxActualPolyline = LineFeature[];
declare class MapboxPolylineLayer {
    static readonly Prop: {
        readonly STROKE_COLOR: "strokeColor";
        readonly STROKE_WIDTH: "strokeWidth";
        readonly Z_INDEX: "zIndex";
    };
    private readonly holder;
    private readonly canEditStyle;
    readonly sourceId: string;
    readonly layerId: string;
    constructor({ holder, canEditStyle, sourceId, layerId, }: {
        holder: MapboxMapViewHolder;
        canEditStyle: () => boolean;
        sourceId?: string;
        layerId?: string;
    });
    draw(entities: PolylineEntity<MapboxActualPolyline>[]): boolean;
    private ensureStyleResources;
}

declare class MapboxPolylineOverlayRenderer extends AbstractPolylineOverlayRenderer<MapboxMapViewHolder, MapboxActualPolyline> {
    readonly layer: MapboxPolylineLayer;
    readonly polylineManager: PolylineManagerInterface<MapboxActualPolyline>;
    constructor({ layer, polylineManager, holder, }: {
        layer: MapboxPolylineLayer;
        polylineManager: PolylineManagerInterface<MapboxActualPolyline>;
        holder: MapboxMapViewHolder;
    });
    createPolyline(state: PolylineState): Promise<MapboxActualPolyline | null>;
    updatePolylineProperties({ current, }: {
        polyline: MapboxActualPolyline;
        current: PolylineEntity<MapboxActualPolyline>;
        prev: PolylineEntity<MapboxActualPolyline>;
    }): Promise<MapboxActualPolyline | null>;
    removePolyline(_entity: PolylineEntity<MapboxActualPolyline>): Promise<void>;
    onPostProcess(): Promise<void>;
    redraw(): Promise<void>;
    private resolveZIndex;
}

declare class MapboxPolylineController extends PolylineController<MapboxActualPolyline> {
    readonly renderer: MapboxPolylineOverlayRenderer;
    constructor(renderer: MapboxPolylineOverlayRenderer);
    resync(): Promise<void>;
    clear(): Promise<void>;
    /**
     * Hit-test a map click (its lat/lng) against the polylines geometrically and,
     * if the click lands within the tap tolerance of a line, dispatch the click on
     * the nearest polyline (with the closest point on that line as `clicked`).
     *
     * This intentionally does NOT use a MapLibre layer/overlay click event. Like
     * android (`TomTomMapViewController.onPolylineClickedInternal`) and the marker
     * path, the hit is derived from the map click position, so behaviour matches
     * across providers. Returns true if a polyline was hit (so the caller can
     * suppress the generic map click).
     */
    handleMapClick(clicked: GeoPoint, camera: MapCameraPosition | null): boolean;
}

interface MapboxActualPolygon {
    readonly fillFeatures: PolygonFeature[];
    readonly outlineFeatures: LineFeature[];
}
declare class MapboxPolygonLayer {
    static readonly Prop: {
        readonly FILL_COLOR: "fillColor";
        readonly STROKE_COLOR: "strokeColor";
        readonly STROKE_WIDTH: "strokeWidth";
        readonly Z_INDEX: "zIndex";
    };
    private readonly holder;
    private readonly canEditStyle;
    readonly sourceId: string;
    readonly layerId: string;
    readonly outlineSourceId: string;
    readonly outlineLayerId: string;
    constructor({ holder, canEditStyle, sourceId, layerId, outlineSourceId, outlineLayerId, }: {
        holder: MapboxMapViewHolder;
        canEditStyle: () => boolean;
        sourceId?: string;
        layerId?: string;
        outlineSourceId?: string;
        outlineLayerId?: string;
    });
    draw(entities: PolygonEntity<MapboxActualPolygon>[]): boolean;
    private ensureStyleResources;
}

declare class MapboxPolygonOverlayRenderer extends AbstractPolygonOverlayRenderer<MapboxMapViewHolder, MapboxActualPolygon> {
    readonly layer: MapboxPolygonLayer;
    readonly polygonManager: PolygonManagerInterface<MapboxActualPolygon>;
    constructor({ layer, polygonManager, holder, }: {
        layer: MapboxPolygonLayer;
        polygonManager: PolygonManagerInterface<MapboxActualPolygon>;
        holder: MapboxMapViewHolder;
    });
    createPolygon(state: PolygonState): Promise<MapboxActualPolygon | null>;
    updatePolygonProperties({ current, }: {
        polygon: MapboxActualPolygon;
        current: PolygonEntity<MapboxActualPolygon>;
        prev: PolygonEntity<MapboxActualPolygon>;
    }): Promise<MapboxActualPolygon | null>;
    removePolygon(_entity: PolygonEntity<MapboxActualPolygon>): Promise<void>;
    onPostProcess(): Promise<void>;
}

declare class MapboxPolygonConductor {
    readonly polygonOverlay: MapboxPolygonOverlayRenderer;
    clickListener: OnPolygonEventHandler | null;
    private operation;
    constructor(polygonOverlay: MapboxPolygonOverlayRenderer);
    composition(data: PolygonState[]): Promise<void>;
    update(state: PolygonState): Promise<void>;
    has(state: PolygonState): boolean;
    resync(): Promise<void>;
    clear(): Promise<void>;
    private redraw;
    /**
     * Hit-test a map click (its lat/lng) against the polygons geometrically
     * (point-in-polygon, honouring holes and zIndex) and dispatch the click on the
     * top-most polygon that contains the point. Does NOT use a MapLibre
     * layer/overlay click event — detection is driven by the map click position,
     * matching the marker/polyline paths and android. Returns true if hit.
     */
    handleMapClick(clicked: GeoPoint): boolean;
    private enqueue;
}

declare class MapboxGroundImageOverlayRenderer extends AbstractGroundImageOverlayRenderer<MapboxMapViewHolder, string> {
    private readonly canEditStyle;
    /** Last values applied to the map style, keyed by state id. */
    private readonly applied;
    constructor({ holder, canEditStyle, }: {
        holder: MapboxMapViewHolder;
        canEditStyle: () => boolean;
    });
    sourceId(id: string): string;
    layerId(id: string): string;
    createGroundImage(state: GroundImageState): Promise<string | null>;
    updateGroundImageProperties({ current, }: {
        groundImage: string;
        current: GroundImageEntity<string>;
        prev: GroundImageEntity<string>;
    }): Promise<string | null>;
    /** Sync an already-created image source+layer to the current state (diffed). */
    private applyToExisting;
    removeGroundImage(entity: GroundImageEntity<string>): Promise<void>;
}

declare class MapboxGroundImageController {
    private readonly groundImageStates;
    private readonly groundImageIds;
    private readonly pendingUpdates;
    private readonly renderer;
    private updateFrame;
    constructor(renderer: MapboxGroundImageOverlayRenderer);
    composition(data: GroundImageState[]): void;
    update(state: GroundImageState): void;
    has(state: GroundImageState): boolean;
    hasClickableAt(point: GeoPoint): boolean;
    dispatchClick(point: GeoPoint): boolean;
    resync(): void;
    clear(): void;
    private cancelPendingUpdates;
    private upsert;
    private removeById;
}

/** GL のソース／レイヤー ID の対。android-sdk の MapboxRasterLayerHandle と同一。 */
interface MapboxRasterLayerHandle {
    readonly sourceId: string;
    readonly layerId: string;
}
/**
 * android-sdk と同じく汎用 RasterLayerController が駆動する OverlayRenderer 実装。
 * onAdd/onChange/onRemove でネイティブ GL のソース・レイヤーを操作する。スタイルが
 * まだ編集できない場合はハンドルだけ返し、スタイル (再)読み込み後に controller.resync()
 * で貼り直す。
 */
declare class MapboxRasterLayerOverlayRenderer implements RasterLayerOverlayRenderer<MapboxRasterLayerHandle> {
    readonly holder: MapboxMapViewHolder;
    private readonly canEditStyle;
    constructor(holder: MapboxMapViewHolder, canEditStyle: () => boolean);
    private sourceId;
    private layerId;
    onAdd(data: RasterLayerAddParams[]): Promise<(MapboxRasterLayerHandle | null)[]>;
    onChange(data: RasterLayerChangeParams<MapboxRasterLayerHandle>[]): Promise<(MapboxRasterLayerHandle | null)[]>;
    onRemove(data: RasterLayerEntity<MapboxRasterLayerHandle>[]): Promise<void>;
    onCameraChanged(_mapCameraPosition: MapCameraPosition): Promise<void>;
    onPostProcess(): Promise<void>;
    private addLayer;
    private updateLayer;
    private removeLayer;
}

/**
 * android-sdk の MapboxRasterLayerController と同じく汎用 RasterLayerController の薄い
 * サブクラス。composition/update/has/clear は基底クラスが提供する。GL スタイルが
 * 再読み込みされると既存のソース・レイヤーは失われるため、resync() で登録済みの
 * ラスターレイヤーを貼り直す（android-sdk の reapplyStyle 相当）。
 */
declare class MapboxRasterLayerController extends RasterLayerController<MapboxRasterLayerHandle> {
    /**
     * mapbox-gl の transformRequest（MapboxProvider が地図生成時に差している）。
     * android / ios の Mapbox SDK には同等の口が無く、web だけが対応できる。
     *
     * userAgent はブラウザが上書きを許さないので、どのプロバイダでも web では効かない。
     */
    protected get headerSupport(): RasterHeaderSupport;
    constructor(renderer: MapboxRasterLayerOverlayRenderer);
    resync(): Promise<void>;
}

declare class MapboxViewController extends BaseMapViewController implements MapViewControllerInterface, MarkerCapable, CircleCapable, PolylineCapable, PolygonCapable, GroundImageCapable, RasterLayerCapable {
    private readonly mapInstance;
    private initialized;
    private logicalTiltHint;
    private readonly styleReadyRef;
    /** 現在の投影法。android-sdk の MapboxMapViewController の projection と同じ役割。 */
    private projection;
    readonly holder: MapboxMapViewHolder;
    private readonly markerController;
    private readonly markerEventController;
    private readonly circleController;
    private readonly polylineController;
    private readonly polygonController;
    private readonly groundImageController;
    private readonly rasterLayerController;
    constructor(holder: MapboxMapViewHolder, markerController: MapboxMarkerController, markerEventController: MapboxMarkerEventController, circleController: MapboxCircleController, polylineController: MapboxPolylineController, polygonController: MapboxPolygonConductor, groundImageController: MapboxGroundImageController, rasterLayerController: MapboxRasterLayerController, styleReadyRef?: {
        current: boolean;
    }, logicalTiltHint?: number | null, projection?: MapProjection);
    getMap(): Map;
    /**
     * 投影法を切り替える。android-sdk の `MapboxMapViewController.setProjection` /
     * ios-sdk の `Coordinator.setProjection` と同じく、同値なら何もしない。
     */
    setProjection(projection: MapProjection): void;
    applyUISettings(settings: MapUISettings): void;
    private setupEventListeners;
    setMapInitializedListener(listener: OnMapInitializedHandler | null): void;
    moveCamera(position: MapCameraPosition): Promise<boolean>;
    animateCamera(position: MapCameraPosition, durationMillis: number): Promise<boolean>;
    fitBounds(bounds: GeoRectBounds, padding: number): Promise<boolean>;
    getCameraPosition(): MapCameraPosition | null;
    compositionMarkers(data: MarkerState[]): Promise<void>;
    updateMarker(state: MarkerState): Promise<void>;
    hasMarker(state: MarkerState): boolean;
    setOnMarkerClickListener(_listener: OnMarkerEventHandler | null): void;
    setOnMarkerDragStart(_listener: OnMarkerEventHandler | null): void;
    setOnMarkerDrag(_listener: OnMarkerEventHandler | null): void;
    setOnMarkerDragEnd(_listener: OnMarkerEventHandler | null): void;
    setOnMarkerAnimateStart(_listener: OnMarkerEventHandler | null): void;
    setOnMarkerAnimateEnd(_listener: OnMarkerEventHandler | null): void;
    setMarkerAnimationOverlayHost(host: MarkerAnimationOverlayHost | null): void;
    compositionCircles(data: CircleState[]): Promise<void>;
    updateCircle(state: CircleState): Promise<void>;
    hasCircle(state: CircleState): boolean;
    setOnCircleClickListener(_listener: OnCircleEventHandler | null): void;
    compositionPolylines(data: PolylineState[]): Promise<void>;
    updatePolyline(state: PolylineState): Promise<void>;
    hasPolyline(state: PolylineState): boolean;
    setOnPolylineClickListener(_listener: OnPolylineEventHandler | null): void;
    compositionPolygons(data: PolygonState[]): Promise<void>;
    updatePolygon(state: PolygonState): Promise<void>;
    hasPolygon(state: PolygonState): boolean;
    setOnPolygonClickListener(_listener: OnPolygonEventHandler | null): void;
    compositionGroundImages(data: GroundImageState[]): Promise<void>;
    updateGroundImage(state: GroundImageState): Promise<void>;
    hasGroundImage(state: GroundImageState): boolean;
    setOnGroundImageClickListener(_listener: OnGroundImageEventHandler | null): void;
    compositionRasterLayers(data: RasterLayerState[]): Promise<void>;
    updateRasterLayer(state: RasterLayerState): Promise<void>;
    hasRasterLayer(state: RasterLayerState): boolean;
    clearOverlays(): Promise<void>;
    /**
     * Mapbox はネイティブの範囲制限 API を持つので、
     * `BaseMapViewController` のクランプ方式ではなく直接適用する。
     * android-sdk の `MapboxMapViewController.setCameraRestriction` と同じ方針。
     */
    setCameraRestriction(restriction: CameraRestriction | null): void;
    destroy(): void;
}

interface MapboxMapDesignType extends MapDesignTypeInterface<string> {
    readonly styleJsonURL: string;
}
declare class MapboxDesign implements MapboxMapDesignType {
    readonly id: string;
    readonly styleJsonURL: string;
    readonly attributionRules: readonly AttributionRule[];
    constructor(id: string, styleJsonURL: string, attributionRules?: readonly AttributionRule[]);
    getValue(): string;
    static readonly Streets: MapboxDesign;
    static readonly Outdoors: MapboxDesign;
    static readonly Light: MapboxDesign;
    static readonly Dark: MapboxDesign;
    static readonly SatelliteStreets: MapboxDesign;
    static readonly OsmBright: MapboxDesign;
    static readonly OsmBrightEn: MapboxDesign;
    static readonly OsmBrightJa: MapboxDesign;
    static readonly MapTilerTonerJa: MapboxDesign;
    static readonly MapTilerTonerEn: MapboxDesign;
    static readonly MapTilerBasicEn: MapboxDesign;
    static readonly MapTilerBasicJa: MapboxDesign;
    static readonly OpenMapTiles: MapboxDesign;
}

interface MapboxViewStateInterface extends MapViewStateInterface<MapboxMapDesignType> {
    readonly accessToken?: string;
}
interface MapboxViewStateParams {
    id?: string;
    accessToken?: string;
    mapDesignType?: MapboxMapDesignType;
    cameraPosition?: MapCameraPosition;
}
declare class MapboxViewState extends MapViewState<MapboxMapDesignType> implements MapboxViewStateInterface {
    readonly id: string;
    readonly accessToken?: string;
    private _cameraPosition;
    private _mapDesignType;
    private _controller;
    private _cameraPositionChangeListener;
    constructor({ id, accessToken, mapDesignType, cameraPosition, }?: MapboxViewStateParams);
    get cameraPosition(): MapCameraPosition;
    get mapDesignType(): MapboxMapDesignType;
    set mapDesignType(value: MapboxMapDesignType);
    moveCameraTo(position: GeoPoint, durationMillis?: number): void;
    moveCameraTo(cameraPosition: MapCameraPosition, durationMillis?: number): void;
    getMapViewHolder(): MapViewHolder<unknown, unknown> | null;
    fitBounds(bounds: GeoRectBounds, padding?: number): void;
    setController(ctrl: MapViewControllerInterface | null): void;
    updateCameraPosition(camera: MapCameraPosition): void;
    setCameraPositionChangeListener(listener: ((camera: MapCameraPosition) => void) | null): void;
    private resolveCameraPosition;
}
declare function useMapboxViewState(params?: MapboxViewStateParams): MapboxViewStateInterface;

interface MapBoxMapViewProps extends MapViewBaseProps<MapboxViewStateInterface> {
    maxZoom?: number;
    minZoom?: number;
    /** Restricts panning/zooming so the viewport cannot leave this rectangle. */
    restrictBounds?: GeoRectBounds;
    containerStyle?: React.CSSProperties;
    onError?: (error: Error) => void;
    children?: React.ReactNode;
    markerTilingOptions?: MarkerTilingOptions;
    /**
     * 投影法。省略時は 3D 版が Globe、2D 版が Mercator。
     * android-sdk / ios-sdk の `projection: MapProjection` と同じ役割で、
     * 変更すると実行時に切り替わる。
     */
    projection?: MapProjection;
}
declare function MapBoxMapView(props: MapBoxMapViewProps): React.JSX.Element;
declare function MapBoxMapView2D(props: MapBoxMapViewProps): React.JSX.Element;

declare class ZoomAltitudeConverter extends AbstractZoomAltitudeConverter {
    /** Empirical offset: GoogleZoom ≈ MapboxSDK.zoom + 1.0 */
    static readonly MAPBOX_TO_GOOGLE_ZOOM_OFFSET = 1;
    static mapboxZoomToGoogleZoom(mapboxZoom: number): number;
    static googleZoomToMapboxZoom(googleZoom: number): number;
    private cosLatitudeFactor;
    private cosTiltFactor;
    zoomLevelToAltitude({ zoomLevel, latitude, tilt, }: {
        zoomLevel: number;
        latitude: number;
        tilt: number;
    }): number;
    altitudeToZoomLevel({ altitude, latitude, tilt, }: {
        altitude: number;
        latitude: number;
        tilt: number;
    }): number;
}

export { MapBoxMapView, MapBoxMapView2D, type MapBoxMapViewProps, type MapboxConfig, MapboxDesign, type MapboxMapDesignType, MapboxProvider, MapboxViewController, MapboxViewState, type MapboxViewStateInterface, ZoomAltitudeConverter, useMapboxViewState };
