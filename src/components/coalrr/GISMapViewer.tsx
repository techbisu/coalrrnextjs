'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TreePine, Landmark, Sprout, Building2 } from 'lucide-react'

export interface PlotFeature {
  id: string
  plotNumber: string
  landType: 'forest' | 'got_patta' | 'tenancy' | 'debottar'
  areaAcres: string
  geometry?: number[][] // [[x,y], [x,y], ...] — simplified polygon
  selected?: boolean
}

export interface GISMapViewerProps {
  boundary?: { coordinates: number[][][]; color?: string }
  plots?: PlotFeature[]
  selectedPlotId?: string
  onPlotSelect?: (id: string) => void
  className?: string
  height?: number
}

const LAND_TYPE_META = {
  forest:     { label: 'Forest',     color: '#dc2626', bg: '#fecaca', icon: TreePine },
  got_patta:  { label: 'Govt/Patta', color: '#0284c7', bg: '#bae6fd', icon: Landmark },
  tenancy:    { label: 'Tenancy',    color: '#16a34a', bg: '#bbf7d0', icon: Sprout },
  debottar:   { label: 'Debottar',   color: '#d97706', bg: '#fde68a', icon: Building2 },
} as const

const VIEW_W = 600, VIEW_H = 400

function projectCoords(coords: number[][], bounds: { minX: number; minY: number; maxX: number; maxY: number }) {
  const pad = 20
  const sx = (VIEW_W - 2 * pad) / Math.max(1, bounds.maxX - bounds.minX)
  const sy = (VIEW_H - 2 * pad) / Math.max(1, bounds.maxY - bounds.minY)
  const s = Math.min(sx, sy)
  return coords.map(([x, y]) => [
    pad + (x - bounds.minX) * s,
    VIEW_H - pad - (y - bounds.minY) * s, // flip Y for SVG
  ])
}

function computeBounds(allCoords: number[][][]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const ring of allCoords) for (const [x, y] of ring) {
    if (x < minX) minX = x; if (y < minY) minY = y
    if (x > maxX) maxX = x; if (y > maxY) maxY = y
  }
  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 1, maxY: 1 }
  return { minX, minY, maxX, maxY }
}

export function GISMapViewer({
  boundary, plots = [], selectedPlotId, onPlotSelect, className, height = 360,
}: GISMapViewerProps) {
  // Build a combined bounds from boundary + all plot geometries
  const allRings: number[][][] = []
  if (boundary?.coordinates) allRings.push(...boundary.coordinates)
  for (const p of plots) if (p.geometry && p.geometry.length >= 3) allRings.push([p.geometry])
  const bounds = computeBounds(allRings)

  const boundaryPath = boundary?.coordinates && boundary.coordinates[0]?.length > 0
    ? (() => {
        const projected = projectCoords(boundary.coordinates[0], bounds)
        return projected.length > 0
          ? projected.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z'
          : null
      })()
    : null

  return (
    <Card className={cn('overflow-hidden border-border/60 shadow-sm', className)}>
      <CardContent className="p-0">
        <div className="relative" style={{ height }}>
          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
              </pattern>
              <pattern id="grid-minor" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-border/40" />
              </pattern>
            </defs>
            <rect width={VIEW_W} height={VIEW_H} fill="url(#grid-minor)" />
            <rect width={VIEW_W} height={VIEW_H} fill="url(#grid)" />

            {/* Boundary polygon */}
            {boundaryPath && (
              <>
                <path d={boundaryPath} fill={boundary.color ?? '#16a34a'} fillOpacity={0.08} stroke={boundary.color ?? '#16a34a'} strokeWidth={2.5} strokeDasharray="6 3" />
                <text x={VIEW_W / 2} y={20} textAnchor="middle" className="fill-foreground text-[11px] font-medium">
                  Project Boundary
                </text>
              </>
            )}

            {/* Plots */}
            {plots.map((plot) => {
              if (!plot.geometry || plot.geometry.length < 3) return null
              const meta = LAND_TYPE_META[plot.landType] ?? LAND_TYPE_META.tenancy
              const pts = projectCoords(plot.geometry, bounds)
              const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z'
              const isSelected = plot.id === selectedPlotId
              // Centroid for label
              const cx = pts.reduce((a, [x]) => a + x, 0) / pts.length
              const cy = pts.reduce((a, [, y]) => a + y, 0) / pts.length
              return (
                <g
                  key={plot.id}
                  className={onPlotSelect ? 'cursor-pointer' : ''}
                  onClick={() => onPlotSelect?.(plot.id)}
                >
                  <path
                    d={d}
                    fill={meta.bg}
                    fillOpacity={isSelected ? 0.95 : 0.6}
                    stroke={meta.color}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="transition-all hover:fill-opacity-90"
                  />
                  <text x={cx} y={cy} textAnchor="middle" className="fill-foreground text-[10px] font-semibold pointer-events-none">
                    {plot.plotNumber}
                  </text>
                </g>
              )
            })}

            {/* Empty state */}
            {!boundaryPath && plots.length === 0 && (
              <text x={VIEW_W / 2} y={VIEW_H / 2} textAnchor="middle" className="fill-muted-foreground text-xs">
                No boundary or plots configured
              </text>
            )}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-2 left-2 rounded-md border border-border/60 bg-background/95 px-2 py-1.5 backdrop-blur">
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
              {Object.entries(LAND_TYPE_META).map(([k, m]) => (
                <div key={k} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: m.color }} />
                  <span className="text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
