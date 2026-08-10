import { AbstractZoomAltitudeConverter, WebMercatorZoomAltitudeConverter } from '@mapconductor/js-sdk-core';

/**
 * 統一ズーム（Google Maps 基準・256px タイル）⇄ 高度の変換。
 *
 * Mapbox は 512px タイルのベクタエンジンなので、統一ズームはネイティブズーム + 1。
 * 換算式はコアの {@link WebMercatorZoomAltitudeConverter} にある。
 */
export class ZoomAltitudeConverter extends WebMercatorZoomAltitudeConverter {
    /** Empirical offset: GoogleZoom ≈ MapboxSDK.zoom + 1.0 */
    static readonly MAPBOX_TO_GOOGLE_ZOOM_OFFSET = 1.0;

    constructor(zoom0Altitude: number = AbstractZoomAltitudeConverter.DEFAULT_ZOOM0_ALTITUDE) {
        super(zoom0Altitude, ZoomAltitudeConverter.MAPBOX_TO_GOOGLE_ZOOM_OFFSET);
    }

    static mapboxZoomToGoogleZoom(mapboxZoom: number): number {
        const google = mapboxZoom + ZoomAltitudeConverter.MAPBOX_TO_GOOGLE_ZOOM_OFFSET;
        return Math.min(Math.max(google, AbstractZoomAltitudeConverter.MIN_ZOOM_LEVEL), AbstractZoomAltitudeConverter.MAX_ZOOM_LEVEL);
    }

    static googleZoomToMapboxZoom(googleZoom: number): number {
        const mapbox = googleZoom - ZoomAltitudeConverter.MAPBOX_TO_GOOGLE_ZOOM_OFFSET;
        return Math.min(Math.max(mapbox, AbstractZoomAltitudeConverter.MIN_ZOOM_LEVEL), AbstractZoomAltitudeConverter.MAX_ZOOM_LEVEL);
    }
}
