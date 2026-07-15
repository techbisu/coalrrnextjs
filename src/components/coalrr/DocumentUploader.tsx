'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { UploadCloud, FileText, CheckCircle2, Loader2, X, ShieldCheck } from 'lucide-react'

export interface UploadedDoc {
  id?: string
  file_name: string
  file_size_kb: number
  mime_type: string
  virus_scan_status: 'clean' | 'scanning' | 'infected'
  uploaded_by?: string
  entry_ts?: string
}

export interface DocumentUploaderProps {
  checklist_item_key: string
  label?: string
  accept?: string
  maxSizeKb?: number
  documents: UploadedDoc[]
  onUpload?: (file: File) => void | Promise<void>
  onRemove?: (doc: UploadedDoc) => void
  uploading?: boolean
  uploadProgress?: number
  className?: string
  /** Disable drop zone when not allowed */
  disabled?: boolean
}

export function DocumentUploader({
  checklist_item_key,
  label = 'Upload document',
  accept = '.pdf,.jpg,.jpeg,.png,.docx',
  maxSizeKb = 10240,
  documents,
  onUpload,
  onRemove,
  uploading,
  uploadProgress = 0,
  className,
  disabled,
}: DocumentUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const [clientError, setClientError] = React.useState<string | null>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    setClientError(null)
    // Layer-1 client-side validation (per spec §1.3.1)
    if (file.size / 1024 > maxSizeKb) {
      setClientError(`File exceeds ${Math.round(maxSizeKb / 1024)} MB limit.`)
      return
    }
    const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase()
    if (accept && !accept.toLowerCase().includes(ext)) {
      setClientError(`File type ${ext} not allowed.`)
      return
    }
    onUpload?.(file)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="outline" className="font-mono text-[10px]">{checklist_item_key}</Badge>
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled || uploading}
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-amber-900 hover:file:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:file:bg-amber-900/30 dark:file:text-amber-200 dark:hover:file:bg-amber-900/50"
        />
        {uploading && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
            <p className="text-xs text-muted-foreground">Uploading...</p>
            <Progress value={uploadProgress} className="h-1 flex-1" indicatorClassName="bg-amber-500" />
          </div>
        )}
      </div>

      {clientError && (
        <p className="text-[11px] text-rose-600">{clientError}</p>
      )}

      {documents.length > 0 && (
        <ul className="space-y-1">
          {documents.map((doc, i) => (
            <li
              key={doc.id ?? `${doc.file_name}-${i}`}
              className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-2.5 py-1.5"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{doc.file_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {(doc.file_size_kb / 1024).toFixed(2)} MB · {doc.mime_type}
                </p>
              </div>
              {doc.virus_scan_status === 'clean' && (
                <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 px-1.5 text-[10px] text-emerald-700 dark:bg-emerald-950">
                  <ShieldCheck className="h-2.5 w-2.5" /> clean
                </Badge>
              )}
              {doc.virus_scan_status === 'scanning' && (
                <Badge variant="outline" className="gap-1 px-1.5 text-[10px]">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" /> scanning
                </Badge>
              )}
              {onRemove && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(doc)}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
