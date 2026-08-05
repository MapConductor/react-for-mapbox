import { useState } from 'react';
import {
  MapViewState,
  type MapViewStateInterface,
  type GeoPoint,
  type MapCameraPosition,
  type MapViewControllerInterface,
  type GeoRectBounds,
  type MapViewHolder,
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
  readonly id: string;
  readonly accessToken?: string;
  private _cameraPosition: MapCameraPosition;
  private _mapDesignType: MapboxMapDesignType;
  private _controller: MapViewControllerInterface | null = null;
  private _cameraPositionChangeListener: ((camera: MapCameraPosition) => void) | null = null;

  constructor({
    id = createRandomId(),
    accessToken,
    mapDesignType = MapboxDesign.Streets,
    cameraPosition = MapCameraPositionNS.Default,
  }: MapboxViewStateParams = {}) {
    super();
    this.id = id;
    this.accessToken = accessToken;
    this._cameraPosition = cameraPosition;
    this._mapDesignType = mapDesignType;
  }

  override get cameraPosition(): MapCameraPosition {
    return this._cameraPosition;
  }

  override get mapDesignType(): MapboxMapDesignType {
    return this._mapDesignType;
  }

  override set mapDesignType(value: MapboxMapDesignType) {
    this._mapDesignType = value;
  }

  override moveCameraTo(position: GeoPoint, durationMillis?: number): void;
  override moveCameraTo(cameraPosition: MapCameraPosition, durationMillis?: number): void;
  override moveCameraTo(positionOrCamera: GeoPoint | MapCameraPosition, durationMillis?: number): void {
    const newPosition = 'zoom' in positionOrCamera
      ? this.resolveCameraPosition(positionOrCamera as MapCameraPosition)
      : this._cameraPosition.copy({ position: positionOrCamera as GeoPoint });

    const ctrl = this._controller;
    if (!ctrl) {
      this._cameraPosition = newPosition;
      return;
    }

    if (!durationMillis || durationMillis === 0) {
      ctrl.moveCamera(newPosition);
    } else {
      void ctrl.animateCamera(newPosition, { duration: durationMillis });
    }
    this._cameraPosition = newPosition;
    this._cameraPositionChangeListener?.(newPosition);
  }

  override getMapViewHolder(): MapViewHolder<unknown, unknown> | null {
    return this._controller?.holder ?? null;
  }

  override fitBounds(bounds: GeoRectBounds, padding: number = 0): void {
    void this._controller?.fitBounds(bounds, { padding });
  }

  // Called by MapboxView when controller is initialized
  setController(ctrl: MapViewControllerInterface | null): void {
    this._controller = ctrl;
    if (ctrl) ctrl.moveCamera(this._cameraPosition);
  }

  // Called by MapboxView when camera position changes
  updateCameraPosition(camera: MapCameraPosition): void {
    this._cameraPosition = camera;
    this._cameraPositionChangeListener?.(camera);
  }

  setCameraPositionChangeListener(listener: ((camera: MapCameraPosition) => void) | null): void {
    this._cameraPositionChangeListener = listener;
  }

  // If zoom/bearing/tilt are all 0, treat as position-only update (matches Android/iOS behavior)
  private resolveCameraPosition(target: MapCameraPosition): MapCameraPosition {
    const isUnspecified = target.zoom === 0 && target.bearing === 0 && target.tilt === 0;
    if (isUnspecified) return this._cameraPosition.copy({ position: target.position });
    return target;
  }
}

export function useMapboxViewState(params: MapboxViewStateParams = {}): MapboxViewState {
  const [state] = useState(() => new MapboxViewState(params));
  return state;
}
