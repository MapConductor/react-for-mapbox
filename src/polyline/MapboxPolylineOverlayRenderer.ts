import {
  AbstractPolylineOverlayRenderer,
  buildUnwrappedPolylinePath,
  type PolylineEntity,
  type PolylineManagerInterface,
  type PolylineState,
} from '@mapconductor/js-sdk-core';
import type { LineFeature } from '../helpers';
import { MapboxMapViewHolder } from '../MapboxMapViewHolder';
import {
  MapboxPolylineLayer,
  type MapboxActualPolyline,
} from './MapboxPolylineLayer';

export class MapboxPolylineOverlayRenderer extends AbstractPolylineOverlayRenderer<
  MapboxMapViewHolder,
  MapboxActualPolyline
> {
  readonly layer: MapboxPolylineLayer;
  readonly polylineManager: PolylineManagerInterface<MapboxActualPolyline>;

  constructor({
    layer,
    polylineManager,
    holder,
  }: {
    layer: MapboxPolylineLayer;
    polylineManager: PolylineManagerInterface<MapboxActualPolyline>;
    holder: MapboxMapViewHolder;
  }) {
    super(holder);
    this.layer = layer;
    this.polylineManager = polylineManager;
  }

  async createPolyline(state: PolylineState): Promise<MapboxActualPolyline | null> {
    if (state.points.length < 2) return null;
    return createMapboxLines(state, this.resolveZIndex(state));
  }

  async updatePolylineProperties({
    current,
  }: {
    polyline: MapboxActualPolyline;
    current: PolylineEntity<MapboxActualPolyline>;
    prev: PolylineEntity<MapboxActualPolyline>;
  }): Promise<MapboxActualPolyline | null> {
    return this.createPolyline(current.state);
  }

  async removePolyline(_entity: PolylineEntity<MapboxActualPolyline>): Promise<void> {
    // The source is rewritten from the remaining manager entities in onPostProcess().
  }

  override async onPostProcess(): Promise<void> {
    this.layer.draw(this.polylineManager.allEntities());
  }

  async redraw(): Promise<void> {
    await this.onPostProcess();
  }

  private resolveZIndex(state: PolylineState): number {
    if (state.zIndex !== 0) return state.zIndex;
    return typeof state.extra === 'number' ? state.extra : 0;
  }
}

function createMapboxLines(
  state: PolylineState,
  zIndex: number,
): MapboxActualPolyline {
  // Unwrapped path (longitudes continuous, may exceed ±180): Mapbox GL renders
  // it seamlessly across the antimeridian without splitting.
  const path = buildUnwrappedPolylinePath(state.points, state.geodesic);
  if (path.length < 2) return [];

  const feature: LineFeature = {
    type: 'Feature',
    id: `polyline-${state.id}-0`,
    geometry: {
      type: 'LineString',
      coordinates: path.map((point) => [point.longitude, point.latitude]),
    },
    properties: {
      id: `polyline-${state.id}-0`,
      [MapboxPolylineLayer.Prop.STROKE_COLOR]: state.strokeColor,
      [MapboxPolylineLayer.Prop.STROKE_WIDTH]: state.strokeWidth,
      [MapboxPolylineLayer.Prop.Z_INDEX]: zIndex,
    },
  };
  return [feature];
}
