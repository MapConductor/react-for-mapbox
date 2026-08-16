// React Native から安全に読める入口。地図の描画実装（`MapboxView.web`）を含まない。
//
// ルートの barrel は `mapbox-gl` を実行時に引き込む。ブラウザ向けバンドラなら問題ないが、
// Metro/Hermes はこれを即時評価するため、React Native に存在しないブラウザの
// グローバル（window / document）で落ちる。
// `@mapconductor/reactnative-for-mapbox` はルートではなくここから import する。
// react-for-maptiler / react-for-longdo / react-for-maplibre の state.ts と同じ取り決め。
//
// ここから出す 2 つは web SDK を実行時に一切参照しない。
export { MapboxDesign, type MapboxMapDesignType } from './MapboxDesign';
export {
  MapboxViewState,
  useMapboxViewState,
  type MapboxViewStateInterface,
  type MapboxViewStateParams,
} from './MapboxViewState';
