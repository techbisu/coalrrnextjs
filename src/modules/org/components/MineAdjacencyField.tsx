'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/shared/components/ui/label'
import { useToast } from '@/shared/hooks/use-toast'

interface MineAdjacencyFieldProps {
  mineCd: string
}

export function MineAdjacencyField({ mineCd }: MineAdjacencyFieldProps) {
  const { toast } = useToast()
  const [allMines, setAllMines] = useState<any[]>([])
  const [adjacentMines, setAdjacentMines] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch all mines
    // Assuming there's a master API for mines, if not, we'd need one.
    // For now we'll just fetch adjacent mines and display them.
    const fetchAdjacency = async () => {
      try {
        const res = await fetch(`/api/org/mines/${mineCd}/adjacency`)
        if (res.ok) {
          const data = await res.json()
          setAdjacentMines(data.map((m: any) => m.mine_cd))
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchAdjacency()
  }, [mineCd])

  const handleUpdate = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/org/mines/${mineCd}/adjacency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjacentMineIds: adjacentMines })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update adjacency')
      }

      toast({ title: 'Adjacency updated successfully' })
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-2 p-4 border rounded-md">
      <Label>Adjacent Mines for {mineCd}</Label>
      <div className="text-sm text-muted-foreground">
        {adjacentMines.length ? adjacentMines.join(', ') : 'None'}
      </div>
      {/* A real implementation would have a multi-select combobox here */}
      <button 
        className="text-blue-500 text-sm w-fit"
        onClick={() => {
          const m = prompt('Enter comma-separated mine codes to make adjacent (e.g. M02,M03):', adjacentMines.join(','))
          if (m !== null) {
            setAdjacentMines(m.split(',').map(s => s.trim()).filter(Boolean))
          }
        }}
      >
        Edit Adjacency
      </button>
      <button 
        className="bg-black text-white px-3 py-1 rounded-md mt-2 w-fit"
        onClick={handleUpdate} 
        disabled={loading}
      >
        Save Adjacency
      </button>
    </div>
  )
}
