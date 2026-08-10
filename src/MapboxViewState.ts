import {
  useState } from 'react';
import {
  MapViewState,
  type MapViewStateInterface,
  type MapCameraPosition,
  MapCameraPosition as MapCameraPositionNS,
  createRandomId,
} from '@mapconductor/js-sdk-core';
import { MapboxDesign, type MapboxMapDesignType } from './MapboxDesign';

export interface MapboxViewStateInterface
  extends MapViewStateInterface<MapboxMapDesignType> {
  readonly accessToken?: string;
}

export interface MapboxViewStateParams {
  id?: string;
  accessToken?: string;
  mapDesignType?: MapboxMapDesignType;
  cameraPosition?: MapCameraPosition;
}

export class MapboxViewState
  extends MapViewState<MapboxMapDesignType>
  implements MapboxViewStateInterface {
  readonly accessToken?: string;
  private _mapDesignType: MapboxMapDesignType;

  constructor({
    id = createRandomId(),
    accessToken,
    mapDesignType = MapboxDesign.Streets,
    cameraPosition = MapCameraPositionNS.Default,
  }: MapboxViewStateParams = {}) {
    super({ id, cameraPosition });
    this.accessToken = accessToken;
    this._mapDesignType = mapDesignType;
  }

  override get mapDesignType(): MapboxMapDesignType {
    return this._mapDesignType;
  }

  override set mapDesignType(value: MapboxMapDesignType) {
    this._mapDesignType = value;
  }

  // Called by MapboxView when controller is initialized

  // Called by MapboxView when camera position changes

  // If zoom/bearing/tilt are all 0, treat as position-only update (matches Android/iOS behavior)
}

export function useMapboxViewState(params: MapboxViewStateParams = {}): MapboxViewStateInterface {
  const [state] = useState(() => new MapboxViewState(params));
  return state;
}
