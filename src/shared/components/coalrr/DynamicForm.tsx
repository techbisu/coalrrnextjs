'use client'

import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createDynamicZodSchema, evaluateConditions } from '@/modules/document-engine/application/utils/validation'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { z } from 'zod'

interface DynamicFormProps {
  instanceId: string;
  fields: Array<{
    field_key: string;
    label: string;
    field_type: string;
    is_required: boolean;
    show_if?: Record<string, any> | null;
  }>;
  onSuccess?: () => void;
  defaultValues?: Record<string, any>;
}

export function DynamicForm({ instanceId, fields, onSuccess, defaultValues = {} }: DynamicFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate Zod schema dynamically
  const schema = createDynamicZodSchema(fields)
  type FormData = z.infer<typeof schema>

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues
  })

  // Watch all values to re-evaluate conditions
  const watchedValues = useWatch({ control: form.control })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/document-engine/save-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId, formData: data })
      });
      const result = await response.json();
      
      setIsSubmitting(false)
      if (result.success) {
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to save form')
      }
    } catch (err: any) {
      setIsSubmitting(false)
      setError(err.message)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-md">
      <h3 className="text-lg font-semibold">Additional Information Required</h3>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      
      {fields.map((field) => {
        // Evaluate conditional rendering logic
        const shouldShow = evaluateConditions(watchedValues, field.show_if || null);
        
        if (!shouldShow) return null;

        return (
          <div key={field.field_key} className="flex flex-col space-y-1">
            <label className="text-sm font-medium">
              {field.label} {field.is_required && <span className="text-destructive text-red-500">*</span>}
            </label>
            <Input
              type={field.field_type === 'date' ? 'date' : 'text'}
              {...form.register(field.field_key)}
            />
            {form.formState.errors[field.field_key] && (
              <span className="text-red-500 text-xs">
                {form.formState.errors[field.field_key]?.message as string}
              </span>
            )}
          </div>
        );
      })}
      
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="mt-4"
      >
        {isSubmitting ? 'Saving...' : 'Save & Continue'}
      </Button>
    </form>
  )
}

