"use client";

import { ReactNode } from "react";
import { LampContainer } from "@/components/ui/lamp";

interface LampProps {
  children?: ReactNode;
}

export function Lamp({ children }: LampProps) {
  return (
    <LampContainer className="min-h-[calc(100vh-2rem)] overflow-visible">
      <div className="w-full max-w-5xl z-50 relative">{children}</div>
    </LampContainer>
  );
}
