[English](./README.md) | [日本語](./README.ja.md) | Español (Latinoamérica)

# @mapconductor/react-for-mapbox

Proveedor de Mapbox GL JS para el SDK de React de MapConductor. Renderiza un mapa de Mapbox a través de la API de cámara, marcadores y superposiciones independiente del proveedor de MapConductor, de modo que el mismo código de aplicación también puede ejecutarse en Google Maps, MapLibre, Leaflet, OpenLayers, ArcGIS, Cesium o HERE.

## Instalación

```shell
npm install @mapconductor/react-for-mapbox
```

`@mapconductor/js-sdk-core` y `@mapconductor/js-sdk-react` (usados para marcadores y otros componentes compartidos) se instalan automáticamente como dependencias. Tu código importa directamente de ambos, así que con el `node_modules` estricto (aislado) de pnpm — o siempre que prefieras declarar todo lo que importas — instálalos explícitamente:

```shell
npm install @mapconductor/react-for-mapbox @mapconductor/js-sdk-core @mapconductor/js-sdk-react
```

`mapbox-gl` viene incluido como dependencia. Los presets de estilo `mapbox://` requieren un token de acceso de tu [cuenta de Mapbox](https://account.mapbox.com/); los presets basados en OSM funcionan sin token.

## Inicio rápido

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

Usa `MapBoxMapView` en lugar de `MapBoxMapView2D` para la proyección de globo.

## Diseños de mapa

`MapboxDesign` incluye `Streets`, `Outdoors`, `Light`, `Dark`, `SatelliteStreets` (alojados por Mapbox, requieren token) y `OsmBright`, `OsmBrightEn`, `OsmBrightJa` (alojados por openstreetmap.jp, sin token). Cambia en tiempo de ejecución asignando `state.mapDesignType = ...`.

## Paquetes relacionados

- [`@mapconductor/js-sdk-core`](../js-sdk-core) — primitivas de geometría, cámara y estado
- [`@mapconductor/js-sdk-react`](../js-sdk-react) — `Marker`, `Markers`, formas y burbujas de información compartidos
