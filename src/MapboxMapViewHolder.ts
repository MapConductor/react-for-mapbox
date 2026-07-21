import type { Map as MapboxMap } from 'mapbox-gl';
import {
  createGeoPoint,
  MapViewHolderBase,
  type GeoPoint,
  type GeoPointInterface,
  type Offset,
} from '@mapconductor/js-sdk-core';
import type { MapboxViewController } from './MapboxViewController';

export class MapboxMapViewHolder extends MapViewHolderBase<HTMLElement, MapboxMap> {
  private _controller: MapboxViewController | null = null;

  constructor(
    readonly mapView: HTMLElement,
    readonly map: MapboxMap,
  ) {
    super();
  }

  getController(): MapboxViewController | null {
    return this._controller;
  }

  setController(controller: MapboxViewController): void {
    this._controller = controller;
  }

  toScreenOffset(position: GeoPointInterface): Offset {
    const point = this.map.project([position.longitude, position.latitude]);
    return { x: point.x, y: point.y };
  }

  fromScreenOffsetSync(offset: Offset): GeoPoint {
    const lngLat = this.map.unproject([offset.x, offset.y]);
    return createGeoPoint({ latitude: lngLat.lat, longitude: lngLat.lng });
  }
}
