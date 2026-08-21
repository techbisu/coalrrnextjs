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
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues
  })

  // Reset form when saved values arrive from the server (async)
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      form.reset(defaultValues)
    }
  }, [JSON.stringify(defaultValues)])

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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="text-rose-500 text-xs font-semibold bg-rose-50 p-2.5 rounded border border-rose-200">{error}</div>}
      
      {fields.map((field: any) => {
        // Evaluate conditional rendering logic
        const shouldShow = evaluateConditions(watchedValues, field.show_if || null);
        
        if (!shouldShow) return null;

        const isSelect = field.field_type === 'select';
        const isTextarea = field.field_type === 'textarea';

        return (
          <div key={field.field_key} className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {field.label} {field.is_required && <span className="text-rose-500">*</span>}
            </label>
            {isSelect ? (
              <select
                {...form.register(field.field_key)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select option...</option>
                {Array.isArray(field.options) && field.options.map((opt: any, idx: number) => {
                  const val = typeof opt === 'object' && opt !== null ? (opt.value ?? opt.label ?? String(idx)) : String(opt);
                  const lbl = typeof opt === 'object' && opt !== null ? (opt.label ?? opt.value ?? String(opt)) : String(opt);
                  return (
                    <option key={`${val}-${idx}`} value={val}>
                      {lbl}
                    </option>
                  );
                })}
              </select>
            ) : isTextarea ? (
              <textarea
                {...form.register(field.field_key)}
                rows={3}
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter details..."
              />
            ) : (
              <Input
                type={field.field_type === 'date' ? 'date' : 'text'}
                {...form.register(field.field_key)}
                className="text-xs h-9"
              />
            )}
            {form.formState.errors[field.field_key] && (
              <span className="text-rose-500 text-xs font-medium">
                {form.formState.errors[field.field_key]?.message as string}
              </span>
            )}
          </div>
        );
      })}
      
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full mt-4"
      >
        {isSubmitting ? 'Saving...' : 'Save & Update Document'}
      </Button>
    </form>
  )
}

