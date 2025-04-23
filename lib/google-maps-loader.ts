let googleMapsPromise: Promise<void> | null = null
let retryCount = 0
const MAX_RETRIES = 3

export function loadGoogleMaps(): Promise<void> {
  if (googleMapsPromise) {
    return googleMapsPromise
  }

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log("Google Maps already loaded")
      resolve()
      return
    }

    // Create a load function that we can retry
    const loadMapsScript = () => {
      // Define the callback function
      const callbackName = `googleMapsInitialize_${Math.random().toString(36).substring(2, 9)}`

      // Define the callback function
      window[callbackName] = () => {
        console.log("Google Maps loaded successfully")
        resolve()
        // Clean up the global callback
        delete window[callbackName]
      }

      // Create the script element with the API key directly from the environment variable
      const script = document.createElement("script")
      
      // Check if API key exists
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        console.error("Google Maps API key is missing")
        reject(new Error("Google Maps API key is missing"))
        return
      }
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`
      script.async = true
      script.defer = true

      // Handle script load error
      script.onerror = () => {
        console.error(`Failed to load Google Maps API (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`)
        
        // Remove the failed script
        document.head.removeChild(script)
        delete window[callbackName]
        
        // Retry loading if under max retries
        if (retryCount < MAX_RETRIES) {
          retryCount++
          console.log(`Retrying Google Maps load (${retryCount}/${MAX_RETRIES})...`)
          setTimeout(loadMapsScript,  100) // Wait 1 second before retry
        } else {
          reject(new Error(`Failed to load Google Maps API after ${MAX_RETRIES + 1} attempts`))
          // Reset promise to allow future retry attempts
          googleMapsPromise = null
        }
      }

      // Set a timeout in case the callback is never called
      const timeoutId = setTimeout(() => {
        if (window[callbackName]) {
          console.error("Google Maps load timed out")
          delete window[callbackName]
          if (document.head.contains(script)) {
            document.head.removeChild(script)
          }
          
          if (retryCount < MAX_RETRIES) {
            retryCount++
            console.log(`Retrying Google Maps load (${retryCount}/${MAX_RETRIES})...`)
            setTimeout(loadMapsScript, 1000)
          } else {
            reject(new Error("Google Maps load timed out after multiple attempts"))
            googleMapsPromise = null
          }
        }
      }, 10000) // 10 second timeout

      // Add the script to the document
      document.head.appendChild(script)
      console.log(`Google Maps script added to document (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`)
    }

    // Start the initial load
    loadMapsScript()
  })

  return googleMapsPromise
}

// Add this to make TypeScript happy with the dynamic callback
declare global {
  interface Window {
    [key: string]: any
  }
}

// Add Google Maps types to the global Window interface
interface Window {
  google?: {
    maps?: {
      Map?: any
      Marker?: any
      SymbolPath?: any
      places?: {
        PlacesService?: any
      }
    }
  }
}

// Simple wrapper for compatibility with existing code
export async function loadGoogleMapsApi() {
  await loadGoogleMaps()
  return window.google
}
