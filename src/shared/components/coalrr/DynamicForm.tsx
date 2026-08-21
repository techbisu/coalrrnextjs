'use client'

import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createDynamicZodSchema, evaluateConditions } from '@/modules/document-engine/application/utils/validation'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { z } from 'zod'

import { DocumentUploader, UploadedDoc } from '@/shared/components/coalrr/DocumentUploader'

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

  const form = useForm({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues
  })

  // Watch all values to re-evaluate conditions
  const watchedValues = useWatch({ control: form.control })

  // Dynamically filter schema to visible fields only
  const visibleFields = fields.filter(field => evaluateConditions(watchedValues, field.show_if || null))
  const visibleSchema = createDynamicZodSchema(visibleFields)

  // Clear errors for fields that are currently hidden
  useEffect(() => {
    fields.forEach(field => {
      const shouldShow = evaluateConditions(watchedValues, field.show_if || null);
      if (!shouldShow && form.formState.errors[field.field_key]) {
        form.clearErrors(field.field_key);
      }
    });
  }, [JSON.stringify(watchedValues)]);

  // Reset form when saved values arrive from the server (async)
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      form.reset(defaultValues)
    }
  }, [JSON.stringify(defaultValues)])

  const onSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true)
    setError(null)

    // Manual parse with visibleSchema to only validate shown fields
    const parseResult = visibleSchema.safeParse(data)
    if (!parseResult.success) {
      setIsSubmitting(false)
      const firstError = parseResult.error.issues[0]?.message || 'Please fill in all required fields'
      setError(firstError)
      parseResult.error.issues.forEach(issue => {
        const path = issue.path[0] as string
        if (path) form.setError(path, { message: issue.message })
      })
      return
    }

    try {
      const response = await fetch('/api/document-engine/save-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId, formData: parseResult.data })
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
        const isFile = field.field_type === 'file';

        if (isFile) {
          const currentVal = form.watch(field.field_key)
          const docs: UploadedDoc[] = currentVal
            ? (Array.isArray(currentVal) ? currentVal : [currentVal])
            : []

          return (
            <div key={field.field_key} className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                {field.label} {field.is_required && <span className="text-rose-500">*</span>}
              </label>
              <DocumentUploader
                checklist_item_key={field.field_key}
                label={`Upload ${field.label}`}
                mode="single"
                documents={docs}
                entity_type="document_instance"
                entity_id={instanceId}
                module="document_workspace"
                onChange={(uploaded) => {
                  form.setValue(field.field_key, uploaded as any, { shouldValidate: true })
                }}
                onRemove={() => {
                  form.setValue(field.field_key, null as any, { shouldValidate: true })
                }}
              />
              {form.formState.errors[field.field_key] && (
                <span className="text-rose-500 text-xs font-medium">
                  {form.formState.errors[field.field_key]?.message as string}
                </span>
              )}
            </div>
          )
        }

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
                {Array.isArray(field.options) && field.options.map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
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

