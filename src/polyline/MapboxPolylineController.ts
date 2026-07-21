import type { MapLayerMouseEvent } from 'mapbox-gl';
import {
  PolylineController,
  type PolylineState,
} from '@mapconductor/js-sdk-core';
import { lngLatFromEvent } from '../helpers';
import { MapboxMapViewHolder } from '../MapboxMapViewHolder';
import {
  type MapboxActualPolyline,
} from './MapboxPolylineLayer';
import { MapboxPolylineOverlayRenderer } from './MapboxPolylineOverlayRenderer';

export class MapboxPolylineController extends PolylineController<MapboxActualPolyline> {
  declare readonly renderer: MapboxPolylineOverlayRenderer;

  constructor(
    private readonly holder: MapboxMapViewHolder,
    renderer: MapboxPolylineOverlayRenderer,
  ) {
    super({ polylineManager: renderer.polylineManager, renderer });
  }

  override async add(data: PolylineState[]): Promise<void> {
    await super.add(data);
    this.ensureClickHandler();
  }

  async resync(): Promise<void> {
    this.detachClickHandler();
    await this.renderer.redraw();
    this.ensureClickHandler();
  }

  override async clear(): Promise<void> {
    await super.clear();
    await this.renderer.redraw();
  }

  override destroy(): void {
    this.detachClickHandler();
    super.destroy();
  }

  private clickHandlerAttached = false;

  private ensureClickHandler(): void {
    if (this.clickHandlerAttached || !this.holder.map.getLayer(this.renderer.layer.layerId)) {
      return;
    }
    this.holder.map.on('click', this.renderer.layer.layerId, this.handleClick);
    this.clickHandlerAttached = true;
  }

  private detachClickHandler(): void {
    if (!this.clickHandlerAttached) return;
    this.holder.map.off('click', this.renderer.layer.layerId, this.handleClick);
    this.clickHandlerAttached = false;
  }

  private readonly handleClick = (event: MapLayerMouseEvent): void => {
    const clicked = lngLatFromEvent(event);
    const camera = this.holder.getController()?.getCameraPosition();
    if (camera) void this.onCameraChanged(camera);

    const hit = this.findWithClosestPoint(clicked);
    if (!hit) return;
    this.dispatchClick({
      state: hit.entity.state,
      clicked: hit.closestPoint,
    });
  };
}
