"use client";

import { useState } from "react";
import { ChevronRight, Folder, File } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Node = {
  name: string;
  nodes?: Node[];
  type?: "file" | "folder";
  path?: string;
};

interface FilesystemItemProps {
  node: Node;
  animated?: boolean;
  onSelect?: (path: string) => void;
}

export function FilesystemItem({
  node,
  animated = false,
  onSelect,
}: FilesystemItemProps) {
  let [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (node.type === "file" && node.path && onSelect) {
      onSelect(node.path);
    } else if (node.nodes?.length) {
      setIsOpen(!isOpen);
    }
  };

  const ChevronIcon = () =>
    animated ? (
      <motion.span
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="flex"
      >
        <ChevronRight className="size-4 text-gray-500" />
      </motion.span>
    ) : (
      <ChevronRight
        className={`size-4 text-gray-500 ${isOpen ? "rotate-90" : ""}`}
      />
    );

  const ChildrenList = () => {
    const children = node.nodes?.map((node) => (
      <FilesystemItem
        node={node}
        key={node.name}
        animated={animated}
        onSelect={onSelect}
      />
    ));

    if (animated) {
      return (
        <AnimatePresence>
          {isOpen && (
            <motion.ul
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="pl-6 overflow-hidden flex flex-col justify-end"
            >
              {children}
            </motion.ul>
          )}
        </AnimatePresence>
      );
    }

    return isOpen && <ul className="pl-6">{children}</ul>;
  };

  return (
    <li key={node.name}>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-1.5 py-1 text-left hover:bg-gray-100 rounded px-1 ${
          node.type === "file" ? "text-gray-700" : "text-gray-900"
        }`}
        aria-label={`${node.type === "file" ? "Select" : "Toggle"} ${node.name}`}
      >
        {node.nodes && node.nodes.length > 0 && (
          <span className="p-1 -m-1">
            <ChevronIcon />
          </span>
        )}

        {node.type === "folder" ? (
          <Folder
            className={`size-6 text-sky-500 fill-sky-500 ${
              !node.nodes || node.nodes.length === 0 ? "ml-[22px]" : ""
            }`}
          />
        ) : (
          <File className="ml-[22px] size-6 text-gray-500" />
        )}
        {node.name}
      </button>

      <ChildrenList />
    </li>
  );
}
