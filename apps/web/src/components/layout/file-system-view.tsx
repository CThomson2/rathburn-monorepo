import { FilesystemItem } from "@/components/ui/filesystem-item";

interface FileSystemViewProps {
  nodes: Node[];
  onSelect?: (path: string) => void;
}

interface Node {
  name: string;
  nodes?: Node[];
  type?: "file" | "folder";
  path?: string;
}

export function FileSystemView({ nodes, onSelect }: FileSystemViewProps) {
  return (
    <div className="p-4 h-[600px] overflow-y-auto border rounded-lg">
      <ul>
        {nodes.map((node) => (
          <FilesystemItem
            node={node}
            key={node.name}
            animated
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
}
