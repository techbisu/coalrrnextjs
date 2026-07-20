'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { UploadCloud, FileText, Loader2, X, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'
import { MAX_FILE_SIZE_BYTES } from '@/core/validation/schemas/documentUpload.schema'
import { toast } from 'sonner'

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
  mode?: 'single' | 'multiple'
  documents?: UploadedDoc[]
  onChange?: (docs: UploadedDoc | UploadedDoc[]) => void
  onRemove?: (doc: UploadedDoc) => void
  className?: string
  disabled?: boolean
  /** Entity this document belongs to — used to create file_attachment row */
  entity_type?: string
  entity_id?: string
  module?: string
}

export function DocumentUploader({
  checklist_item_key,
  label,
  mode = 'single',
  documents = [],
  onChange,
  onRemove,
  className,
  disabled,
  entity_type,
  entity_id,
  module: moduleProp,
}: DocumentUploaderProps) {
  const t = useAppTranslation('documentUploader')
  const [open, setOpen] = React.useState(false)
  
  // Pending files to be uploaded
  const [pendingFiles, setPendingFiles] = React.useState<{ file: File; id: string; progress: number; status: 'pending' | 'uploading' | 'success' | 'error'; doc?: UploadedDoc; errorMsg?: string }[]>([])

  const uploadFiles = async (filesToUpload: typeof pendingFiles, isSingle: boolean) => {
    let finalDoc: UploadedDoc | undefined = undefined;

    for (const item of filesToUpload) {
      if (item.errorMsg) continue;

      setPendingFiles(prev => prev.map(p => p.id === item.id ? { ...p, status: 'uploading', progress: 30 } : p))
      
      try {
        const formData = new FormData()
        formData.append('file', item.file)
        formData.append('module', moduleProp || 'documents')
        if (entity_type) formData.append('entity_type', entity_type)
        if (entity_id) formData.append('entity_id', entity_id)
        
        const res = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        })
        
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Upload failed')
        
        const doc: UploadedDoc = {
          id: json.file_id,
          file_name: item.file.name,
          file_size_kb: Math.round(item.file.size / 1024),
          mime_type: item.file.type,
          virus_scan_status: 'clean'
        }

        setPendingFiles(prev => prev.map(p => p.id === item.id ? { ...p, status: 'success', progress: 100, doc } : p))
        finalDoc = doc;

      } catch (err: any) {
        setPendingFiles(prev => prev.map(p => p.id === item.id ? { ...p, status: 'error', errorMsg: err.message } : p))
      }
    }

    if (isSingle && finalDoc) {
      onChange?.(finalDoc)
      toast.success(t('success', 'Upload successful'))
      setTimeout(() => {
        setOpen(false)
        setPendingFiles([])
      }, 500)
    }
  }

  const onDrop = React.useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (disabled) return
    
    // Handle rejections
    if (fileRejections.length > 0) {
      toast.error(t('error_type', 'File type not allowed.'))
      return
    }

    if (mode === 'single' && acceptedFiles.length > 0) {
      // Replace completely
      const file = acceptedFiles[0]
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(t('error_size', 'File size exceeds the 10MB limit.'))
        return
      }
      const newFile = { file, id: Math.random().toString(), progress: 0, status: 'pending' as const }
      setPendingFiles([newFile])
      await uploadFiles([newFile], true)
    } else {
      const newFiles = acceptedFiles.map(file => {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error(t('error_size', 'File size exceeds the 10MB limit.'))
        }
        return {
          file,
          id: Math.random().toString(),
          progress: 0,
          status: 'pending' as const,
          errorMsg: file.size > MAX_FILE_SIZE_BYTES ? t('error_size', 'File size exceeds the 10MB limit.') : undefined
        }
      })
      setPendingFiles(prev => [...prev, ...newFiles])
      await uploadFiles(newFiles, false)
    }
  }, [mode, disabled, t])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: mode === 'multiple',
  })

  const handleDone = () => {
    const successfulDocs = pendingFiles.filter(p => p.status === 'success' && p.doc).map(p => p.doc as UploadedDoc)
    if (successfulDocs.length > 0) {
      onChange?.(successfulDocs)
    }
    setOpen(false)
    setPendingFiles([])
  }

  const handleRemovePending = (id: string) => {
    setPendingFiles(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label || t('title', 'Upload Documents')}</span>
        <Badge variant="outline" className="font-mono text-[10px]">{checklist_item_key}</Badge>
      </div>

      <Dialog open={open} onOpenChange={(v) => {
        if (!v) {
          setPendingFiles([])
        }
        setOpen(v)
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-muted-foreground" disabled={disabled}>
            <UploadCloud className="mr-2 h-4 w-4" />
            {t('btn_browse', 'Browse Files')}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('title', 'Upload Documents')}</DialogTitle>
            <DialogDescription>
              {t('constraints', 'Supported formats: PDF, DOCX, JPG, PNG (up to 10MB)')}
            </DialogDescription>
          </DialogHeader>

          <div
            {...getRootProps()}
            className={cn(
              "mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors cursor-pointer text-center",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <UploadCloud className={cn("mb-4 h-8 w-8 text-muted-foreground transition-colors", isDragActive && "text-primary")} />
            <p className="text-sm font-medium">
              {isDragActive ? t('description', 'Drag and drop files here, or click to browse.') : t('description', 'Drag and drop files here, or click to browse.')}
            </p>
          </div>

          {/* Upload Queue for Multiple Mode */}
          {pendingFiles.length > 0 && (
            <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {pendingFiles.map((pf) => (
                <div key={pf.id} className="flex flex-col gap-2 rounded-md border bg-muted/40 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm font-medium">{pf.file.name}</span>
                    </div>
                    {pf.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {pf.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {(pf.status === 'pending' || pf.status === 'error') && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => handleRemovePending(pf.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {(pf.status === 'uploading' || pf.status === 'success') && (
                    <Progress value={pf.progress} className="h-1.5" />
                  )}
                  {pf.status === 'error' && (
                    <p className="text-xs text-rose-500">{pf.errorMsg}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>{t('btn_cancel', 'Cancel')}</Button>
            {mode === 'multiple' && (
              <Button onClick={handleDone} disabled={pendingFiles.some(p => p.status === 'uploading')}>
                {t('btn_done', 'Done')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Display previously uploaded or selected documents */}
      {documents.length > 0 && (
        <ul className="space-y-1 mt-2">
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
                  <ShieldCheck className="h-2.5 w-2.5" /> {t('clean', 'Clean')}
                </Badge>
              )}
              {doc.virus_scan_status === 'scanning' && (
                <Badge variant="outline" className="gap-1 px-1.5 text-[10px]">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" /> {t('scanning', 'Scanning for viruses...')}
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
