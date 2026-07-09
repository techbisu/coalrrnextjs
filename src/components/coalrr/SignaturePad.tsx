'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AlertCircle, Eraser, PenLine } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SignaturePadProps {
  value?: string
  onChange?: (base64: string) => void
  label?: string
  required?: boolean
  className?: string
  height?: number
}

export function SignaturePad({
  value, onChange, label = 'Digital Signature', required, className, height = 160,
}: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const drawingRef = React.useRef(false)
  const lastPtRef = React.useRef<{ x: number; y: number } | null>(null)
  const [hasInk, setHasInk] = React.useState(!!value)
  const [signedAt, setSignedAt] = React.useState<string | null>(null)

  // Initialize canvas size on mount
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(ratio, ratio)
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#0f172a'
    }
  }, [])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    drawingRef.current = true
    lastPtRef.current = getPos(e)
    canvasRef.current?.setPointerCapture(e.pointerId)
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !lastPtRef.current) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPtRef.current.x, lastPtRef.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPtRef.current = pos
    if (!hasInk) setHasInk(true)
  }

  const end = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPtRef.current = null
    const canvas = canvasRef.current
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png')
      onChange?.(dataUrl)
      setSignedAt(new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
    setSignedAt(null)
    onChange?.('')
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </Label>
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={clear} disabled={!hasInk}>
          <Eraser className="h-3 w-3" /> Clear
        </Button>
      </div>
      <div className="relative rounded-lg border-2 border-dashed border-border bg-muted/20">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="block w-full touch-none cursor-crosshair rounded-lg"
          style={{ height }}
        />
        {!hasInk && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground/60">
            <PenLine className="h-5 w-5" />
            <span className="text-xs">Sign here using mouse or touch</span>
          </div>
        )}
      </div>
      {signedAt && (
        <p className="text-[11px] text-emerald-600">✓ Signed at {signedAt}</p>
      )}
      {required && !hasInk && (
        <p className="flex items-center gap-1 text-[11px] text-rose-600">
          <AlertCircle className="h-3 w-3" /> Signature required to proceed
        </p>
      )}
    </div>
  )
}
