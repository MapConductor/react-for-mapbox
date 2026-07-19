import type {
  ExpressionSpecification,
  GeoJSONSource,
  LayerSpecification,
} from 'mapbox-gl';
import { Earth, type CircleEntity } from '@mapconductor/js-sdk-core';
import { bringMarkerLayersToFront, type FeatureCollection, type PointFeature } from '../helpers';
import { MapboxMapViewHolder } from '../MapboxMapViewHolder';

export type MapboxActualCircle = PointFeature;

export class MapboxCircleLayer {
  static readonly Prop = {
    RADIUS: 'radius',
    LATITUDE_CORRECTION: 'latitudeCorrection',
    FILL_COLOR: 'fillColor',
    STROKE_COLOR: 'strokeColor',
    STROKE_WIDTH: 'strokeWidth',
    Z_INDEX: 'zIndex',
  } as const;

  private static readonly TILE_SIZE = 512;

  private readonly holder: MapboxMapViewHolder;
  private readonly canEditStyle: () => boolean;
  readonly sourceId: string;
  readonly layerId: string;

  constructor({
    holder,
    canEditStyle,
    sourceId = 'circle-source',
    layerId = 'circle-layer',
  }: {
    holder: MapboxMapViewHolder;
    canEditStyle: () => boolean;
    sourceId?: string;
    layerId?: string;
  }) {
    this.holder = holder;
    this.canEditStyle = canEditStyle;
    this.sourceId = sourceId;
    this.layerId = layerId;
  }

  draw(entities: CircleEntity<MapboxActualCircle>[]): boolean {
    if (!this.ensureStyleResources()) return false;

    const data: FeatureCollection = {
      type: 'FeatureCollection',
      features: entities.map((entity) => entity.circle),
    };

    try {
      const source = this.holder.map.getSource(this.sourceId) as GeoJSONSource | undefined;
      if (!source) return false;
      source.setData(data);
      return true;
    } catch {
      return false;
    }
  }

  private ensureStyleResources(): boolean {
    const map = this.holder.map;
    const needsSetup = !map.getSource(this.sourceId) || !map.getLayer(this.layerId);
    if (needsSetup && !this.canEditStyle()) return false;

    try {
      if (!map.getSource(this.sourceId)) {
        map.addSource(this.sourceId, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
      }
      if (!map.getLayer(this.layerId)) {
        const beforeId = map.getLayer('polygon-fill-layer')
          ? 'polygon-fill-layer'
          : map.getLayer('polyline-layer')
            ? 'polyline-layer'
            : map.getLayer('mc-marker-layer')
              ? 'mc-marker-layer'
              : undefined;
        map.addLayer(
          {
            id: this.layerId,
            type: 'circle',
            source: this.sourceId,
            layout: {
              'circle-sort-key': ['get', MapboxCircleLayer.Prop.Z_INDEX],
            },
            paint: {
              'circle-radius': this.radiusExpression(),
              'circle-color': ['get', MapboxCircleLayer.Prop.FILL_COLOR],
              'circle-stroke-color': ['get', MapboxCircleLayer.Prop.STROKE_COLOR],
              'circle-stroke-width': ['get', MapboxCircleLayer.Prop.STROKE_WIDTH],
            },
          } as LayerSpecification,
          beforeId,
        );
      }
      bringMarkerLayersToFront(map);
    } catch {
      return false;
    }

    return map.getSource(this.sourceId) != null && map.getLayer(this.layerId) != null;
  }

  private radiusExpression(): ExpressionSpecification {
    const radiusAtZoomZero = [
      '*',
      ['get', MapboxCircleLayer.Prop.RADIUS],
      [
        '/',
        MapboxCircleLayer.TILE_SIZE,
        [
          '*',
          ['get', MapboxCircleLayer.Prop.LATITUDE_CORRECTION],
          Earth.CIRCUMFERENCE_METERS,
        ],
      ],
    ] as ExpressionSpecification;

    return [
      'interpolate',
      ['exponential', 2],
      ['zoom'],
      0,
      radiusAtZoomZero,
      22,
      ['*', radiusAtZoomZero, 4194304],
    ] as ExpressionSpecification;
  }
}
