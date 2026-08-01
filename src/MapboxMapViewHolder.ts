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
    // project() maps longitude literally and does NOT pick the world copy
    // nearest the viewport, so when the map is panned across the antimeridian a
    // wrapped position projects ~360° off-screen and screen-space overlays
    // (marker drop/bounce animations, info bubbles) render off-view. Shift the
    // longitude into the same world copy as the current center before projecting.
    const centerLng = this.map.getCenter().lng;
    const lng = position.longitude + 360 * Math.round((centerLng - position.longitude) / 360);
    const point = this.map.project([lng, position.latitude]);
    return { x: point.x, y: point.y };
  }

  fromScreenOffsetSync(offset: Offset): GeoPoint {
    const lngLat = this.map.unproject([offset.x, offset.y]);
    return createGeoPoint({ latitude: lngLat.lat, longitude: lngLat.lng });
  }
}
