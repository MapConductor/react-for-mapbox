import type { MapLayerMouseEvent } from 'mapbox-gl';
import {
  CircleController,
  type CircleState,
} from '@mapconductor/js-sdk-core';
import { lngLatFromEvent } from '../helpers';
import { MapboxMapViewHolder } from '../MapboxMapViewHolder';
import {
  type MapboxActualCircle,
} from './MapboxCircleLayer';
import { MapboxCircleOverlayRenderer } from './MapboxCircleOverlayRenderer';

export class MapboxCircleController extends CircleController<MapboxActualCircle> {
  declare readonly renderer: MapboxCircleOverlayRenderer;

  constructor(
    private readonly holder: MapboxMapViewHolder,
    renderer: MapboxCircleOverlayRenderer,
  ) {
    super({ circleManager: renderer.circleManager, renderer });
  }

  override async add(data: CircleState[]): Promise<void> {
    await super.add(data);
    this.ensureClickHandler();
  }

  override async update(state: CircleState): Promise<void> {
    await super.update(state);
    await this.renderer.redraw();
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
    const entity = this.find(clicked);
    if (!entity) return;
    this.dispatchClick({ state: entity.state, clicked });
  };
}
