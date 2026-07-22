'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

import { cn } from '@/lib/utils'
import { UploadCloud, FileText, Loader2, X, Search, FileDown, ShieldCheck, CheckCircle2, Eye } from 'lucide-react'
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
  
  // Pending files to be uploaded (New Uploads)
  const [pendingFiles, setPendingFiles] = React.useState<{ file: File; id: string; progress: number; status: 'pending' | 'uploading' | 'success' | 'error'; doc?: UploadedDoc; errorMsg?: string }[]>([])

  // Existing files selection state
  const [searchQuery, setSearchQuery] = React.useState('')
  const [existingFiles, setExistingFiles] = React.useState<UploadedDoc[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [selectedExistingIds, setSelectedExistingIds] = React.useState<Set<string>>(new Set())

  // Upload Logic (unchanged mostly)
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
    
    if (fileRejections.length > 0) {
      toast.error(t('error_type', 'File type not allowed.'))
      return
    }

    if (mode === 'single' && acceptedFiles.length > 0) {
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

  const handleDoneNewUpload = () => {
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

  // Handle Existing Files Search
  const searchExistingFiles = async (query: string) => {
    if (!query.trim()) {
      setExistingFiles([])
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch(`/api/files?q=${encodeURIComponent(query)}`)
      const json = await res.json()
      if (res.ok) {
        setExistingFiles(json.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchExistingFiles(searchQuery)
      } else {
        setExistingFiles([])
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSelectExisting = (doc: UploadedDoc, checked: boolean) => {
    if (mode === 'single') {
      // In single mode, selecting one clears others
      if (checked && doc.id) {
        setSelectedExistingIds(new Set([doc.id]))
      } else {
        setSelectedExistingIds(new Set())
      }
    } else {
      setSelectedExistingIds(prev => {
        const next = new Set(prev)
        if (checked && doc.id) next.add(doc.id)
        else if (doc.id) next.delete(doc.id)
        return next
      })
    }
  }

  const handleConfirmExisting = async () => {
    const selectedDocs = existingFiles.filter(f => f.id && selectedExistingIds.has(f.id))
    if (selectedDocs.length === 0) return

    // Link each selected existing file to the entity in the DB
    if (entity_type && entity_id) {
      try {
        await Promise.all(
          selectedDocs.map(doc =>
            fetch('/api/files/link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                file_id: doc.id,
                entity_type,
                entity_id,
                module: moduleProp || checklist_item_key,
              }),
            })
          )
        )
      } catch (e) {
        console.error('Failed to link files:', e)
      }
    }

    if (mode === 'single') {
      onChange?.(selectedDocs[0])
    } else {
      onChange?.(selectedDocs)
    }
    setOpen(false)
    setSelectedExistingIds(new Set())
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
          setSearchQuery('')
          setExistingFiles([])
          setSelectedExistingIds(new Set())
        }
        setOpen(v)
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-muted-foreground" disabled={disabled}>
            <UploadCloud className="mr-2 h-4 w-4" />
            {t('btn_browse', 'Browse Files')}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('title', 'Select or Upload Document')}</DialogTitle>
            <DialogDescription>
              {t('desc', 'Upload a new file or search from your previously uploaded documents.')}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="upload" className="flex-1 overflow-hidden flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="upload">Upload New</TabsTrigger>
              <TabsTrigger value="existing">Select Existing</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="flex-1 overflow-y-auto">
              {/* Drag and Drop Zone */}
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[150px]",
                  isDragActive ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <input {...getInputProps()} />
                <UploadCloud className={cn("mb-4 h-8 w-8 text-muted-foreground transition-colors", isDragActive && "text-primary")} />
                <p className="text-sm font-medium mb-1">
                  {isDragActive ? t('drop_here', 'Drop the files here ...') : t('drag_drop', 'Drag & drop files here, or click to select files')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('supported_formats', 'Supported formats: PDF, JPG, PNG, DOCX (Max 10MB)')}
                </p>
              </div>

              {/* Upload Queue for Multiple Mode */}
              {pendingFiles.length > 0 && mode === 'multiple' && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-medium">{t('upload_queue', 'Upload Queue')}</h4>
                  <div className="space-y-2">
                    {pendingFiles.map((pf) => (
                      <div key={pf.id} className="text-sm border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 truncate pr-4">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate font-medium">{pf.file.name}</span>
                          </div>
                          {pf.status === 'pending' && <span className="text-xs text-muted-foreground shrink-0">{t('pending', 'Pending')}</span>}
                          {pf.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
                          {pf.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                          {pf.status === 'error' && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRemovePending(pf.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        {(pf.status === 'uploading' || pf.status === 'success') && (
                          <Progress value={pf.progress} className="h-1" />
                        )}
                        {pf.status === 'error' && (
                          <p className="text-xs text-destructive mt-1">{pf.errorMsg}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleDoneNewUpload} disabled={pendingFiles.some(p => p.status === 'uploading')}>
                      {t('btn_done', 'Done')}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="existing" className="data-[state=active]:flex flex-col flex-1 min-h-0 space-y-3 pt-2 hidden">
              <div className="flex flex-col space-y-1.5 shrink-0">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search your uploaded files..."
                    className="pl-9 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground pl-1">
                  {mode === 'single' ? 'Select a single file.' : 'Select one or more files.'}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 border rounded-md bg-card p-3 space-y-2">
                  {!searchQuery.trim() ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Type above to search your existing files.
                    </div>
                  ) : isSearching ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : existingFiles.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No files found matching "{searchQuery}"
                    </div>
                  ) : (
                    existingFiles.map((doc) => (
                      <div 
                        key={doc.id} 
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer w-full overflow-hidden",
                          doc.id && selectedExistingIds.has(doc.id) ? "bg-primary/5 border-primary" : "hover:bg-muted/50"
                        )}
                        onClick={() => handleSelectExisting(doc, !(doc.id && selectedExistingIds.has(doc.id)))}
                      >
                        <Checkbox 
                          checked={doc.id ? selectedExistingIds.has(doc.id) : false}
                          onCheckedChange={(checked) => handleSelectExisting(doc, checked as boolean)}
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.file_size_kb} KB &middot; {doc.entry_ts ? new Date(doc.entry_ts).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary z-10 mr-2"
                          title="Preview file"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (doc.id) window.open(`/api/files/${doc.id}/download`, '_blank')
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
              </div>

              <div className="flex justify-end pt-2 shrink-0">
                <Button 
                  onClick={handleConfirmExisting} 
                  disabled={selectedExistingIds.size === 0}
                >
                  Confirm Selection ({selectedExistingIds.size})
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Display previously uploaded or selected documents */}
      {documents && documents.length > 0 && (
        <div className="grid gap-2">
          {documents.map((doc, idx) => (
            <div key={doc.id || idx} className="flex items-center justify-between p-2 text-sm border rounded bg-muted/30 group">
              <div className="flex items-center space-x-2 truncate pr-4">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate font-medium">{doc.file_name}</span>
                <span className="text-xs text-muted-foreground shrink-0">({doc.file_size_kb} KB)</span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                {doc.virus_scan_status === 'clean' ? (
                  <ShieldCheck className="h-4 w-4 text-green-500" title="Scanned and safe" />
                ) : doc.virus_scan_status === 'scanning' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" title="Scanning in progress..." />
                ) : (
                  <Badge variant="destructive" className="text-[10px]">{t('infected', 'Infected')}</Badge>
                )}
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault()
                      onRemove?.(doc)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
