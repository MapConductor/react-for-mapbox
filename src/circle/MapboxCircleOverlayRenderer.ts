import {
  AbstractCircleOverlayRenderer,
  circleToRing,
  closeRing,
  type CircleEntity,
  type CircleManagerInterface,
  type CircleState,
} from '@mapconductor/js-sdk-core';
import { MapboxMapViewHolder } from '../MapboxMapViewHolder';
import {
  MapboxCircleLayer,
  type MapboxActualCircle,
} from './MapboxCircleLayer';

export class MapboxCircleOverlayRenderer extends AbstractCircleOverlayRenderer<
  MapboxMapViewHolder,
  MapboxActualCircle
> {
  readonly layer: MapboxCircleLayer;
  readonly circleManager: CircleManagerInterface<MapboxActualCircle>;

  constructor({
    layer,
    circleManager,
    holder,
  }: {
    layer: MapboxCircleLayer;
    circleManager: CircleManagerInterface<MapboxActualCircle>;
    holder: MapboxMapViewHolder;
  }) {
    super(holder);
    this.layer = layer;
    this.circleManager = circleManager;
  }

  async createCircle(state: CircleState): Promise<MapboxActualCircle | null> {
    return createMapboxCircle(state);
  }

  async updateCircleProperties({
    current,
  }: {
    circle: MapboxActualCircle;
    current: CircleEntity<MapboxActualCircle>;
    prev: CircleEntity<MapboxActualCircle>;
  }): Promise<MapboxActualCircle | null> {
    return this.createCircle(current.state);
  }

  async removeCircle(_entity: CircleEntity<MapboxActualCircle>): Promise<void> {
    // The source is rewritten from the remaining manager entities in onPostProcess().
  }

  override async onPostProcess(): Promise<void> {
    this.layer.draw(this.circleManager.allEntities());
  }

  async redraw(): Promise<void> {
    await this.onPostProcess();
  }
}

function createMapboxCircle(state: CircleState): MapboxActualCircle | null {
  // Ground-anchored circle polygon from the shared core geometry. The ring is
  // unwrapped (longitudes may exceed ±180), which Mapbox GL renders seamlessly
  // across the antimeridian without splitting.
  const ring = closeRing(circleToRing(state.center, state.radiusMeters, state.geodesic));
  if (ring.length < 4) return null;
  const zIndex = state.zIndex ?? calculateZIndex(state.center.latitude, state.center.longitude);

  return {
    type: 'Feature',
    id: `circle-${state.id}`,
    geometry: {
      type: 'Polygon',
      coordinates: [ring.map((point) => [point.longitude, point.latitude])],
    },
    properties: {
      id: `circle-${state.id}`,
      [MapboxCircleLayer.Prop.FILL_COLOR]: state.fillColor,
      [MapboxCircleLayer.Prop.STROKE_COLOR]: state.strokeColor,
      [MapboxCircleLayer.Prop.STROKE_WIDTH]: state.strokeWidth,
      [MapboxCircleLayer.Prop.Z_INDEX]: zIndex,
    },
  };
}

function calculateZIndex(latitude: number, longitude: number): number {
  return Math.round(-latitude * 1_000_000 - longitude);
}
