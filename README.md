English | [日本語](./README.ja.md) | [Español (Latinoamérica)](./README.es-419.md)

# @mapconductor/react-for-mapbox

Mapbox GL JS provider for the MapConductor React SDK. Renders a Mapbox map
through MapConductor's provider-independent camera, marker, and overlay API, so
the same application code can also run on Google Maps, MapLibre, Leaflet,
OpenLayers, ArcGIS, Cesium, or HERE.

## Installation

```shell
npm install @mapconductor/react-for-mapbox
```

`@mapconductor/js-sdk-core` and `@mapconductor/js-sdk-react` (used for markers and
other shared components) are installed automatically as dependencies. Your
code imports from both directly, so with pnpm's strict (isolated)
`node_modules` — or whenever you prefer to declare everything you import —
install them explicitly instead:

```shell
npm install @mapconductor/react-for-mapbox @mapconductor/js-sdk-core @mapconductor/js-sdk-react
```

`mapbox-gl` is bundled as a dependency. The `mapbox://` style presets require an
access token from your [Mapbox account](https://account.mapbox.com/); the
OSM-based presets work without one.

## Quick start

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

Use `MapBoxMapView` instead of `MapBoxMapView2D` for the globe projection.

## Map designs

`MapboxDesign` ships `Streets`, `Outdoors`, `Light`, `Dark`,
`SatelliteStreets` (Mapbox-hosted, token required) and `OsmBright`,
`OsmBrightEn`, `OsmBrightJa` (openstreetmap.jp-hosted, no token). Switch at
runtime by assigning `state.mapDesignType = ...`.

## Related packages

- [`@mapconductor/js-sdk-core`](../js-sdk-core) — geometry, camera, and state primitives
- [`@mapconductor/js-sdk-react`](../js-sdk-react) — shared `Marker`, `Markers`, shapes, and info bubbles
