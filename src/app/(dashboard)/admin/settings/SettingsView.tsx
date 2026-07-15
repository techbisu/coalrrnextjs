'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useToast } from '@/shared/hooks/use-toast'
import { updateSettings } from './actions'

interface ConfigItem {
  id: string
  category: string
  key: string
  value: string
  type: string
  description: string | null
  is_secret: boolean
}

export function SettingsView({ initialConfigs }: { initialConfigs: ConfigItem[] }) {
  const [configs, setConfigs] = useState(initialConfigs)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const grouped = configs.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = []
    acc[curr.category].push(curr)
    return acc
  }, {} as Record<string, ConfigItem[]>)

  const handleSave = async (category: string) => {
    setLoading(true)
    try {
      const categoryConfigs = configs.filter(c => c.category === category)
      const payload = categoryConfigs.map(c => ({ key: c.key, value: c.value }))
      await updateSettings(payload)
      toast({ title: 'Success', description: 'Settings saved successfully.' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">System Settings</h2>
          <p className="text-sm text-muted-foreground">Manage enterprise configuration, security, and integration parameters.</p>
        </div>
      </div>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="border rounded-lg p-6 bg-card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{category} Settings</h2>
            <Button onClick={() => handleSave(category)} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {items.map(item => (
              <div key={item.key} className="space-y-2">
                <Label>{item.key.replace(/_/g, ' ').toUpperCase()}</Label>
                {item.type === 'boolean' ? (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={item.value}
                    onChange={(e) => handleChange(item.key, e.target.value)}
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                ) : (
                  <Input
                    type={item.is_secret && item.value === '********' ? 'password' : 'text'}
                    value={item.value}
                    onChange={(e) => handleChange(item.key, e.target.value)}
                    placeholder={item.description || ''}
                  />
                )}
                {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
      {configs.length === 0 && (
        <div className="text-center text-muted-foreground p-8 border rounded-lg border-dashed">
          No system configurations found. Seed the database with default configurations.
        </div>
      )}
    </div>
  )
}
