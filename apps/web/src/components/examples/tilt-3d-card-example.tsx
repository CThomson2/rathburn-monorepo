"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowRightIcon, StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function Tilt3DCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SimpleTilt3DCard
        title="Basic 3D Card"
        description="This is a simple example of the 3D tilt effect. Hover over this card to see the effect in action."
        icon={<StarIcon className="h-6 w-6 text-yellow-500" />}
      />
      <FlippableTilt3DCard
        title="Flippable Card"
        description="This card can be flipped when clicked. Try clicking on it to see the back side."
        icon={<StarIcon className="h-6 w-6 text-green-500" />}
      />
    </div>
  );
}

interface SimpleTilt3DCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function SimpleTilt3DCard({ title, description, icon }: SimpleTilt3DCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });
  const rotateX = useTransform(mouseY, [-100, 100], [10, -10]);
  const rotateY = useTransform(mouseX, [-100, 100], [-10, 10]);
  const cardRef = useRef<HTMLDivElement>(null);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct * 100);
    y.set(yPct * 100);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-xl overflow-hidden bg-card border border-border shadow-lg min-h-[260px] transform-gpu cursor-pointer"
    >
      <div className="p-6 flex flex-col h-full">
        <div className="mb-4 flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 transform-gpu transition-transform duration-300 group-hover:scale-110">
            {icon}
          </div>
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        
        <p className="text-muted-foreground text-sm flex-grow">{description}</p>
        
        <div className="mt-4 flex justify-between items-center">
          <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground hover:bg-primary/20">
            Example
          </Badge>
          
          <Button variant="ghost" size="sm" className="text-primary">
            Learn More <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className={cn(
        "pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] dark:group-hover:bg-primary/[.06]"
      )} />
    </motion.div>
  );
}

function FlippableTilt3DCard({ title, description, icon }: SimpleTilt3DCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });
  const rotateX = useTransform(mouseY, [-100, 100], [10, -10]);
  const rotateY = useTransform(mouseX, [-100, 100], [-10, 10]);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current || isFlipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct * 100);
    y.set(yPct * 100);
  }

  function onMouseLeave() {
    if (!isFlipped) {
      x.set(0);
      y.set(0);
    }
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={() => setIsFlipped(!isFlipped)}
      style={{
        rotateX: isFlipped ? 0 : rotateX,
        rotateY: isFlipped ? 0 : rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: isFlipped ? 1 : 1.05 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-xl overflow-hidden bg-card border border-border shadow-lg min-h-[260px] transform-gpu cursor-pointer"
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: "preserve-3d", width: "100%", height: "100%" }}
        className="w-full h-full"
      >
        {/* Front of card */}
        <motion.div
          style={{ backfaceVisibility: "hidden" }}
          className={`absolute w-full h-full ${isFlipped ? "opacity-0" : "opacity-100"}`}
        >
          <div className="p-6 flex flex-col h-full">
            <div className="mb-4 flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 transform-gpu transition-transform duration-300 group-hover:scale-110">
                {icon}
              </div>
              <h3 className="text-xl font-semibold">{title}</h3>
            </div>
            
            <p className="text-muted-foreground text-sm flex-grow">{description}</p>
            
            <div className="mt-4 flex justify-between items-center">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600">
                Flippable
              </Badge>
              
              <p className="text-xs text-muted-foreground">Click to flip card</p>
            </div>
          </div>
        </motion.div>

        {/* Back of card */}
        <motion.div
          style={{
            backfaceVisibility: "hidden",
            rotateY: 180,
            position: "absolute",
            width: "100%",
            height: "100%"
          }}
          className={`absolute w-full h-full p-6 flex flex-col justify-between bg-card dark:bg-slate-800 ${isFlipped ? "opacity-100" : "opacity-0"}`}
        >
          <div>
            <h3 className="text-xl font-semibold text-card-foreground dark:text-slate-100 mb-4">
              Back of Card
            </h3>
            <p className="text-muted-foreground dark:text-slate-300">
              This is the back side of the flippable card. Click again to return to the front.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-4 self-start border-primary/50 text-primary hover:text-primary/90 hover:bg-primary/5 dark:border-slate-700 dark:text-slate-200 dark:hover:text-slate-50 dark:hover:bg-slate-700"
            onClick={(e) => {
              e.stopPropagation(); // Prevent the card click handler from being called
              setIsFlipped(false);
            }}
          >
            Return to Front
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}