'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import mammoth from 'mammoth';

interface FilePreviewProps {
  file_id: string;
  mime_type: string;
  original_name: string;
  className?: string;
}

export function FilePreview({ file_id, mime_type, original_name, className = '' }: FilePreviewProps) {
  const [loading, setLoading] = useState(true);
  const downloadUrl = `/api/files/${file_id}/download`;

  const renderContent = () => {
    if (mime_type.startsWith('image/')) {
      return (
        <img 
          src={downloadUrl} 
          alt={original_name} 
          className="max-w-full max-h-full object-contain"
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      );
    }

    if (mime_type === 'application/pdf') {
      return (
        <div className="w-full h-full flex flex-col items-center bg-white overflow-hidden">
          <iframe 
            src={`${downloadUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
          />
        </div>
      );
    }

    if (mime_type.startsWith('video/')) {
      return (
        <video 
          controls 
          className="max-w-full max-h-full"
          onLoadedData={() => setLoading(false)}
        >
          <source src={downloadUrl} type={mime_type} />
        </video>
      );
    }



    if (mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mime_type === 'application/msword') {
      const docxPreviewUrl = `${downloadUrl}?preview=true#toolbar=0&navpanes=0&scrollbar=0`;
      return (
        <div className="w-full h-full p-2 md:p-4 bg-slate-100 flex flex-col items-center overflow-hidden">
          <iframe 
            src={docxPreviewUrl} 
            className="w-full max-w-5xl bg-white shadow-xl rounded-sm border border-slate-200 flex-1 mb-8"
            onLoad={() => setLoading(false)}
          />
        </div>
      );
    }


    // Fallback for unsupported preview types (DOCX, ZIP, etc)
    setLoading(false);
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">{original_name}</h3>
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
    <div className={`relative w-full h-full rounded-lg overflow-hidden flex flex-col bg-slate-100 ${className}`}>
      {loading && mime_type !== 'application/pdf' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      {renderContent()}
    </div>
  );
}
