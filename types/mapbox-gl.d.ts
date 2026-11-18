import type * as mapboxgl from "mapbox-gl"

declare global {
  interface Window {
    mapboxgl: typeof mapboxgl
  }
}

declare module "mapbox-gl" {
  export interface MapboxOptions {
    container: string | HTMLElement
    style: string
    center?: [number, number]
    zoom?: number
    bearing?: number
    pitch?: number
    minZoom?: number
    maxZoom?: number
    interactive?: boolean
    attributionControl?: boolean
    customAttribution?: string | string[]
    logoPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    renderWorldCopies?: boolean
    maxBounds?: [[number, number], [number, number]]
    scrollZoom?: boolean
    boxZoom?: boolean
    dragRotate?: boolean
    dragPan?: boolean
    keyboard?: boolean
    doubleClickZoom?: boolean
    touchZoomRotate?: boolean
    trackResize?: boolean
    bearing?: number
    pitch?: number
    fadeDuration?: number
    failIfMajorPerformanceCaveat?: boolean
    preserveDrawingBuffer?: boolean
    antialias?: boolean
    refreshExpiredTiles?: boolean
    maxTileCacheSize?: number
    localIdeographFontFamily?: string
    transformRequest?: (
      url: string,
      resourceType: string,
    ) => {
      url: string
      headers?: { [key: string]: string }
      credentials?: string
    }
    collectResourceTiming?: boolean
    crossSourceCollisions?: boolean
    hash?: boolean | string
    cooperativeGestures?: boolean
    projection?: string
  }
}
