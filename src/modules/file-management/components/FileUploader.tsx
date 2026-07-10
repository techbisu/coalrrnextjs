'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, X, Loader2 } from 'lucide-react';

interface FileUploaderProps {
  module: string;
  entity_type?: string;
  entity_id?: string;
  multiple?: boolean;
  maxFiles?: number;
  onUploadComplete?: (fileIds: string[]) => void;
}

export function FileUploader({ module, entity_type, entity_id, multiple = false, maxFiles = 10, onUploadComplete }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => multiple ? [...prev, ...droppedFiles].slice(0, maxFiles) : [droppedFiles[0]]);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    
    try {
      const uploadedIds: string[] = [];
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('module', module);
        if (entity_type) formData.append('entity_type', entity_type);
        if (entity_id) formData.append('entity_id', entity_id);

        const res = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        uploadedIds.push(data.file_id);
      }
      
      setFiles([]);
      if (onUploadComplete) onUploadComplete(uploadedIds);
      
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop your files here, or click to select
        </p>
        <input 
          type="file" 
          multiple={multiple} 
          className="hidden" 
          id="file-upload" 
          onChange={(e) => {
            if (e.target.files) {
              const selected = Array.from(e.target.files);
              setFiles((prev) => multiple ? [...prev, ...selected].slice(0, maxFiles) : [selected[0]]);
            }
          }} 
        />
        <Button variant="secondary" onClick={() => document.getElementById('file-upload')?.click()}>
          Select Files
        </Button>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-2 border rounded-md text-sm">
              <span className="truncate">{f.name}</span>
              <Button variant="ghost" size="icon" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button className="w-full" onClick={handleUpload} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Upload {files.length} {files.length === 1 ? 'file' : 'files'}
          </Button>
        </div>
      )}
    </div>
  );
}
