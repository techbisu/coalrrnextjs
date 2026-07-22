'use client'

// ⚠️ Leaflet CSS MUST be imported here — without it tiles don't render
import 'leaflet/dist/leaflet.css'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Pencil, Upload, RotateCcw, CheckCircle2, Map, Maximize2 } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
export interface BoundaryCoordinates {
  coordinates: number[][][]   // GeoJSON Polygon ring: [[[lng,lat], ...]]
  color?: string
}

interface BoundaryDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  value?: BoundaryCoordinates
  onChange: (boundary: BoundaryCoordinates) => void
}

interface MapHandle {
  closePolygon: () => void
  clearAll: () => void
  fitBounds: () => void
  setDrawMode: (v: boolean) => void
}

// ─── GeoJSON helpers ─────────────────────────────────────────────────────────
function extractFirstRing(geojson: any): number[][] | null {
  try {
    const geom = geojson.type === 'Feature' ? geojson.geometry : geojson
    if (!geom) return null
    if (geom.type === 'Polygon') return geom.coordinates[0]
    if (geom.type === 'MultiPolygon') return geom.coordinates[0]?.[0]
    if (geom.type === 'GeometryCollection') {
      for (const g of geom.geometries) { const r = extractFirstRing(g); if (r) return r }
    }
    if (geojson.type === 'FeatureCollection') {
      for (const f of geojson.features) { const r = extractFirstRing(f); if (r) return r }
    }
  } catch { /**/ }
  return null
}

function ringCentroid(ring: number[][]): [number, number] {
  const n = ring.length
  return [ring.reduce((s, p) => s + p[1], 0) / n, ring.reduce((s, p) => s + p[0], 0) / n]
}

// ─── Internal refs bundle (avoids stale closures without re-renders) ──────────
interface MapState {
  L: any
  map: any
  polyline: any
  polygon: any
  markers: any
  pts: [number, number][]
  drawMode: boolean
}

// ─── Leaflet Map Component ────────────────────────────────────────────────────
const LeafletMap = React.forwardRef<MapHandle, {
  initialRing?: number[][]
  onRingChange: (ring: number[][] | null) => void
  onPointAdded: () => void
}>(function LeafletMap({ initialRing, onRingChange, onPointAdded }, ref) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const ms = React.useRef<MapState>({
    L: null, map: null, polyline: null, polygon: null, markers: null, pts: [], drawMode: false,
  })

  // ── layer helpers ──────────────────────────────────────────────────────────
  function rm(key: 'polyline' | 'polygon') {
    const m = ms.current
    if (m[key]) { m[key].remove(); m[key] = null }
  }
  function drawMarkers() {
    const { L, markers, pts } = ms.current
    markers?.clearLayers()
    pts.forEach(([lat, lng], i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:11px;height:11px;border-radius:50%;background:${i === 0 ? '#16a34a' : '#fff'};border:2.5px solid #16a34a;transform:translate(-50%,-50%)"></div>`,
        iconSize: [11, 11], iconAnchor: [0, 0],
      })
      L.marker([lat, lng], { icon, interactive: false }).addTo(markers)
    })
  }
  function drawPolyline() {
    const { L, map, pts } = ms.current
    rm('polyline')
    if (pts.length < 2) return
    ms.current.polyline = L.polyline(pts, { color: '#16a34a', weight: 2.5, dashArray: '5 4', opacity: 0.9 }).addTo(map)
  }
  function drawPolygon() {
    const { L, map, pts } = ms.current
    rm('polygon')
    if (pts.length < 3) return
    ms.current.polygon = L.polygon(pts, {
      color: '#16a34a', weight: 2.5,
      fillColor: '#16a34a', fillOpacity: 0.18, dashArray: '7 4',
    }).addTo(map)
    onRingChange(pts.map(([lat, lng]) => [lng, lat]))
  }

  // ── Imperative API ─────────────────────────────────────────────────────────
  React.useImperativeHandle(ref, () => ({
    closePolygon() {
      const m = ms.current
      if (m.pts.length < 3) { toast.error('Need at least 3 points.'); return }
      rm('polyline')
      drawPolygon()
      drawMarkers()
      m.drawMode = false
      m.map?.getContainer()?.style && (m.map.getContainer().style.cursor = '')
    },
    clearAll() {
      const m = ms.current
      m.pts = []
      rm('polyline'); rm('polygon')
      m.markers?.clearLayers()
      m.drawMode = false
      m.map?.getContainer()?.style && (m.map.getContainer().style.cursor = '')
      onRingChange(null)
    },
    fitBounds() {
      const { map, polygon } = ms.current
      if (map && polygon) map.fitBounds(polygon.getBounds(), { padding: [40, 40] })
    },
    setDrawMode(v: boolean) {
      const m = ms.current
      m.drawMode = v
      if (m.map?.getContainer()) m.map.getContainer().style.cursor = v ? 'crosshair' : ''
    },
  }))

  // ── Init (client-side only, once) ─────────────────────────────────────────
  React.useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    let destroyed = false

    import('leaflet').then(mod => {
      if (destroyed || !container) return
      const L = mod.default
      ms.current.L = L

      // Fix webpack-mangled icon paths
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const center: [number, number] = initialRing?.length
        ? ringCentroid(initialRing)
        : [23.7, 86.0]   // ECL coalfield default

      const map = L.map(container, {
        center,
        zoom: initialRing?.length ? 13 : 11,
        zoomControl: false,
        preferCanvas: true,
      })

      // OpenStreetMap — 100% free
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: 'topright' }).addTo(map)
      ms.current.markers = L.layerGroup().addTo(map)
      ms.current.map = map

      // Restore existing boundary if provided
      if (initialRing && initialRing.length >= 3) {
        ms.current.pts = initialRing.map(([lng, lat]) => [lat, lng] as [number, number])
        drawPolygon()
        drawMarkers()
        if (ms.current.polygon) map.fitBounds(ms.current.polygon.getBounds(), { padding: [40, 40] })
      }

      map.on('click', (e: any) => {
        if (!ms.current.drawMode) return
        ms.current.pts = [...ms.current.pts, [e.latlng.lat, e.latlng.lng] as [number, number]]
        onPointAdded()
        drawPolyline()
        drawMarkers()
      })
    }).catch(err => {
      console.error('Leaflet load failed:', err)
    })

    return () => {
      destroyed = true
      if (ms.current.map) {
        ms.current.map.remove()
        ms.current.map = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // ← mount only

  return (
    <div
      ref={containerRef}
      // Explicit pixel height is REQUIRED for Leaflet to render tiles
      style={{ width: '100%', height: '440px', minHeight: '440px' }}
    />
  )
})

// ─── Main Dialog ──────────────────────────────────────────────────────────────
export function BoundaryDrawer({ open, onOpenChange, value, onChange }: BoundaryDrawerProps) {
  const mapRef = React.useRef<MapHandle>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const [drawMode, setDrawMode] = React.useState(false)
  const [ringReady, setRingReady] = React.useState(false)
  const [pointCount, setPointCount] = React.useState(0)
  const ringRef = React.useRef<number[][] | null>(null)

  // Push drawMode into the map via imperative ref (no remount, no re-render of map)
  React.useEffect(() => {
    mapRef.current?.setDrawMode(drawMode)
  }, [drawMode])

  const initialRing = value?.coordinates?.[0]

  const handleRingChange = React.useCallback((ring: number[][] | null) => {
    ringRef.current = ring
    setRingReady(!!ring && ring.length >= 3)
  }, [])

  const handleClosePoly = () => {
    mapRef.current?.closePolygon()
    setDrawMode(false)
    setRingReady(true)
  }

  const handleReset = () => {
    mapRef.current?.clearAll()
    setDrawMode(false)
    setRingReady(false)
    setPointCount(0)
    ringRef.current = null
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const ring = extractFirstRing(JSON.parse(ev.target?.result as string))
        if (!ring || ring.length < 3) { toast.error('No valid polygon found.'); return }
        handleRingChange(ring)
        setDrawMode(false)
        toast.success(`Imported ${ring.length} vertices.`)
      } catch { toast.error('Invalid GeoJSON file.') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSave = () => {
    const ring = ringRef.current
    if (!ring || ring.length < 3) { toast.error('Draw or import a boundary first.'); return }
    const closed = [...ring]
    const [f, l] = [closed[0], closed[closed.length - 1]]
    if (f[0] !== l[0] || f[1] !== l[1]) closed.push(closed[0])
    onChange({ coordinates: [closed], color: '#16a34a' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) setDrawMode(false); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-[820px] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Map className="h-4 w-4 text-primary" /> Project Boundary Editor
          </DialogTitle>
          <DialogDescription className="text-xs">
            Draw on the map or import a GeoJSON file. Tiles from OpenStreetMap (free, no API key).
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 border-b bg-muted/40 shrink-0">
          <Button variant={drawMode ? 'default' : 'outline'} size="sm" onClick={() => setDrawMode(v => !v)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            {drawMode ? 'Drawing… (click to stop)' : 'Draw Boundary'}
          </Button>

          {drawMode && pointCount >= 3 && (
            <Button variant="outline" size="sm" onClick={handleClosePoly}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> Close Polygon
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Import GeoJSON
          </Button>
          <input ref={fileRef} type="file" accept=".json,.geojson" className="hidden" onChange={handleFileUpload} />

          {ringReady && (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => mapRef.current?.fitBounds()}>
                <Maximize2 className="mr-1.5 h-3.5 w-3.5" /> Fit Bounds
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={handleReset}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
              </Button>
            </>
          )}

          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!ringReady}>Save Boundary</Button>
          </div>
        </div>

        {/* Map canvas */}
        <div className="relative shrink-0">
          {drawMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-background/90 border px-3 py-1.5 text-xs shadow-md pointer-events-none whitespace-nowrap">
              {pointCount === 0
                ? '🖱 Click on the map to place vertices'
                : pointCount < 3
                  ? `${pointCount} point(s) placed — need at least 3`
                  : `${pointCount} vertices — click "Close Polygon" when done`}
            </div>
          )}

          <LeafletMap
            ref={mapRef}
            initialRing={initialRing}
            onRingChange={handleRingChange}
            onPointAdded={() => setPointCount(c => c + 1)}
          />
        </div>

        {!drawMode && !ringReady && (
          <div className="px-5 py-2.5 text-xs text-muted-foreground border-t bg-muted/20 shrink-0">
            Use <strong>Draw Boundary</strong> to click vertices on the map, or <strong>Import GeoJSON</strong> to upload a polygon file.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
