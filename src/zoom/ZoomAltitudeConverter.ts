import { AbstractZoomAltitudeConverter } from '@mapconductor/js-sdk-core';

export class ZoomAltitudeConverter extends AbstractZoomAltitudeConverter {
    /** Empirical offset: GoogleZoom ≈ MapboxSDK.zoom + 1.0 */
    static readonly MAPBOX_TO_GOOGLE_ZOOM_OFFSET = 1.0;

    static mapboxZoomToGoogleZoom(mapboxZoom: number): number {
        const google = mapboxZoom + ZoomAltitudeConverter.MAPBOX_TO_GOOGLE_ZOOM_OFFSET;
        return Math.min(Math.max(google, AbstractZoomAltitudeConverter.MIN_ZOOM_LEVEL), AbstractZoomAltitudeConverter.MAX_ZOOM_LEVEL);
    }

    static googleZoomToMapboxZoom(googleZoom: number): number {
        const mapbox = googleZoom - ZoomAltitudeConverter.MAPBOX_TO_GOOGLE_ZOOM_OFFSET;
        return Math.min(Math.max(mapbox, AbstractZoomAltitudeConverter.MIN_ZOOM_LEVEL), AbstractZoomAltitudeConverter.MAX_ZOOM_LEVEL);
    }

    private cosLatitudeFactor(latitude: number): number {
        const clamped = Math.max(-85, Math.min(85, latitude));
        const latRad = (clamped * Math.PI) / 180;
        return Math.max(AbstractZoomAltitudeConverter.MIN_COS_LAT, Math.abs(Math.cos(latRad)));
    }

    private cosTiltFactor(tilt: number): number {
        const clamped = Math.max(0, Math.min(90, tilt));
        const tiltRad = (clamped * Math.PI) / 180;
        return Math.max(AbstractZoomAltitudeConverter.MIN_COS_TILT, Math.cos(tiltRad));
    }

    zoomLevelToAltitude({
        zoomLevel,
        latitude,
        tilt,
    }: {
        zoomLevel: number;
        latitude: number;
        tilt: number;
    }): number {
        const googleZoom = ZoomAltitudeConverter.mapboxZoomToGoogleZoom(zoomLevel);
        const cosLat = this.cosLatitudeFactor(latitude);
        const cosTilt = this.cosTiltFactor(tilt);
        const distance = (this.zoom0Altitude * cosLat) / Math.pow(AbstractZoomAltitudeConverter.ZOOM_FACTOR, googleZoom);
        const altitude = distance * cosTilt;
        return Math.min(Math.max(altitude, AbstractZoomAltitudeConverter.MIN_ALTITUDE), AbstractZoomAltitudeConverter.MAX_ALTITUDE);
    }

    altitudeToZoomLevel({
        altitude,
        latitude,
        tilt,
    }: {
        altitude: number;
        latitude: number;
        tilt: number;
    }): number {
        const clampedAltitude = Math.min(Math.max(altitude, AbstractZoomAltitudeConverter.MIN_ALTITUDE), AbstractZoomAltitudeConverter.MAX_ALTITUDE);
        const cosLat = this.cosLatitudeFactor(latitude);
        const cosTilt = this.cosTiltFactor(tilt);
        const distance = clampedAltitude / cosTilt;
        const googleZoom = Math.log2((this.zoom0Altitude * cosLat) / distance);
        return ZoomAltitudeConverter.googleZoomToMapboxZoom(googleZoom);
    }
}
