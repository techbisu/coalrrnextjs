'use client'

import { useState } from 'react'
import { saveDocumentFormAction } from '../actions'

interface DynamicFormProps {
  instanceId: string;
  fields: Array<{
    field_key: string;
    label: string;
    field_type: string;
    is_required: boolean;
  }>;
  onSuccess?: () => void;
}

export function DynamicForm({ instanceId, fields, onSuccess }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await saveDocumentFormAction(instanceId, formData)
    
    setIsSubmitting(false)
    if (result.success) {
      onSuccess?.()
    } else {
      setError(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md">
      <h3 className="text-lg font-semibold">Additional Information Required</h3>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      
      {fields.map((field) => (
        <div key={field.field_key} className="flex flex-col space-y-1">
          <label className="text-sm font-medium">
            {field.label} {field.is_required && <span className="text-red-500">*</span>}
          </label>
          <input
            type={field.field_type === 'date' ? 'date' : 'text'}
            className="border p-2 rounded-md"
            required={field.is_required}
            value={formData[field.field_key] || ''}
            onChange={(e) => setFormData({ ...formData, [field.field_key]: e.target.value })}
          />
        </div>
      ))}
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save & Continue'}
      </button>
    </form>
  )
}
