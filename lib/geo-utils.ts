// Utility functions for working with GeoJSON data

// Mock GeoJSON data to use as fallback
const mockGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        NAME: "Gardens by the Bay",
        DESCRIPTION: "Gardens by the Bay",
        ADDRESS: "18 Marina Gardens Dr, Singapore 018953",
        OPENING_HOURS: "5:00 AM - 2:00 AM",
        OVERVIEW: "Gardens by the Bay is a nature park spanning 101 hectares in the Central Region of Singapore.",
        IMAGE_PATH: "/images/gardens-by-the-bay.jpg",
      },
      geometry: {
        type: "Point",
        coordinates: [103.8636, 1.2816],
      },
    },
    {
      type: "Feature",
      properties: {
        NAME: "Marina Bay Sands",
        DESCRIPTION: "Marina Bay Sands",
        ADDRESS: "10 Bayfront Ave, Singapore 018956",
        OPENING_HOURS: "24 hours",
        OVERVIEW: "Marina Bay Sands is an integrated resort fronting Marina Bay in Singapore.",
        IMAGE_PATH: "/images/marina-bay-sands.jpg",
      },
      geometry: {
        type: "Point",
        coordinates: [103.861, 1.2834],
      },
    },
    {
      type: "Feature",
      properties: {
        NAME: "Sentosa Island",
        DESCRIPTION: "Sentosa Island",
        ADDRESS: "Sentosa Island, Singapore",
        OPENING_HOURS: "24 hours",
        OVERVIEW: "Sentosa is a sunny island in Singapore, home to exciting events, themed attractions, and more.",
        IMAGE_PATH: "/images/sentosa-island.jpg",
      },
      geometry: {
        type: "Point",
        coordinates: [103.8303, 1.2494],
      },
    },
    {
      type: "Feature",
      properties: {
        NAME: "Universal Studios Singapore",
        DESCRIPTION: "Universal Studios Singapore",
        ADDRESS: "8 Sentosa Gateway, Singapore 098269",
        OPENING_HOURS: "10:00 AM - 7:00 PM",
        OVERVIEW: "Universal Studios Singapore is a theme park located within Resorts World Sentosa on Sentosa Island.",
        IMAGE_PATH: "/images/universal-studios.jpg",
      },
      geometry: {
        type: "Point",
        coordinates: [103.8238, 1.254],
      },
    },
    {
      type: "Feature",
      properties: {
        NAME: "S.E.A. Aquarium",
        DESCRIPTION: "S.E.A. Aquarium",
        ADDRESS: "8 Sentosa Gateway, Singapore 098269",
        OPENING_HOURS: "10:00 AM - 7:00 PM",
        OVERVIEW: "S.E.A. Aquarium is one of the largest aquariums in the world with more than 100,000 marine animals.",
        IMAGE_PATH: "/images/sea-aquarium.jpg",
      },
      geometry: {
        type: "Point",
        coordinates: [103.8198, 1.2587],
      },
    },
    {
      type: "Feature",
      properties: {
        NAME: "Chinatown",
        DESCRIPTION: "Chinatown",
        ADDRESS: "Chinatown, Singapore",
        OPENING_HOURS: "Varies by establishment",
        OVERVIEW: "Chinatown is a subzone and ethnic enclave located within the Outram district in Singapore.",
        IMAGE_PATH: "/images/chinatown.jpg",
      },
      geometry: {
        type: "Point",
        coordinates: [103.844, 1.2834],
      },
    },
    {
      type: "Feature",
      properties: {
        NAME: "Clarke Quay",
        DESCRIPTION: "Clarke Quay",
        ADDRESS: "3 River Valley Rd, Singapore 179024",
        OPENING_HOURS: "Varies by establishment",
        OVERVIEW:
          "Clarke Quay is a historical riverside quay in Singapore, located within the Singapore River Planning Area.",
        IMAGE_PATH: "/images/clarke-quay.jpg",
      },
      geometry: {
        type: "Point",
        coordinates: [103.8465, 1.2902],
      },
    },
    {
      type: "Feature",
      properties: {
        NAME: "Art Science Museum",
        DESCRIPTION: "Art Science Museum",
        ADDRESS: "6 Bayfront Ave, Singapore 018974",
        OPENING_HOURS: "10:00 AM - 7:00 PM",
        OVERVIEW:
          "The ArtScience Museum is a museum located within the integrated resort of Marina Bay Sands in Singapore.",
        IMAGE_PATH: "/images/artscience-museum.jpg",
      },
      geometry: {
        type: "Point",
        coordinates: [103.8593, 1.286],
      },
    },
    {
      type: "Feature",
      properties: {
        NAME: "Satay by the Bay",
        DESCRIPTION: "Satay by the Bay",
        ADDRESS: "18 Marina Gardens Dr, Singapore 018953",
        OPENING_HOURS: "11:00 AM - 10:00 PM",
        OVERVIEW: "Satay by the Bay is an open-air food court located in Gardens by the Bay, Singapore.",
        IMAGE_PATH: "/images/satay-by-the-bay.jpg",
      },
      geometry: {
        type: "Point",
        coordinates: [103.8671, 1.2798],
      },
    },
    {
      type: "Feature",
      properties: {
        NAME: "Ya Kun Kaya Toast",
        DESCRIPTION: "Ya Kun Kaya Toast",
        ADDRESS: "Various locations in Singapore",
        OPENING_HOURS: "7:30 AM - 7:00 PM",
        OVERVIEW: "Ya Kun Kaya Toast is a Singaporean chain of mass market kopitiam-style coffee stalls.",
        IMAGE_PATH: "/images/ya-kun-kaya-toast.jpg",
      },
      geometry: {
        type: "Point",
        coordinates: [103.8517, 1.2873],
      },
    },
  ],
}

// Function to load attractions from GeoJSON file
export const loadAttractions = async () => {
  try {
    const response = await fetch("/data/Tourists_Attractions.geojson")

    // Check if the response is OK and is JSON
    if (!response.ok) {
      console.warn(`Failed to load GeoJSON file: ${response.status} ${response.statusText}`)
      return mockGeoJSON
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(`Expected JSON but got ${contentType}. Using mock data instead.`)
      return mockGeoJSON
    }

    // Parse the JSON
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error loading attractions:", error)
    // Return mock data as fallback
    return mockGeoJSON
  }
}

export const parseCoordinates = (latlong: any): { latitude: number; longitude: number } | null => {
  if (!latlong) return null

  try {
    // Handle array format ["1.2831","103.844"]
    if (Array.isArray(latlong) && latlong.length === 2) {
      const latitude = Number.parseFloat(latlong[0])
      const longitude = Number.parseFloat(latlong[1])

      if (!isNaN(latitude) && !isNaN(longitude)) {
        return { latitude, longitude }
      }
    }

    if (typeof latlong === "string") {
      try {
        const parsed = JSON.parse(latlong)
        if (Array.isArray(parsed) && parsed.length === 2) {
          const latitude = Number.parseFloat(parsed[0])
          const longitude = Number.parseFloat(parsed[1])

          if (!isNaN(latitude) && !isNaN(longitude)) {
            return { latitude, longitude }
          }
        }
      } catch (e) {
        // Not a valid JSON string, continue to other formats
      }
    }

    // Handle object format with lat/lng properties
    if (typeof latlong === "object" && latlong !== null) {
      if ("lat" in latlong && "lng" in latlong) {
        const latitude = Number.parseFloat(latlong.lat)
        const longitude = Number.parseFloat(latlong.lng)

        if (!isNaN(latitude) && !isNaN(longitude)) {
          return { latitude, longitude }
        }
      }

      if ("latitude" in latlong && "longitude" in latlong) {
        const latitude = Number.parseFloat(latlong.latitude)
        const longitude = Number.parseFloat(latlong.longitude)

        if (!isNaN(latitude) && !isNaN(longitude)) {
          return { latitude, longitude }
        }
      }
    }
  } catch (error) {
    console.error("Error parsing coordinates:", error)
  }

  return null
}

// Improved findAttractionByName function to handle partial matches
export const findAttractionByName = (geoData: any, name: string) => {
  if (!geoData || !geoData.features || !name) {
    return null
  }

  // Normalize the search name
  const searchName = name.toLowerCase().trim()

  let feature = geoData.features.find((f: any) => f.properties.NAME && f.properties.NAME.toLowerCase() === searchName)

  if (!feature) {
    feature = geoData.features.find(
      (f: any) => f.properties.DESCRIPTION && f.properties.DESCRIPTION.toLowerCase() === searchName,
    )
  }

  if (!feature) {
    feature = geoData.features.find(
      (f: any) => f.properties.NAME && f.properties.NAME.toLowerCase().includes(searchName),
    )
  }

  if (!feature) {
    feature = geoData.features.find(
      (f: any) => f.properties.DESCRIPTION && f.properties.DESCRIPTION.toLowerCase().includes(searchName),
    )
  }

  if (!feature) {
    feature = geoData.features.find(
      (f: any) => f.properties.ADDRESS && f.properties.ADDRESS.toLowerCase().includes(searchName),
    )
  }

  if (!feature) {
    feature = geoData.features.find(
      (f: any) => f.properties.OVERVIEW && f.properties.OVERVIEW.toLowerCase().includes(searchName),
    )
  }

  return feature
}

// Function to get coordinates from a GeoJSON feature
export const getCoordinates = (feature: any) => {
  if (!feature || !feature.geometry || !feature.geometry.coordinates) {
    return null
  }

  const [longitude, latitude] = feature.geometry.coordinates

  return { latitude, longitude }
}

// Function to get image path from a GeoJSON feature
export const getImagePath = (feature: any) => {
  if (!feature || !feature.properties) {
    return null
  }

  return feature.properties.IMAGE_PATH || null
}
