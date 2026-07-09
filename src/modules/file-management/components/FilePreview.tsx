'use client';

import React, { useState } from 'react';
import { Loader2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilePreviewProps {
  fileId: string;
  mimeType: string;
  originalName: string;
  className?: string;
}

export function FilePreview({ fileId, mimeType, originalName, className = '' }: FilePreviewProps) {
  const [loading, setLoading] = useState(true);
  const downloadUrl = `/api/files/${fileId}/download`;

  const renderContent = () => {
    if (mimeType.startsWith('image/')) {
      return (
        <img 
          src={downloadUrl} 
          alt={originalName} 
          className="max-w-full max-h-full object-contain"
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      );
    }

    if (mimeType === 'application/pdf') {
      return (
        <iframe 
          src={downloadUrl} 
          className="w-full h-[600px] border-0"
          onLoad={() => setLoading(false)}
        />
      );
    }

    if (mimeType.startsWith('video/')) {
      return (
        <video 
          controls 
          className="max-w-full max-h-full"
          onLoadedData={() => setLoading(false)}
        >
          <source src={downloadUrl} type={mimeType} />
        </video>
      );
    }

    // Fallback for unsupported preview types (DOCX, ZIP, etc)
    setLoading(false);
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">{originalName}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Preview is not available for this file type.
        </p>
        <Button asChild>
          <a href={downloadUrl} download>
            <Download className="w-4 h-4 mr-2" /> Download File
          </a>
        </Button>
      </div>
    );
  };

  return (
    <div className={`relative w-full rounded-lg overflow-hidden flex items-center justify-center bg-black/5 ${className}`}>
      {loading && mimeType !== 'application/pdf' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      {renderContent()}
    </div>
  );
}
