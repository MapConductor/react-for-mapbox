import type { AttributionRule, MapDesignTypeInterface } from '@mapconductor/js-sdk-core';

export interface MapboxMapDesignType extends MapDesignTypeInterface<string> {
  readonly styleJsonURL: string;
}

export class MapboxDesign implements MapboxMapDesignType {
  readonly id: string;
  readonly styleJsonURL: string;
  readonly attributionRules: readonly AttributionRule[];

  constructor(
    id: string,
    styleJsonURL: string,
    attributionRules: readonly AttributionRule[] = []
  ) {
    this.id = id;
    this.styleJsonURL = styleJsonURL;
    this.attributionRules = attributionRules;
  }

  getValue(): string {
    return `mapDesign_id=${this.id},style=${this.styleJsonURL}`;
  }

  static readonly Streets = new MapboxDesign('streets', 'mapbox://styles/mapbox/streets-v12');
  static readonly Outdoors = new MapboxDesign('outdoors', 'mapbox://styles/mapbox/outdoors-v12');
  static readonly Light = new MapboxDesign('light', 'mapbox://styles/mapbox/light-v11');
  static readonly Dark = new MapboxDesign('dark', 'mapbox://styles/mapbox/dark-v11');
  static readonly SatelliteStreets = new MapboxDesign('satellite-streets', 'mapbox://styles/mapbox/satellite-streets-v12');
  static readonly OsmBright = new MapboxDesign('osm-bright', 'https://tile.openstreetmap.jp/styles/osm-bright/style.json');
  static readonly OsmBrightEn = new MapboxDesign('osm-bright-en', 'https://tile.openstreetmap.jp/styles/osm-bright-en/style.json');
  static readonly OsmBrightJa = new MapboxDesign('osm-bright-ja', 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json');
  static readonly MapTilerTonerJa = new MapboxDesign('maptiler-toner-ja', 'https://tile.openstreetmap.jp/styles/maptiler-toner-ja/style.json');
  static readonly MapTilerTonerEn = new MapboxDesign('maptiler-toner-en', 'https://tile.openstreetmap.jp/styles/maptiler-toner-en/style.json');
  static readonly MapTilerBasicEn = new MapboxDesign('maptiler-basic-en', 'https://tile.openstreetmap.jp/styles/maptiler-basic-en/style.json');
  static readonly MapTilerBasicJa = new MapboxDesign('maptiler-basic-ja', 'https://tile.openstreetmap.jp/styles/maptiler-basic-ja/style.json');
  static readonly OpenMapTiles = new MapboxDesign('openmaptiles', 'https://tile.openstreetmap.jp/styles/openmaptiles/style.json');
}
