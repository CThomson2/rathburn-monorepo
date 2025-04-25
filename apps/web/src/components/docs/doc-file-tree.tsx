"use client";

import { useState } from "react";
import { DocFile } from "@/lib/docs";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, File, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocFileTreeProps {
  files: DocFile[];
  onSelectFile: (file: DocFile) => void;
  selectedFileId: string;
  level?: number;
}

/**
 * Renders a tree structure of documentation files and directories.
 *
 * @param {Object} props - The properties for DocFileTree component.
 * @param {DocFile[]} props.files - Array of documentation files and directories.
 * @param {Function} props.onSelectFile - Callback function to handle file selection.
 * @param {string} props.selectedFileId - ID of the currently selected file.
 * @param {number} [props.level=0] - The indentation level for nested directories.
 *
 * The component displays directories as expandable folders and files
 * as selectable items. When a directory is clicked, it toggles its
 * expanded state to show or hide its children. When a file is clicked,
 * it calls the onSelectFile callback with the file object.
 */

export default function DocFileTree({
  files,
  onSelectFile,
  selectedFileId,
  level = 0,
}: DocFileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  return (
    <div className={cn("space-y-1", level === 0 ? "" : "pl-4")}>
      {files.map((file) => (
        <div key={file.id}>
          {file.type === "directory" ? (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start font-normal h-8"
                onClick={() => toggleFolder(file.id)}
              >
                <span className="flex items-center">
                  {expandedFolders[file.id] ? (
                    <ChevronDown className="mr-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="mr-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <Folder className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                  {file.title}
                </span>
              </Button>

              {expandedFolders[file.id] && file.children && (
                <DocFileTree
                  files={file.children}
                  onSelectFile={onSelectFile}
                  selectedFileId={selectedFileId}
                  level={level + 1}
                />
              )}
            </>
          ) : (
            <Button
              variant={selectedFileId === file.id ? "secondary" : "ghost"}
              className="w-full justify-start font-normal h-8"
              onClick={() => onSelectFile(file)}
            >
              <span className="flex items-center pl-6">
                <File className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                {file.title}
              </span>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
