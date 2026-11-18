"use client"

import { useEffect, useRef } from "react"
import Script from "next/script"

interface MapboxMapProps {
  center: [number, number]
  zoom: number
  attractions: any[]
  selectedAttraction: any | null
  onAttractionSelect: (attraction: any) => void
  onMapLoaded?: () => void
}

// Directly use the provided token

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
export default function MapboxMap({
  center,
  zoom,
  attractions,
  selectedAttraction,
  onAttractionSelect,
  onMapLoaded,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInitialized = useRef(false)
  const mapInstance = useRef<any>(null)
  const markers = useRef<{ [id: string]: any }>({})
  const scriptLoaded = useRef(false)

  // Initialize map after script is loaded
  const initializeMap = () => {
    if (!mapContainer.current || mapInitialized.current || !window.mapboxgl) return

    try {
      // Set the access token
      window.mapboxgl.accessToken = MAPBOX_TOKEN

      // Create map
      mapInstance.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: center,
        zoom: zoom,
      })

      // Add navigation controls
      mapInstance.current.addControl(new window.mapboxgl.NavigationControl(), "top-right")

      // Wait for map to load
      mapInstance.current.on("load", () => {
        mapInitialized.current = true
        if (onMapLoaded) onMapLoaded()

        // Add markers after map is loaded
        addMarkers()
      })
    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }

  // Add markers to map
  const addMarkers = () => {
    if (!mapInstance.current || !mapInitialized.current || attractions.length === 0) return

    console.log("Adding markers for", attractions.length, "attractions")

    // Clear existing markers
    Object.values(markers.current).forEach((marker: any) => marker.remove())
    markers.current = {}

    // Add markers for each attraction
    attractions.forEach((attraction) => {
      if (!attraction.latitude || !attraction.longitude) {
        console.log("Skipping attraction without coordinates:", attraction.name)
        return
      }

      console.log("Adding marker for:", attraction.name, "at", attraction.latitude, attraction.longitude)

      // Create marker element
      const el = document.createElement("div")
      el.className = "custom-marker"
      el.style.width = "30px"
      el.style.height = "30px"
      el.style.borderRadius = "50%"
      el.style.backgroundColor = "#d9b3e6"
      el.style.border = "3px solid white"
      el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)"
      el.style.cursor = "pointer"
      el.style.transition = "all 0.3s ease"

      // Add hover effect
      el.addEventListener("mouseenter", () => {
        el.style.width = "35px"
        el.style.height = "35px"
        el.style.zIndex = "10"
        el.style.backgroundColor = "#c99dd6"
      })

      el.addEventListener("mouseleave", () => {
        if (selectedAttraction?.id !== attraction.id) {
          el.style.width = "30px"
          el.style.height = "30px"
          el.style.zIndex = "1"
          el.style.backgroundColor = "#d9b3e6"
        }
      })

      // Create marker
      const marker = new window.mapboxgl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([attraction.longitude, attraction.latitude])
        .addTo(mapInstance.current)

      // Add click event
      marker.getElement().addEventListener("click", () => {
        console.log("Marker clicked:", attraction.name)
        onAttractionSelect(attraction)
      })

      // Store marker reference
      markers.current[attraction.id] = marker
    })
  }

  // Update markers when attractions change
  useEffect(() => {
    if (scriptLoaded.current && mapInitialized.current) {
      addMarkers()
    }
  }, [attractions])

  // Update selected marker and center map when selected attraction changes
  useEffect(() => {
    if (!mapInstance.current || !mapInitialized.current) return

    // Reset all markers to default size
    Object.values(markers.current).forEach((marker: any) => {
      const markerEl = marker.getElement()
      markerEl.style.width = "30px"
      markerEl.style.height = "30px"
      markerEl.style.zIndex = "1"
      markerEl.style.backgroundColor = "#d9b3e6"
    })

    if (!selectedAttraction) return

    console.log("Selected attraction:", selectedAttraction.name)

    // Highlight selected marker
    if (markers.current[selectedAttraction.id]) {
      const el = markers.current[selectedAttraction.id].getElement()
      el.style.width = "35px"
      el.style.height = "35px"
      el.style.zIndex = "10"
      el.style.backgroundColor = "#c99dd6"

      // Center map on the attraction
      mapInstance.current.flyTo({
        center: [selectedAttraction.longitude, selectedAttraction.latitude],
        zoom: 15,
        essential: true,
      })
    } else {
      console.log("Marker not found for selected attraction:", selectedAttraction.id)
    }
  }, [selectedAttraction])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  return (
    <>
      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
        onLoad={() => {
          console.log("Mapbox script loaded")
          scriptLoaded.current = true
          initializeMap()
        }}
      />
      <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
      <div ref={mapContainer} className="w-full h-full" />
    </>
  )
}
