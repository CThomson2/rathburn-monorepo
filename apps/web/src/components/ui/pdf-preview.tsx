"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";
import { Button } from "./button";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFPreviewProps {
  url: string;
  onDownload?: () => void;
}

export function PDFPreview({ url, onDownload }: PDFPreviewProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setIsLoading(false);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative min-h-[600px] w-full flex items-center justify-center border rounded-lg bg-white">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={null}
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="max-h-[600px] w-auto"
          />
        </Document>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-500">
          Page {pageNumber} of {numPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => Math.min(numPages || p, p + 1))}
            disabled={pageNumber >= (numPages || 1)}
          >
            Next
          </Button>
        </div>
        {onDownload && (
          <Button onClick={onDownload} size="sm">
            Download PDF
          </Button>
        )}
      </div>
    </div>
  );
}
