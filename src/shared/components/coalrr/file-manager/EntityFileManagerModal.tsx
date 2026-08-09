'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Progress } from '@/shared/components/ui/progress'
import { toast } from 'sonner'
import {
  FileText, UploadCloud, Link as LinkIcon, Search, Eye, Download,
  Tag, X, Check, Loader2, Filter, Plus, ShieldCheck, File,
  FileImage, FileArchive, FileBadge2, FolderOpen, Trash2,
} from 'lucide-react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadConfig } from '@/core/config/upload.config'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EntityFile {
  attachment_id: string
  file_id: string
  file_name: string
  file_size_kb: number
  mime_type: string
  storage_path?: string
  tags: string[]
  status: string
  uploaded_by: string
  entry_ts: string
  module?: string
}

export interface EntityFileManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: string
  entityId: string
  title?: string
  description?: string
  defaultTab?: 'list' | 'upload' | 'link'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRESET_TAGS = [
  'Justification Note',
  'Survey Map',
  'Gazette Notification',
  'Title Search Report',
  'Rate Valuation Minutes',
  'Board Resolution',
  'Form XXII Deviation',
  'Form VII Signatures',
  'Forest Clearance',
]

function getMimeIcon(mime: string) {
  if (mime.startsWith('image/'))                        return <FileImage className="h-5 w-5 text-blue-500" />
  if (mime.includes('pdf'))                             return <FileBadge2 className="h-5 w-5 text-red-500" />
  if (mime.includes('zip') || mime.includes('archive')) return <FileArchive className="h-5 w-5 text-amber-500" />
  return <FileText className="h-5 w-5 text-indigo-500" />
}

function getExtension(mime: string): string {
  if (mime.includes('pdf'))                              return 'PDF'
  if (mime.includes('png'))                              return 'PNG'
  if (mime.includes('jpeg') || mime.includes('jpg'))     return 'JPG'
  if (mime.includes('wordprocessingml') || mime.includes('docx')) return 'DOCX'
  if (mime.includes('spreadsheetml')   || mime.includes('xlsx'))  return 'XLSX'
  return mime.split('/')[1]?.toUpperCase().slice(0, 6) || 'FILE'
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Tag badge ────────────────────────────────────────────────────────────────
function TagChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 text-[10px] font-medium px-2 py-0.5">
      <Tag className="h-2.5 w-2.5 shrink-0" />{label}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EntityFileManagerModal({
  open,
  onOpenChange,
  entityType,
  entityId,
  title = 'Document Workspace',
  description = 'Browse, upload tagged documents, and link repository files to this record.',
  defaultTab = 'list',
}: EntityFileManagerModalProps) {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = React.useState<'list' | 'upload' | 'link'>(defaultTab)

  React.useEffect(() => { if (open) setActiveTab(defaultTab) }, [open, defaultTab])

  // ── Query: attached entity files ──────────────────────────────────────────
  const { data: files = [], isLoading } = useQuery<EntityFile[]>({
    queryKey: ['entity-files', entityType, entityId],
    queryFn: async () => {
      const res = await fetch(`/api/files/entity/${entityType}/${entityId}`)
      if (!res.ok) throw new Error('Failed to fetch files')
      return (await res.json()).data || []
    },
    enabled: open,
  })

  // ── Tab 1 state ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]               = React.useState('')
  const [selectedTagFilter, setSelectedTagFilter]   = React.useState<string | null>(null)
  const [editingTagsFile, setEditingTagsFile]       = React.useState<EntityFile | null>(null)
  const [editTagsList, setEditTagsList]             = React.useState<string[]>([])
  const [editCustomTag, setEditCustomTag]           = React.useState('')

  // ── Tab 2 state ───────────────────────────────────────────────────────────
  const [pendingUploads, setPendingUploads]   = React.useState<File[]>([])
  const [selectedTags, setSelectedTags]       = React.useState<string[]>([])
  const [customTag, setCustomTag]             = React.useState('')
  const [isUploading, setIsUploading]         = React.useState(false)
  const [uploadProgress, setUploadProgress]   = React.useState(0)

  // ── Tab 3 state ───────────────────────────────────────────────────────────
  const [repoSearch, setRepoSearch]         = React.useState('')
  const [selectedRepoIds, setSelectedRepoIds] = React.useState<Set<string>>(new Set())
  const [isLinking, setIsLinking]           = React.useState(false)

  // ── Repo search (debounced) — uses /api/files?q= endpoint ────────────────
  const [debouncedRepoSearch, setDebouncedRepoSearch] = React.useState('')
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedRepoSearch(repoSearch), 400)
    return () => clearTimeout(t)
  }, [repoSearch])

  const { data: repoFiles = [], isFetching: repoSearching } = useQuery<{
    id: string; file_name: string; file_size_kb: number; mime_type: string; entry_ts: string
  }[]>({
    queryKey: ['repo-file-search', debouncedRepoSearch],
    queryFn: async () => {
      const q = debouncedRepoSearch.trim()
      const url = q ? `/api/files?q=${encodeURIComponent(q)}` : `/api/files?q=`
      const res = await fetch(url)
      if (!res.ok) return []
      const data = (await res.json()).data || []
      return q ? data : data.slice(0, 10)
    },
    enabled: activeTab === 'link',
  })

  // ── Derived ────────────────────────────────────────────────────────────────
  const allUniqueTags = React.useMemo(() => {
    const s = new Set<string>()
    files.forEach((f) => f.tags?.forEach((t) => s.add(t)))
    return Array.from(s)
  }, [files])

  const filteredFiles = React.useMemo(() =>
    files.filter((f) => {
      const q = searchQuery.toLowerCase()
      return (!q || f.file_name.toLowerCase().includes(q) || f.tags.some((t) => t.toLowerCase().includes(q)))
          && (!selectedTagFilter || f.tags.includes(selectedTagFilter))
    })
  , [files, searchQuery, selectedTagFilter])

  // ── Tag helpers ────────────────────────────────────────────────────────────
  const toggleUploadTag = (tag: string) =>
    setSelectedTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag])

  const addCustomTag = () => {
    const t = customTag.trim()
    if (t && !selectedTags.includes(t)) { setSelectedTags((p) => [...p, t]); setCustomTag('') }
  }

  // ── Dropzone ───────────────────────────────────────────────────────────────
  const onDrop = React.useCallback((accepted: File[], rejections: FileRejection[]) => {
    if (rejections.length > 0) {
      toast.error(`Some files were rejected. Max size is ${uploadConfig.maxFileSizeMb}MB and must be an allowed type.`)
    }
    
    setPendingUploads((p) => {
      const newTotal = p.length + accepted.length
      if (newTotal > uploadConfig.maxFilesPerUpload) {
        toast.error(`You can only upload up to ${uploadConfig.maxFilesPerUpload} files at once.`)
        return [...p, ...accepted].slice(0, uploadConfig.maxFilesPerUpload)
      }
      return [...p, ...accepted]
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: uploadConfig.maxFileSizeMb * 1024 * 1024,
    maxFiles: uploadConfig.maxFilesPerUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg':      ['.jpg', '.jpeg'],
      'image/png':       ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':       ['.xlsx'],
    },
  })

  // ── Upload submit ──────────────────────────────────────────────────────────
  const handleUploadSubmit = async () => {
    if (!pendingUploads.length) { toast.error('Select at least one file'); return }
    setIsUploading(true); setUploadProgress(10)
    try {
      let done = 0
      for (const file of pendingUploads) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('tags', JSON.stringify(selectedTags))
        fd.append('module', 'custom_upload')
        const res = await fetch(`/api/files/entity/${entityType}/${entityId}`, { method: 'POST', body: fd })
        if (!res.ok) { const j = await res.json(); throw new Error(j.error || `Upload failed: ${file.name}`) }
        done++
        setUploadProgress(Math.round(10 + (done / pendingUploads.length) * 85))
      }
      setUploadProgress(100)
      toast.success(`${pendingUploads.length} document(s) uploaded with tags`)
      setPendingUploads([]); setSelectedTags([])
      qc.invalidateQueries({ queryKey: ['entity-files', entityType, entityId] })
      qc.invalidateQueries({ queryKey: ['entity-files-count', entityType, entityId] })
      setActiveTab('list')
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
    } finally {
      setIsUploading(false); setUploadProgress(0)
    }
  }

  // ── Tag update mutation ────────────────────────────────────────────────────
  const updateTagsMutation = useMutation({
    mutationFn: async ({ fileId, tags }: { fileId: string; tags: string[] }) => {
      const res = await fetch(`/api/files/${fileId}/tags?entityType=${encodeURIComponent(entityType)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tags }),
      })
      if (!res.ok) throw new Error('Failed to update tags')
    },
    onSuccess: () => {
      toast.success('Tags updated'); setEditingTagsFile(null)
      qc.invalidateQueries({ queryKey: ['entity-files', entityType, entityId] })
      qc.invalidateQueries({ queryKey: ['entity-files-count', entityType, entityId] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // ── Unlink mutation ────────────────────────────────────────────────────────
  const unlinkMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const res = await fetch(`/api/files/entity/${entityType}/${entityId}/${attachmentId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || 'Failed to unassign file')
      }
    },
    onSuccess: () => {
      toast.success('File unassigned from this record')
      qc.invalidateQueries({ queryKey: ['entity-files', entityType, entityId] })
      qc.invalidateQueries({ queryKey: ['entity-files-count', entityType, entityId] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // ── Link submit ────────────────────────────────────────────────────────────
  const handleLinkSubmit = async () => {
    if (!selectedRepoIds.size) { toast.error('Select at least one file'); return }
    setIsLinking(true)
    try {
      const res = await fetch(`/api/files/entity/${entityType}/${entityId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_ids: Array.from(selectedRepoIds), module: 'linked_repo' }),
      })
      if (!res.ok) throw new Error('Failed to link files')
      toast.success(`${selectedRepoIds.size} file(s) linked`)
      setSelectedRepoIds(new Set())
      qc.invalidateQueries({ queryKey: ['entity-files', entityType, entityId] })
      qc.invalidateQueries({ queryKey: ['entity-files-count', entityType, entityId] })
      setActiveTab('list')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsLinking(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/*
          KEY FIX: We set an explicit height (not just max-height) so flex children
          can properly fill available space. The DialogContent itself clips overflow.
        */}
        <DialogContent className="max-w-3xl w-full h-[82vh] flex flex-col p-0 overflow-hidden rounded-2xl shadow-2xl border-0 gap-0">

          {/* ── Header — shrink-0 keeps it always visible ── */}
          <div className="shrink-0 flex items-start gap-4 px-6 pt-5 pb-4 border-b bg-gradient-to-br from-primary/5 via-background to-background">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-bold text-foreground leading-tight">{title}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">{description}</DialogDescription>
            </div>
            {files.length > 0 && (
              <Badge className="shrink-0 self-center bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                {files.length} file{files.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/*
            KEY FIX: Tabs takes flex-1 and min-h-0.
            min-h-0 is critical — without it, flex children can expand beyond parent.
          */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="flex flex-col flex-1 min-h-0"
          >
            {/* Tab bar — shrink-0 keeps it always visible */}
            <TabsList className="shrink-0 grid grid-cols-3 mx-6 mt-4 mb-3 h-9 rounded-xl bg-muted/60">
              <TabsTrigger value="list" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Eye className="h-3.5 w-3.5" />Attached Files
                {files.length > 0 && (
                  <span className="rounded-full bg-primary/15 text-primary text-[10px] px-1.5 font-bold leading-4">{files.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upload" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <UploadCloud className="h-3.5 w-3.5" />Upload + Tag
              </TabsTrigger>
              <TabsTrigger value="link" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <LinkIcon className="h-3.5 w-3.5" />Link Existing
              </TabsTrigger>
            </TabsList>

            {/* ──── TAB 1: Attached Files ──── */}
            {/*
              KEY FIX: overflow-y-auto on TabsContent directly — do NOT use overflow-hidden.
              Remove ScrollArea wrapper; instead make the TabsContent itself scroll.
              flex-1 min-h-0 allow it to take remaining space without overflowing parent.
            */}
            <TabsContent value="list" className="flex-1 min-h-0 flex flex-col mt-0 outline-none">
              {/* Sticky controls — do NOT put these inside the scroll area */}
              <div className="shrink-0 px-6 space-y-2 pb-2">
                {/* Search bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by file name or tag…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-xs bg-muted/40 border-transparent focus:border-primary/30 focus:bg-background transition-all"
                  />
                </div>
                {/* Tag filter pills */}
                {allUniqueTags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
                    {allUniqueTags.map((t) => (
                      <button
                        key={t} type="button"
                        onClick={() => setSelectedTagFilter(selectedTagFilter === t ? null : t)}
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-all cursor-pointer',
                          selectedTagFilter === t
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/60 text-muted-foreground border-transparent hover:border-primary/30 hover:text-primary'
                        )}
                      >#{t}</button>
                    ))}
                    {selectedTagFilter && (
                      <button type="button" onClick={() => setSelectedTagFilter(null)}
                        className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer flex items-center gap-0.5">
                        <X className="h-3 w-3" />Clear
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Scrollable file list */}
              <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-xs">Loading documents…</span>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-14 border-2 border-dashed rounded-xl text-muted-foreground mt-2">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <FolderOpen className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold">No documents found</p>
                      <p className="text-xs mt-1 max-w-[220px] text-muted-foreground">
                        {searchQuery || selectedTagFilter ? 'Try adjusting your search or tag filter.' : 'Upload or link files using the tabs above.'}
                      </p>
                    </div>
                    {!searchQuery && !selectedTagFilter && (
                      <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 mt-1" onClick={() => setActiveTab('upload')}>
                        <UploadCloud className="h-3.5 w-3.5" />Upload a Document
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 mt-1">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.attachment_id}
                        className="group flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/30 hover:bg-primary/[0.02] transition-all"
                      >
                        {/* MIME icon */}
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          {getMimeIcon(file.mime_type)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold truncate text-foreground">{file.file_name}</p>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold shrink-0 px-1.5 py-0">
                              {getExtension(file.mime_type)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                            <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span>{file.file_size_kb} KB</span>
                            <span>·</span>
                            <span className="truncate max-w-[120px]">{file.uploaded_by}</span>
                            <span>·</span>
                            <span>{formatDate(file.entry_ts)}</span>
                          </div>
                          {/* Tags + edit */}
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {file.tags.map((t) => <TagChip key={t} label={t} />)}
                            <button
                              type="button"
                              className="text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:underline underline-offset-2"
                              onClick={() => { setEditingTagsFile(file); setEditTagsList([...file.tags]) }}
                            >
                              {file.tags.length > 0 ? 'Edit tags' : '+ Add tags'}
                            </button>
                          </div>
                        </div>

                        {/* Hover actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" title="View"
                            onClick={() => window.open(`/api/files/${file.file_id}/download`, '_blank')}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" title="Download"
                            onClick={() => window.open(`/api/files/${file.file_id}/download`, '_blank')}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" 
                            title="Unassign"
                            disabled={unlinkMutation.isPending}
                            onClick={() => {
                              if (window.confirm('Are you sure you want to unassign this file from this record?')) {
                                unlinkMutation.mutate(file.attachment_id)
                              }
                            }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ──── TAB 2: Upload + Tag ──── */}
            <TabsContent value="upload" className="flex-1 min-h-0 overflow-y-auto mt-0 px-6 pb-6 outline-none">
              <div className="space-y-5 pt-1">
                {/* Drop zone */}
                <div
                  {...getRootProps()}
                  className={cn(
                    'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer select-none transition-all',
                    isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  <input {...getInputProps()} />
                  <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center transition-colors', isDragActive ? 'bg-primary/15' : 'bg-muted')}>
                    <UploadCloud className={cn('h-7 w-7 transition-colors', isDragActive ? 'text-primary' : 'text-muted-foreground')} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{isDragActive ? 'Drop files here' : 'Drag & drop files, or click to browse'}</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX, PNG, JPG · up to 25 MB per file</p>
                  </div>
                </div>

                {/* Pending queue */}
                {pendingUploads.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selected ({pendingUploads.length})</p>
                    <div className="space-y-1.5">
                      {pendingUploads.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border px-3 py-2 bg-muted/30 text-sm">
                          {getMimeIcon(f.type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs truncate">{f.name}</p>
                            <p className="text-[11px] text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button type="button"
                            onClick={() => setPendingUploads((p) => p.filter((_, idx) => idx !== i))}
                            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tag panel */}
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider">Assign Metadata Tags</span>
                    </div>
                    {selectedTags.length > 0 && <span className="text-[11px] text-muted-foreground">{selectedTags.length} selected</span>}
                  </div>

                  {/* Preset pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TAGS.map((tag) => {
                      const active = selectedTags.includes(tag)
                      return (
                        <button key={tag} type="button" onClick={() => toggleUploadTag(tag)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold border cursor-pointer transition-all select-none',
                            active ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background text-foreground border-border hover:border-primary/50 hover:text-primary hover:bg-primary/5'
                          )}>
                          {active ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                          {tag}
                        </button>
                      )
                    })}
                  </div>

                  {/* Custom tag input — KEY FIX: controlled Input with value+onChange */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border/60">
                    <div className="relative flex-1">
                      <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
                        placeholder="Custom tag (press Enter to add)"
                        className="pl-8 h-8 text-xs bg-background"
                      />
                    </div>
                    <Button type="button" size="sm" variant="outline" className="h-8 text-xs shrink-0 px-3" onClick={addCustomTag}>
                      Add
                    </Button>
                  </div>

                  {/* Active tags */}
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedTags.map((t) => (
                        <span key={t}
                          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 text-[10px] font-medium px-2.5 py-1">
                          #{t}
                          <button type="button" onClick={() => toggleUploadTag(t)}
                            className="ml-0.5 cursor-pointer hover:text-destructive transition-colors">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload progress */}
                {isUploading && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" />Uploading…</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5 rounded-full" />
                  </div>
                )}

                {/* Submit */}
                <Button onClick={handleUploadSubmit} disabled={!pendingUploads.length || isUploading}
                  className="w-full h-10 font-semibold gap-2 rounded-xl">
                  {isUploading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</>
                    : <><UploadCloud className="h-4 w-4" />Upload {pendingUploads.length > 0 ? `${pendingUploads.length} File(s)` : 'Documents'} with Tags</>
                  }
                </Button>
              </div>
            </TabsContent>

            {/* ──── TAB 3: Link Existing ──── */}
            {/*
              KEY FIX: Use /api/files?q= to search ALL user repository files, not just attached ones.
              Show results immediately (shows all 50 recent on empty search).
            */}
            <TabsContent value="link" className="flex-1 min-h-0 flex flex-col mt-0 outline-none">
              {/* Sticky top controls */}
              <div className="shrink-0 px-6 space-y-2 pb-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Search and select repository files to attach to this record — no re-upload required.
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search repository files by name…"
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    className="pl-8 h-9 text-xs bg-muted/40 border-transparent focus:border-primary/30 focus:bg-background transition-all"
                  />
                </div>
              </div>

              {/* Scrollable results */}
              <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
                {repoSearching ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-xs">Searching repository…</span>
                  </div>
                ) : repoFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed rounded-xl text-muted-foreground mt-2">
                    <File className="h-8 w-8 text-muted-foreground/40" />
                    <div className="text-center">
                      <p className="text-sm font-semibold">No files found</p>
                      <p className="text-xs mt-1">
                        {repoSearch ? `No results for "${repoSearch}"` : 'Upload files first, then link them here.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 mt-1">
                    {repoFiles.map((file) => {
                      const checked = selectedRepoIds.has(file.id)
                      return (
                        <div
                          key={file.id}
                          onClick={() => {
                            const s = new Set(selectedRepoIds)
                            checked ? s.delete(file.id) : s.add(file.id)
                            setSelectedRepoIds(s)
                          }}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none',
                            checked ? 'border-primary/40 bg-primary/5' : 'border-transparent bg-muted/30 hover:border-border hover:bg-muted/60'
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => {
                              const s = new Set(selectedRepoIds)
                              checked ? s.delete(file.id) : s.add(file.id)
                              setSelectedRepoIds(s)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0"
                          />
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            {getMimeIcon(file.mime_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{file.file_name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {file.file_size_kb} KB · {formatDate(file.entry_ts)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0 uppercase mr-2">
                            {getExtension(file.mime_type)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary z-10"
                            title="Preview file"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`/api/files/${file.id}/download`, '_blank')
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Sticky footer CTA — only when files selected */}
              {selectedRepoIds.size > 0 && (
                <div className="shrink-0 px-6 pb-5 pt-2 border-t bg-background">
                  <Button onClick={handleLinkSubmit} disabled={isLinking} className="w-full h-10 font-semibold gap-2 rounded-xl">
                    {isLinking
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Linking…</>
                      : <><LinkIcon className="h-4 w-4" />Link {selectedRepoIds.size} Selected File{selectedRepoIds.size !== 1 ? 's' : ''}</>
                    }
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>



      {/* ── Edit tags sub-modal ── */}
      {editingTagsFile && (
        <Dialog open={!!editingTagsFile} onOpenChange={() => setEditingTagsFile(null)}>
          <DialogContent className="max-w-sm rounded-2xl p-6 gap-0">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold">
                <Tag className="h-4 w-4 text-primary" />Edit Tags
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                {editingTagsFile.file_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {/* Current tags */}
              {editTagsList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {editTagsList.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 border border-indigo-100 dark:border-indigo-900 text-[11px] font-medium px-2.5 py-1">
                      #{t}
                      <button type="button" onClick={() => setEditTagsList((p) => p.filter((x) => x !== t))}
                        className="cursor-pointer hover:text-destructive transition-colors ml-0.5">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No tags yet. Add tags below.</p>
              )}

              {/* Preset pills to add */}
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/60">
                {PRESET_TAGS.filter((t) => !editTagsList.includes(t)).map((t) => (
                  <button key={t} type="button" onClick={() => setEditTagsList((p) => [...p, t])}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border border-border hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
                    <Plus className="h-2.5 w-2.5" />{t}
                  </button>
                ))}
              </div>

              {/* Custom tag input — KEY FIX: fully controlled */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    value={editCustomTag}
                    onChange={(e) => setEditCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const t = editCustomTag.trim()
                        if (t && !editTagsList.includes(t)) { setEditTagsList((p) => [...p, t]); setEditCustomTag('') }
                      }
                    }}
                    placeholder="Add custom tag…"
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <Button type="button" size="sm" variant="outline" className="h-8 text-xs shrink-0 px-3"
                  onClick={() => {
                    const t = editCustomTag.trim()
                    if (t && !editTagsList.includes(t)) { setEditTagsList((p) => [...p, t]); setEditCustomTag('') }
                  }}>Add</Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" size="sm" className="flex-1 h-9 text-xs" onClick={() => setEditingTagsFile(null)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-9 text-xs"
                disabled={updateTagsMutation.isPending}
                onClick={() => updateTagsMutation.mutate({ fileId: editingTagsFile.file_id, tags: editTagsList })}>
                {updateTagsMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Save Tags
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
