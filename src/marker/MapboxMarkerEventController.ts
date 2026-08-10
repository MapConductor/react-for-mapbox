import { DefaultMarkerEventController, type MarkerEventHost } from '@mapconductor/js-sdk-core';
import { MapboxMarkerController } from './MapboxMarkerController';
import { type MapboxActualMarker } from './MarkerLayer';

/**
 * Mapbox のマーカーイベント。
 *
 * ドラッグの状態遷移・パン抑止・リスナー転送はすべてコアの
 * {@link DefaultMarkerEventController} が持つ。ここに残るのは
 * **Mapbox 固有のもの**だけ——いまは何も無い。
 *
 * 移行前はこのファイルが 165 行あり、maplibre / mapbox / maptiler / tomtom / longdo の
 * 5 本が**型名以外 1 文字も違わなかった**。
 */
export class MapboxMarkerEventController extends DefaultMarkerEventController<MapboxActualMarker> {
    constructor(controller: MapboxMarkerController) {
        super(controller as unknown as MarkerEventHost<MapboxActualMarker>);
    }
}
