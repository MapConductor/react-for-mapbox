[English](./README.md) | 日本語 | [Español (Latinoamérica)](./README.es-419.md)

# @mapconductor/react-for-mapbox

MapConductor React SDK の Mapbox GL JS プロバイダです。MapConductor のプロバイダ非依存なカメラ・マーカー・オーバーレイ API を通じて Mapbox の地図を描画するため、同じアプリケーションコードが Google Maps、MapLibre、Leaflet、OpenLayers、ArcGIS、Cesium、HERE でもそのまま動作します。

## インストール

```shell
npm install @mapconductor/react-for-mapbox
```

`@mapconductor/js-sdk-core` と `@mapconductor/js-sdk-react`(マーカーなどの共有コンポーネントで使用)は依存関係として自動的にインストールされます。ただしアプリケーションコードはこの2つから直接 import するため、pnpm の strict(isolated)な `node_modules` を使う場合や、import するものをすべて明示的に宣言したい場合は、次のように明示的にインストールしてください:

```shell
npm install @mapconductor/react-for-mapbox @mapconductor/js-sdk-core @mapconductor/js-sdk-react
```

`mapbox-gl` は依存関係として同梱されています。`mapbox://` 形式のスタイルプリセットには [Mapbox アカウント](https://account.mapbox.com/)のアクセストークンが必要です。OSM ベースのプリセットはトークンなしで動作します。

## クイックスタート

```tsx
import { createGeoPoint, createMapCameraPosition } from '@mapconductor/js-sdk-core';
import { Marker } from '@mapconductor/js-sdk-react';
import {
  MapboxDesign,
  MapBoxMapView2D,
  useMapboxViewState,
} from '@mapconductor/react-for-mapbox';
import '@mapconductor/react-for-mapbox/style.css';

const TOKYO = createGeoPoint({ latitude: 35.6812, longitude: 139.7671 });

export function App() {
  const state = useMapboxViewState({
    accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    mapDesignType: MapboxDesign.Streets,
    cameraPosition: createMapCameraPosition({ position: TOKYO, zoom: 12 }),
  });

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MapBoxMapView2D
        state={state}
        onMapClick={point => console.log('clicked', point.latitude, point.longitude)}
        onCameraMoveEnd={camera => console.log('zoom', camera.zoom)}
      >
        <Marker position={TOKYO} />
      </MapBoxMapView2D>
    </div>
  );
}
```

グローブ(地球儀)投影を使う場合は `MapBoxMapView2D` の代わりに `MapBoxMapView` を使用します。

## マップデザイン

`MapboxDesign` には Mapbox ホストの `Streets`、`Outdoors`、`Light`、`Dark`、`SatelliteStreets`(トークン必須)と、openstreetmap.jp ホストの `OsmBright`、`OsmBrightEn`、`OsmBrightJa`(トークン不要)が含まれます。実行時に切り替えるには `state.mapDesignType = ...` を代入します。

## 関連パッケージ

- [`@mapconductor/js-sdk-core`](../js-sdk-core) — ジオメトリ・カメラ・状態のプリミティブ
- [`@mapconductor/js-sdk-react`](../js-sdk-react) — 共有の `Marker`・`Markers`・シェイプ・インフォバブル
