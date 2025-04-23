// This file is now deprecated, but we'll keep it for backward compatibility
import { loadGoogleMaps, loadGoogleMapsApi } from "../lib/google-maps-loader"

export { loadGoogleMaps, loadGoogleMapsApi }

// Add the callback to the window object
declare global {
  interface Window {
    [key: string]: any
    google: any
  }
}
