"use client"

import { useEffect, useRef, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Layers, ZoomIn, ZoomOut, RefreshCw, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// We'll dynamically import Leaflet components
let MapContainer: any
let TileLayer: any
let useMap: any
let Marker: any
let Popup: any
let L: any

interface FireMapProps {
  yearFilter?: number
}

// This component will only be rendered on the client side
export default function FireMap({ yearFilter }: FireMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapType, setMapType] = useState<"street" | "satellite">("satellite")
  const [showTopFires, setShowTopFires] = useState(false)
  const [topFires, setTopFires] = useState<any[]>([])
  const mapRef = useRef<any>(null)

  // Initialize Leaflet only on the client side
  useEffect(() => {
    const initLeaflet = async () => {
      try {
        // Dynamically import Leaflet and react-leaflet
        const L = await import("leaflet")
        const ReactLeaflet = await import("react-leaflet")

        // Fix Leaflet icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        })

        // Assign to our global variables
        MapContainer = ReactLeaflet.MapContainer
        TileLayer = ReactLeaflet.TileLayer
        useMap = ReactLeaflet.useMap
        Marker = ReactLeaflet.Marker
        Popup = ReactLeaflet.Popup

        // Load Leaflet.heat plugin
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"
        script.async = true
        script.onload = () => {
          setMapLoaded(true)
          setLoading(false)
        }
        document.body.appendChild(script)

        setIsClient(true)
      } catch (error) {
        console.error("Error initializing Leaflet:", error)
        setLoading(false)
      }
    }

    initLeaflet()
  }, [])

  // Fetch top fires data
  useEffect(() => {
    if (!isClient) return

    const fetchTopFires = async () => {
      try {
        const response = await fetch(`/api/fires?endpoint=stats/top-fires&limit=15`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setTopFires(data)
      } catch (error) {
        console.error("Error fetching top fires:", error)
      }
    }

    fetchTopFires()
  }, [isClient])

  if (!isClient || loading) {
    return (
      <div className="relative w-full h-[600px]">
        <Skeleton className="w-full h-full rounded-lg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mb-2" />
            <p>Loading map...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!mapLoaded) {
    return (
      <div className="relative w-full h-[600px]">
        <Skeleton className="w-full h-full rounded-lg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <p>Error loading map components</p>
            <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // HeatmapLayer component to handle the heatmap rendering
  function HeatmapLayer({ yearFilter }: FireMapProps) {
    const map = useMap()
    const heatLayerRef = useRef<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      const fetchHeatmapData = async () => {
        setLoading(true)
        setError(null)
        try {
          // Construct URL with optional year filter using our proxy API
          let url = `/api/fires?endpoint=heatmap-points`
          if (yearFilter) {
            url += `&year=${yearFilter}`
          }

          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data = await response.json()

          // Transform data for heatmap
          const heatmapData = data.map((point: any) => {
            // Use area_total as intensity (weight)
            return [
              point.latitude,
              point.longitude,
              Math.min(point.area_total / 50, 10), // Increased intensity for more vibrant colors
            ]
          })

          // Remove existing heatmap layer if it exists
          if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current)
          }

          // Create new heatmap layer with more vibrant colors
          if ((window as any).L.heatLayer) {
            heatLayerRef.current = (window as any).L.heatLayer(heatmapData, {
              radius: 20, // Increased radius
              blur: 15,
              maxZoom: 17,
              gradient: {
                0.1: "#00FFFF", // Cyan
                0.3: "#00FF00", // Bright green
                0.5: "#FFFF00", // Bright yellow
                0.7: "#FF7F00", // Orange
                0.9: "#FF0000", // Bright red
              },
              minOpacity: 0.6, // Higher minimum opacity
            }).addTo(map)

            // Fit map to Russia bounds
            map.fitBounds([
              [41.2, 19.6], // Southwest coordinates
              [81.9, 190.0], // Northeast coordinates
            ])
          } else {
            setError("Leaflet.heat plugin not loaded")
          }
        } catch (error) {
          console.error("Error fetching heatmap data:", error)
          setError(error instanceof Error ? error.message : "Failed to load heatmap data")
        } finally {
          setLoading(false)
        }
      }

      fetchHeatmapData()

      // Cleanup function
      return () => {
        if (heatLayerRef.current) {
          map.removeLayer(heatLayerRef.current)
        }
      }
    }, [map, yearFilter])

    return (
      <>
        {loading && (
          <div className="absolute top-2 right-2 z-[1000] bg-white p-2 rounded shadow">
            <div className="flex items-center">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading heatmap data...
            </div>
          </div>
        )}
        {error && (
          <div className="absolute top-2 right-2 z-[1000] bg-white p-2 rounded shadow text-red-500">Error: {error}</div>
        )}
      </>
    )
  }

  // Top Fires Markers component
  function TopFiresMarkers() {
    if (!showTopFires || topFires.length === 0) return null

    // Custom fire icon
    const fireIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
              </svg>
            </div>`,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    return (
      <>
        {topFires.map((fire) => (
          <Marker key={fire.fire_id} position={[fire.latitude, fire.longitude]} icon={fireIcon}>
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-lg">Major Fire</h3>
                <p>
                  <strong>Region:</strong> {fire.region_name}
                </p>
                <p>
                  <strong>Year:</strong> {fire.year}
                </p>
                <p>
                  <strong>Area:</strong> {fire.area_total.toLocaleString()} ha
                </p>
                <p>
                  <strong>ID:</strong> {fire.fire_id}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </>
    )
  }

  // Map controls component
  function MapControls() {
    const map = useMap()

    return (
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="bg-white shadow-md hover:bg-gray-100"
                onClick={() => map.zoomIn()}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="bg-white shadow-md hover:bg-gray-100"
                onClick={() => map.zoomOut()}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="bg-white shadow-md hover:bg-gray-100"
                onClick={() => setMapType(mapType === "street" ? "satellite" : "street")}
              >
                <Layers className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Map Type</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className={`bg-white shadow-md hover:bg-gray-100 ${showTopFires ? "ring-2 ring-red-500" : ""}`}
                onClick={() => setShowTopFires(!showTopFires)}
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show/Hide Top Fires</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <div className="relative h-[600px] w-full rounded-lg overflow-hidden">
      <MapContainer
        center={[60, 100]} // Center on Russia
        zoom={3}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        ref={mapRef}
      >
        {mapType === "street" ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}
        <HeatmapLayer yearFilter={yearFilter} />
        <TopFiresMarkers />
        <MapControls />
      </MapContainer>

      {showTopFires && (
        <div className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded shadow max-w-xs">
          <h3 className="font-bold text-sm mb-1">Top 15 Largest Fires</h3>
          <p className="text-xs text-gray-600">
            Click on the fire icons to see details about the largest recorded fires in the dataset.
          </p>
        </div>
      )}
    </div>
  )
}
