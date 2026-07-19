import { createGeoPoint, createMapCameraPosition, computeOffset, type MapCameraPosition } from '@mapconductor/js-sdk-core';
import type mapboxgl from 'mapbox-gl';
import { ZoomAltitudeConverter } from './zoom/ZoomAltitudeConverter';

const converter = new ZoomAltitudeConverter();
const NEGATIVE_TILT_TARGET_DISTANCE_SCALE = 1.83;
const NEGATIVE_TILT_ZOOM_OFFSET_AT_MAX_TILT = -0.9;

/**
 * Converts a MapConductor MapCameraPosition to Mapbox camera parameters.
 * Applies the zoom offset: Mapbox zoom = MapConductor zoom - 1.
 */
export function toCameraPosition(pos: MapCameraPosition): {
    center: [number, number];
    zoom: number;
    bearing: number;
    tilt: number;
} {
    if (pos.tilt >= 0) {
        return {
            center: [pos.center.longitude, pos.center.latitude],
            zoom: ZoomAltitudeConverter.googleZoomToMapboxZoom(pos.zoom),
            bearing: pos.bearing,
            tilt: pos.tilt,
        };
    } else {
        // tilt < 0: Mapbox cannot represent an upward pitch directly.
        // Match the Google Maps workaround: move the ground target forward and render with abs(tilt).
        const tiltAbsDeg = Math.min(Math.max(Math.abs(pos.tilt), 0), 60);
        const tiltAbsRad = (tiltAbsDeg * Math.PI) / 180;
        const mapboxZoomForAltitude = ZoomAltitudeConverter.googleZoomToMapboxZoom(pos.zoom);
        const altitude = converter.zoomLevelToAltitude({
            zoomLevel: mapboxZoomForAltitude,
            latitude: pos.position.latitude,
            tilt: 0,
        });
        const distanceForward = altitude * Math.cos(tiltAbsRad) * Math.tan(tiltAbsRad) * NEGATIVE_TILT_TARGET_DISTANCE_SCALE;
        const target = computeOffset({
            origin: pos.position,
            distance: distanceForward,
            heading: pos.bearing,
        });
        const adjustedZoom = pos.zoom + NEGATIVE_TILT_ZOOM_OFFSET_AT_MAX_TILT * (tiltAbsDeg / 60);

        return {
            center: [target.longitude, target.latitude],
            zoom: ZoomAltitudeConverter.googleZoomToMapboxZoom(adjustedZoom),
            bearing: pos.bearing,
            tilt: tiltAbsDeg,
        };
    }
}

/**
 * Converts Mapbox camera state to a MapConductor MapCameraPosition.
 * Applies the zoom offset: MapConductor zoom = Mapbox zoom + 1.
 */
export function toMapCameraPosition({
    center,
    zoom,
    bearing,
    tilt,
    logicalTiltHint = null,
}: {
    center: mapboxgl.LngLat;
    zoom: number;
    bearing: number;
    tilt: number;
    logicalTiltHint?: number | null;
}): MapCameraPosition {
    const pitchAbsDeg = Math.min(Math.max(Math.abs(tilt), 0), 60);
    if (logicalTiltHint != null && logicalTiltHint < 0 && pitchAbsDeg > 0) {
        const pitchAbsRad = (pitchAbsDeg * Math.PI) / 180;
        const shiftedCenter = createGeoPoint({ latitude: center.lat, longitude: center.lng });
        const googleZoom = ZoomAltitudeConverter.mapboxZoomToGoogleZoom(zoom);
        const originalGoogleZoom = googleZoom - NEGATIVE_TILT_ZOOM_OFFSET_AT_MAX_TILT * (pitchAbsDeg / 60);
        const originalMapboxZoom = ZoomAltitudeConverter.googleZoomToMapboxZoom(originalGoogleZoom);
        const altitude = converter.zoomLevelToAltitude({
            zoomLevel: originalMapboxZoom,
            latitude: shiftedCenter.latitude,
            tilt: 0,
        });
        const distanceBackward = altitude * Math.cos(pitchAbsRad) * Math.tan(pitchAbsRad) * NEGATIVE_TILT_TARGET_DISTANCE_SCALE;
        const originalPosition = computeOffset({
            origin: shiftedCenter,
            distance: distanceBackward,
            heading: bearing + 180,
        });
        return createMapCameraPosition({
            position: originalPosition,
            zoom: originalGoogleZoom,
            bearing,
            tilt: -pitchAbsDeg,
        });
    }
    return createMapCameraPosition({
        position: createGeoPoint({ latitude: center.lat, longitude: center.lng }),
        zoom: ZoomAltitudeConverter.mapboxZoomToGoogleZoom(zoom),
        bearing,
        tilt,
    });
}
