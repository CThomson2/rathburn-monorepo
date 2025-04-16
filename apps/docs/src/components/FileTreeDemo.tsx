import React from "react";
import { File, Folder, Tree, type TreeViewElement } from "./ui/file-tree";

// This structure is derived from the actual markdown files found in the monorepo
const DOCUMENTATION_STRUCTURE: TreeViewElement[] = [
  {
    id: "1",
    name: "Project Documentation",
    isSelectable: true,
    children: [
      {
        id: "2",
        name: "User Guides",
        isSelectable: true,
        children: [
          {
            id: "21",
            name: "Getting Started.md",
            isSelectable: true,
          },
          {
            id: "22",
            name: "Installation.md",
            isSelectable: true,
          },
        ],
      },
      {
        id: "3",
        name: "Development",
        isSelectable: true,
        children: [
          {
            id: "31",
            name: "API Documentation",
            isSelectable: true,
            children: [
              {
                id: "311",
                name: "Barcodes API.md",
                isSelectable: true,
              },
            ],
          },
          {
            id: "32",
            name: "Components",
            isSelectable: true,
            children: [
              {
                id: "321",
                name: "BarcodeScanner.md",
                isSelectable: true,
              },
            ],
          },
          {
            id: "33",
            name: "Hooks",
            isSelectable: true,
            children: [
              {
                id: "331",
                name: "AUTH_EXAMPLE.md",
                isSelectable: true,
              },
              {
                id: "332",
                name: "README.md",
                isSelectable: true,
              },
            ],
          },
        ],
      },
      {
        id: "4",
        name: "Architecture",
        isSelectable: true,
        children: [
          {
            id: "41",
            name: "Project Structure.md",
            isSelectable: true,
          },
          {
            id: "42",
            name: "Data Explorer.md",
            isSelectable: true,
          },
        ],
      },
      {
        id: "5",
        name: "Deployment",
        isSelectable: true,
        children: [
          {
            id: "51",
            name: "deployment.md",
            isSelectable: true,
          },
          {
            id: "52",
            name: "NGINX Configuration",
            isSelectable: true,
            children: [
              {
                id: "521",
                name: "nginx.conf.md",
                isSelectable: true,
              },
              {
                id: "522",
                name: "rathburn.conf.md",
                isSelectable: true,
              },
            ],
          },
        ],
      },
    ],
  },
];

export function FileTreeDemo() {
  return (
    <div className="relative flex h-[500px] w-full flex-col items-start justify-center overflow-hidden rounded-lg border bg-background">
      <div className="w-full px-4 py-2 border-b font-medium">
        Rathburn Documentation
      </div>
      <Tree
        className="p-2 overflow-hidden rounded-md bg-background w-full h-full"
        initialSelectedId="21"
        initialExpandedItems={["1", "2", "3", "4", "5", "31", "32", "33", "52"]}
        elements={DOCUMENTATION_STRUCTURE}
      >
        <Folder element="Project Documentation" value="1">
          <Folder value="2" element="User Guides">
            <File value="21">
              <p>Getting Started.md</p>
            </File>
            <File value="22">
              <p>Installation.md</p>
            </File>
          </Folder>
          <Folder value="3" element="Development">
            <Folder value="31" element="API Documentation">
              <File value="311">
                <p>Barcodes API.md</p>
              </File>
            </Folder>
            <Folder value="32" element="Components">
              <File value="321">
                <p>BarcodeScanner.md</p>
              </File>
            </Folder>
            <Folder value="33" element="Hooks">
              <File value="331">
                <p>AUTH_EXAMPLE.md</p>
              </File>
              <File value="332">
                <p>README.md</p>
              </File>
            </Folder>
          </Folder>
          <Folder value="4" element="Architecture">
            <File value="41">
              <p>Project Structure.md</p>
            </File>
            <File value="42">
              <p>Data Explorer.md</p>
            </File>
          </Folder>
          <Folder value="5" element="Deployment">
            <File value="51">
              <p>deployment.md</p>
            </File>
            <Folder value="52" element="NGINX Configuration">
              <File value="521">
                <p>nginx.conf.md</p>
              </File>
              <File value="522">
                <p>rathburn.conf.md</p>
              </File>
            </Folder>
          </Folder>
        </Folder>
      </Tree>
    </div>
  );
}
