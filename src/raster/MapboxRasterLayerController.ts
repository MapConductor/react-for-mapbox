import {
  createRasterLayerEntity,
  RasterLayerController,
  RasterLayerManager,
} from '@mapconductor/js-sdk-core';
import {
  type MapboxRasterLayerHandle,
  MapboxRasterLayerOverlayRenderer,
} from './MapboxRasterLayerOverlayRenderer';

/**
 * android-sdk の MapboxRasterLayerController と同じく汎用 RasterLayerController の薄い
 * サブクラス。composition/update/has/clear は基底クラスが提供する。GL スタイルが
 * 再読み込みされると既存のソース・レイヤーは失われるため、resync() で登録済みの
 * ラスターレイヤーを貼り直す（android-sdk の reapplyStyle 相当）。
 */
export class MapboxRasterLayerController extends RasterLayerController<MapboxRasterLayerHandle> {
  constructor(renderer: MapboxRasterLayerOverlayRenderer) {
    super({ rasterLayerManager: new RasterLayerManager<MapboxRasterLayerHandle>(), renderer });
  }

  async resync(): Promise<void> {
    const states = this.rasterLayerManager.allEntities().map((entity) => entity.state);
    if (states.length === 0) return;
    const layers = await this.renderer.onAdd(states.map((state) => ({ state })));
    layers.forEach((layer, index) => {
      if (layer != null) {
        this.rasterLayerManager.registerEntity(
          createRasterLayerEntity({ layer, state: states[index] }),
        );
      }
    });
    await this.renderer.onPostProcess();
  }
}
