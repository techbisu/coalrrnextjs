'use client'

import 'leaflet/dist/leaflet.css'
import * as React from 'react'
import { MapPin } from 'lucide-react'

interface BoundaryMapViewerProps {
  /** GeoJSON-style coordinates: [[[lng, lat], ...]] */
  coordinates?: number[][][]
  color?: string
  height?: number
}

function ringCentroid(ring: number[][]): [number, number] {
  const n = ring.length
  return [ring.reduce((s, p) => s + p[1], 0) / n, ring.reduce((s, p) => s + p[0], 0) / n]
}

/**
 * BoundaryMapViewer — read-only Leaflet map showing the project boundary on OSM tiles.
 * Reusable: pass any GeoJSON polygon coordinates + color.
 */
export function BoundaryMapViewer({ coordinates, color = '#16a34a', height = 380 }: BoundaryMapViewerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<any>(null)
  const polygonRef = React.useRef<any>(null)
  const [mapReady, setMapReady] = React.useState(false)

  // Init map once
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    import('leaflet').then(mod => {
      if (cancelled || !containerRef.current) return
      const L = mod.default

      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current!, {
        center: [23.7, 86.0],
        zoom: 10,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      setMapReady(true)
    })

    return () => {
      cancelled = true
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // mount once

  // Update boundary when coordinates change (e.g. after save)
  React.useEffect(() => {
    console.log('[BoundaryMapViewer] update effect triggered', { mapReady, coordinates, color, mapExists: !!mapRef.current })
    if (!mapReady || !mapRef.current) return
    import('leaflet').then(mod => {
      const L = mod.default
      // Remove old polygon
      if (polygonRef.current) { 
        console.log('[BoundaryMapViewer] removing old polygon')
        polygonRef.current.remove(); 
        polygonRef.current = null 
      }

      if (coordinates && coordinates[0]?.length >= 3) {
        const ring = coordinates[0]
        const latlngs = ring.map(([lng, lat]) => [lat, lng] as [number, number])
        console.log('[BoundaryMapViewer] Drawing polygon with', latlngs.length, 'points')
        mapRef.current.invalidateSize()
        
        polygonRef.current = L.polygon(latlngs, {
          color, weight: 2.5, fillColor: color, fillOpacity: 0.18, dashArray: '7 4',
        }).addTo(mapRef.current)
        
        console.log('[BoundaryMapViewer] Polygon added to map. Fitting bounds...')
        mapRef.current.fitBounds(polygonRef.current.getBounds(), { padding: [40, 40] })
      } else {
        console.log('[BoundaryMapViewer] No valid coordinates to draw')
      }
    }).catch(err => {
      console.error('[BoundaryMapViewer] Error importing leaflet for update:', err)
    })
  }, [coordinates, color, mapReady])

  return (
    <div className="relative w-full rounded-lg overflow-hidden border bg-background" style={{ height }}>
      {/* The map container is always rendered so Leaflet can initialize */}
      <div ref={containerRef} className="h-full w-full z-0" />

      {/* Empty State Overlay */}
      {(!coordinates || coordinates[0]?.length < 3) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm text-muted-foreground">
          <MapPin className="h-6 w-6 opacity-40" />
          <span className="text-sm font-medium">No Project Boundary</span>
          <span className="text-xs max-w-[200px] text-center text-muted-foreground/80">
            Edit the boundary to draw or upload GeoJSON coordinates.
          </span>
        </div>
      )}
    </div>
  )
}
