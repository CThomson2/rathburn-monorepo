"use client";

import React, { useState } from "react";
import { DocFile, fetchDocContent } from "@/lib/docs";
import DocFileTree from "./doc-file-tree";
import DocContent from "./doc-content";
import { cn } from "@/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/core/ui/tabs";
import { ScrollArea } from "@/components/core/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/core/ui/resizable";
import { Button } from "@/components/core/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SpecialFile {
  id: string;
  /**
   * DocsBrowser component provides an interface for browsing and viewing documentation files.
   *
   * Props:
   * - docsTree: Array of DocFile objects representing the hierarchical structure of documentation.
   * - specialFiles: Array of SpecialFile objects for quick access to featured documentation.
   *
   * State:
   * - selectedFileId: ID of the currently selected file.
   * - selectedFile: Object containing the title and content of the selected file.
   * - navCollapsed: Boolean to toggle navigation panel visibility.
   * - activeTab: Determines which tab is active, either "special" or "all".
   *
   * Functions:
   * - handleFileSelect: Asynchronously fetches and displays content of a selected file.
   * - handleSpecialFileSelect: Directly selects and displays content of a special file.
   * - toggleNav: Toggles the visibility of the navigation panel.
   *
   * UI Structure:
   * - ResizablePanelGroup: Container for resizable panels.
   * - Tabs: Controls the display of special and all documentation.
   * - Button: Toggles navigation visibility.
   * - DocContent: Displays the content of the selected file.
   */

  title: string;
  content: string;
}

interface DocsBrowserProps {
  docsTree: DocFile[];
  specialFiles: SpecialFile[];
}

export function DocsBrowser({ docsTree, specialFiles }: DocsBrowserProps) {
  const [selectedFileId, setSelectedFileId] = useState<string>(
    specialFiles[0]?.id || ""
  );
  const [selectedFile, setSelectedFile] = useState<{
    title: string;
    content: string;
  } | null>(
    specialFiles[0]
      ? {
          title: specialFiles[0].title,
          content: specialFiles[0].content,
        }
      : null
  );

  const [navCollapsed, setNavCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"special" | "all">("special");

  const handleFileSelect = async (file: DocFile) => {
    if (file.type === "file") {
      try {
        // Show loading state
        setSelectedFile({
          title: file.title,
          content: "Loading...",
        });
        setSelectedFileId(file.id);

        // Fetch content via API
        const content = await fetchDocContent(file.path);
        setSelectedFile({
          title: file.title,
          content,
        });
      } catch (error) {
        console.error("Error loading file:", error);
        setSelectedFile({
          title: file.title,
          content: "Error loading document content.",
        });
      }
    }
  };

  const handleSpecialFileSelect = (file: SpecialFile) => {
    setSelectedFile({
      title: file.title,
      content: file.content,
    });
    setSelectedFileId(file.id);
  };

  const toggleNav = () => {
    setNavCollapsed(!navCollapsed);
  };

  return (
    <div className="flex h-[calc(100vh-200px)] border rounded-lg shadow-sm bg-card">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={30}
          className={cn(
            "transition-all duration-300",
            navCollapsed ? "!w-0 !min-w-0" : ""
          )}
        >
          <div
            className={cn(
              "h-full transition-all duration-300 overflow-hidden",
              navCollapsed ? "opacity-0 w-0" : "opacity-100"
            )}
          >
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "special" | "all")}
            >
              <div className="p-2 border-b">
                <TabsList className="w-full">
                  <TabsTrigger value="special" className="flex-1">
                    Featured Docs
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex-1">
                    All Documentation
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="h-[calc(100%-50px)] p-2">
                <TabsContent value="special" className="m-0">
                  <div className="space-y-1">
                    {specialFiles.map((file) => (
                      <Button
                        key={file.id}
                        variant={
                          selectedFileId === file.id ? "secondary" : "ghost"
                        }
                        className="w-full justify-start font-normal"
                        onClick={() => handleSpecialFileSelect(file)}
                      >
                        {file.title}
                      </Button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="all" className="m-0">
                  <DocFileTree
                    files={docsTree}
                    onSelectFile={handleFileSelect}
                    selectedFileId={selectedFileId}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </ResizablePanel>

        <Button
          variant="ghost"
          size="icon"
          className="absolute left-[calc(20%-4px)] top-1/2 z-10 h-8 w-8 rounded-full border bg-background p-0 shadow-md"
          onClick={toggleNav}
        >
          {navCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle Navigation</span>
        </Button>

        <ResizablePanel defaultSize={80}>
          <div className="h-full overflow-auto">
            {selectedFile ? (
              <DocContent
                title={selectedFile.title}
                content={selectedFile.content}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">
                  Select a document to view
                </p>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
