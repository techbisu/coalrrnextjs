'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Eye } from 'lucide-react';
import { FileUploader } from './FileUploader';
import { FilePreview } from './FilePreview';

interface AttachedFile {
  id: string;
  originalName: string;
  mimeType: string;
  createdAt: string;
  sizeBytes: number;
}

interface FileManagerProps {
  entityType: string;
  entityId: string;
  moduleName: string;
  initialFiles?: AttachedFile[];
}

export function FileManager({ entityType, entityId, moduleName, initialFiles = [] }: FileManagerProps) {
  const [files, setFiles] = useState<AttachedFile[]>(initialFiles);
  const [previewFile, setPreviewFile] = useState<AttachedFile | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUploadComplete = (newFileIds: string[]) => {
    // In a real app, you would refetch the attached files from the server here
    // For now, we'll just reload the page or trigger a revalidation
    window.location.reload();
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    // Call the delete API
    // await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
    setFiles(files.filter(f => f.id !== fileId));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attached Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {files.length > 0 ? (
              <div className="border rounded-md divide-y">
                {files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{file.originalName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatBytes(file.sizeBytes)} • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => setPreviewFile(file)} title="Preview">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" asChild title="Download">
                        <a href={`/api/files/${file.id}/download`} download>
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(file.id)} title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8 border rounded-md bg-muted/20">
                No files attached yet.
              </p>
            )}
            
            <div className="pt-4 border-t mt-6">
              <h4 className="font-medium mb-4">Upload New Files</h4>
              <FileUploader 
                module={moduleName} 
                entityType={entityType} 
                entityId={entityId} 
                multiple 
                onUploadComplete={handleUploadComplete} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {previewFile && (
        <Card className="fixed inset-4 md:inset-10 z-50 overflow-hidden flex flex-col shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
            <CardTitle>{previewFile.originalName}</CardTitle>
            <Button variant="ghost" onClick={() => setPreviewFile(null)}>Close</Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-auto bg-black/5">
            <FilePreview 
              fileId={previewFile.id} 
              mimeType={previewFile.mimeType} 
              originalName={previewFile.originalName} 
              className="h-full"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
