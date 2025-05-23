"use client";

import React, { useState, useRef, ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import {
  FileTextIcon,
  BookOpenIcon,
  PackageIcon,
  WorkflowIcon,
  PlusCircleIcon,
  ArrowRightIcon,
  GithubIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Types
interface BentoGridProps {
  className?: string;
  totalDrums: number;
  itemsBelowThreshold: number;
  mostCommonMaterial?: {
    name: string;
    count: number;
  };
}

interface BentoCardProps {
  name: string;
  className?: string;
  background?: ReactNode;
  icon: ReactNode;
  description: string;
  href: string;
  cta: string;
  flippable?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

interface ChangelogEntryProps {
  version: string;
  date: string;
  title: string;
  description: string;
  items?: string[];
}

// 3D Tilt Card Component
const Tilt3DCard: React.FC<BentoCardProps> = ({
  name,
  className,
  background,
  icon,
  description,
  href,
  cta,
  flippable = false,
  disabled = false,
  children,
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });
  const rotateX = useTransform(mouseY, [-100, 100], [10, -10]);
  const rotateY = useTransform(mouseX, [-100, 100], [-10, 10]);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current || disabled) return;
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

  function handleClick() {
    if (flippable && !disabled) {
      setIsFlipped(!isFlipped);
    }
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      style={{
        rotateX: disabled ? 0 : rotateX,
        rotateY: disabled ? 0 : rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-xl",
        "bg-card border border-border shadow-lg dark:shadow-primary/20",
        "transform-gpu min-h-[280px] sm:min-h-[300px] md:min-h-[320px]",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        className
      )}
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
          <div>{background}</div>
          <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-2">
            <div className="h-8 w-8 origin-left transform-gpu text-primary transition-all duration-300 ease-in-out group-hover:scale-125">
              {icon}
            </div>
            <h3 className="text-xl font-semibold text-card-foreground dark:text-slate-100 mt-2">
              {name}
            </h3>
            <p className="max-w-lg text-muted-foreground dark:text-slate-300 text-sm hidden sm:block">
              {description}
            </p>
            {children}
          </div>

          <div
            className={cn(
              "pointer-events-none absolute bottom-0 flex w-full translate-y-4 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
              disabled && "!opacity-0"
            )}
          >
            <Button
              variant="ghost"
              asChild
              size="sm"
              className="pointer-events-auto text-primary hover:text-primary/90 dark:text-slate-200 dark:hover:text-slate-50"
              disabled={disabled}
            >
              <Link href={href}>
                {cta}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div
            className={cn(
              "pointer-events-none absolute inset-0 transform-gpu transition-all duration-300",
              !disabled &&
                "group-hover:bg-black/[.03] dark:group-hover:bg-primary/[.06]"
            )}
          />
        </motion.div>

        {/* Back of card (only shown when flippable) */}
        {flippable && (
          <motion.div
            style={{
              backfaceVisibility: "hidden",
              rotateY: 180,
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
            className={`absolute w-full h-full p-6 flex flex-col justify-between bg-card dark:bg-slate-800 ${isFlipped ? "opacity-100" : "opacity-0"}`}
          >
            <div>
              <h3 className="text-xl font-semibold text-card-foreground dark:text-slate-100 mb-4">
                More about {name}
              </h3>
              <p className="text-muted-foreground dark:text-slate-300 hidden sm:block">
                Additional details about this feature can be found by clicking
                below.
              </p>
            </div>
            <Button
              variant="outline"
              asChild
              className="mt-4 self-start border-primary/50 text-primary hover:text-primary/90 hover:bg-primary/5 dark:border-slate-700 dark:text-slate-200 dark:hover:text-slate-50 dark:hover:bg-slate-700"
            >
              <Link href={href}>
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Changelog Component
const Changelog = ({ entries }: { entries: ChangelogEntryProps[] }) => {
  return (
    <div className="w-full bg-card/50 p-6 rounded-xl border border-border">
      <h2 className="text-2xl font-bold mb-4">Release Notes</h2>
      <div className="space-y-8">
        {entries.map((entry, index) => (
          <div key={index} className="relative flex flex-col gap-4">
            {index > 0 && <Separator className="my-4" />}
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  index === 0 && "text-primary bg-green-200 dark:bg-green-700"
                )}
              >
                {entry.version}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground">
                {entry.date}
              </span>
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-foreground/90">
                {entry.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {entry.description}
              </p>
              {entry.items && entry.items.length > 0 && (
                <ul className="mt-4 ml-4 space-y-1.5 text-sm text-muted-foreground">
                  {entry.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="list-disc"
                      dangerouslySetInnerHTML={{
                        __html: item,
                      }}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Decorative Lines Component
const DecorativeLines = () => {
  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <motion.div
        className="h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent cursor-default"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        whileHover={{
          scale: 1.05,
          backgroundColor: "var(--primary)",
          transition: { duration: 0.3 },
        }}
      />
      <motion.div
        className="h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent col-span-2 cursor-default"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        whileHover={{
          scale: 1.05,
          backgroundColor: "var(--primary)",
          transition: { duration: 0.3 },
        }}
      />
      <motion.div
        className="h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent cursor-default"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        whileHover={{
          scale: 1.05,
          backgroundColor: "var(--primary)",
          transition: { duration: 0.3 },
        }}
      />
    </div>
  );
};

// Main Enhanced Bento Grid Component
export function EnhancedBentoGrid({
  className,
  totalDrums,
  itemsBelowThreshold,
  mostCommonMaterial = { name: "Material XYZ", count: 0 },
}: BentoGridProps) {
  const changelogEntries = [
    {
      version: "v1.2.0",
      date: "Fri 24 May",
      title: "Enhanced Production Workflow & QRD Stability",
      description:
        "Major improvements to production job creation, status updates, and the foundational QRD flow. Includes critical bug fixes for UI stability and database permissions.",
      items: [
        "📋 Established functional QRD data flow (next step: reuse label generation code to create repro labels).",
        "🛡️ Corrected database permissions for updating production job statuses using a stored procedure.",
        "🔄 Refined data types (`ProductionJobViewData`) for better consistency.",
        "🎨 Improved UI for job status display across production schedule views.",
        "⚗️ Digital Setup Configuration - Replace manual parameter recording with intelligent forms that capture operator details, initial conditions, and equipment settings with validation.",
        "📊 Real-time Process Monitoring - Transform paper-based temperature and pressure logging into automated digital readings with timestamp accuracy and trend analysis.",
        "🧪 Fraction Collection Tracking - Eliminate handwritten fraction logs with structured digital capture of collection times, volumes, and quality observations for complete traceability.",
        "🔑 Finalise QRD with QC signature and Supervisor approval to complete the production job and save into database.",
      ],
    },
    {
      version: "v1.1.6",
      date: "Wed 21 May",
      title: "Production Schedule - Full System Integration",
      description:
        "Boost your efficency and ensure best data recording practices with a fully integrated production scheduling system.",
      items: [
        "📝 Create and edit draft production schedules before sending them to workers' devices",
        "🔒 Lock in finalized schedules and instantly distribute them to mobile barcode scanners",
        "📊 View live stock data while scheduling - see exact batch quantities at a glance",
        "📦 Access detailed batch information to make smarter production decisions",
        "✏️ Edit inventory details directly in the table view without admin assistance",
        "🔗 Easily manage material-supplier relationships with <a href='/inventory' style='color: var(--primary); text-decoration: underline;'>flexible editing tools</a>",
      ],
    },
    {
      version: "v1.1.5",
      date: "Tue 20 May",
      title: "Operational Workflow Revolution & Interactive Scan Log",
      description:
        "Game-changing improvements that transform how your team works",
      items: [
        "💪 Production scheduling end-to-end workflow saves hours of employee time weekly",
        "🔍 Ultra-responsive scan log sidebar with powerful search and filtering",
        "💬 Real-time team communication system for instant task updates",
        "🔄 Seamless cross-platform sync between web and mobile applications",
        "📊 Advanced material tracking with predictive inventory insights",
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Add the decorative lines */}
      <DecorativeLines />

      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8"
        style={{ perspective: "1200px" }}
      >
        {/* Release Notes Card */}
        <Tilt3DCard
          icon={<FileTextIcon className="h-8 w-8 text-primary" />}
          name="Release Notes"
          description="Latest updates and new features."
          href="#changelog"
          cta="View all updates"
          className="md:col-span-2 md:min-h-[340px]"
          flippable={true}
        >
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs border-primary/30 text-primary dark:text-slate-300 dark:border-slate-600"
              >
                v1.1.6
              </Badge>
              <span className="text-xs font-medium text-muted-foreground dark:text-slate-400">
                Wednesday 21 May
              </span>
            </div>
            <p className="font-medium text-card-foreground dark:text-slate-200">
              <strong className="text-primary dark:text-cyan-400">
                Production Scheduling:
              </strong>{" "}
              <span className="hidden sm:inline">
                Now available! Game-changing workflow that saves hours each
                week.
              </span>
              <span className="inline sm:hidden">Now available!</span>
            </p>
            <p className="font-medium text-card-foreground dark:text-slate-200">
              <strong className="text-primary dark:text-cyan-400">
                Scan Log Sidebar:
              </strong>{" "}
              <span className="hidden sm:inline">
                Powerful interactive history with real-time team communication.
              </span>
              <span className="inline sm:hidden">
                Powerful interactive history.
              </span>
            </p>
            <a
              href="https://github.com/CThomson2/rathburn-monorepo/"
              className="pointer-events-auto relative z-20 text-primary dark:text-cyan-400 rounded-lg border border-primary/30 dark:border-slate-600 px-2 py-1 h-8 flex items-center group w-fit hover:bg-slate-300 hover:dark:bg-slate-800 transition-all ease-in-out duration-300"
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubIcon className="h-4 w-4 mr-2" />
              <strong className="group-hover:text-black dark:group-hover:text-white">
                Github
              </strong>
              <span className="opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-xs group-hover:text-slate-700 dark:group-hover:text-slate-100 ml-2 text-xs text-muted-foreground dark:text-slate-400 transition-all ease-in-out duration-300">
                | CThomson2/rathburn
              </span>
            </a>
          </div>
        </Tilt3DCard>

        {/* User Guides Card - Dimmed */}
        <Tilt3DCard
          icon={
            <BookOpenIcon className="h-8 w-8 text-primary/70 dark:text-primary/50" />
          }
          name="User Guides"
          description="Learn how to use the platform."
          href="/guides"
          cta="Explore Guides"
          className="md:col-span-1"
          disabled={false}
        >
          <div className="mt-4 text-sm text-muted-foreground dark:text-slate-400">
            <p>Comprehensive documentation coming soon.</p>
          </div>
        </Tilt3DCard>

        {/* Inventory Dashboard Card */}
        <Tilt3DCard
          icon={<PackageIcon className="h-8 w-8 text-primary" />}
          name="Inventory Snapshot"
          description="Quick view of your inventory status."
          href="/inventory"
          cta="Go to Inventory"
          className="md:col-span-1 md:min-h-[380px]"
          flippable={true}
        >
          <div className="space-y-3 mt-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground dark:text-slate-300">
                Total Drums
              </p>
              <p className="text-2xl font-bold text-card-foreground dark:text-slate-100">
                {totalDrums}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground dark:text-slate-300">
                Materials Below Threshold
              </p>
              <p className="text-2xl font-bold text-card-foreground dark:text-slate-100">
                {itemsBelowThreshold}
              </p>
              {itemsBelowThreshold > 0 && (
                <p className="text-xs text-destructive dark:text-red-400 mt-1">
                  Action needed: {itemsBelowThreshold} materials below safe
                  stock levels
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground dark:text-slate-300">
                Most Common Material
              </p>
              <p className="text-md font-semibold text-card-foreground dark:text-slate-100">
                {mostCommonMaterial.name}
              </p>
              {mostCommonMaterial.count > 0 && (
                <p className="text-xs text-muted-foreground dark:text-slate-400">
                  {mostCommonMaterial.count} drums in stock
                </p>
              )}
            </div>
            <div className="mt-2 hidden sm:block">
              <Button variant="outline" size="sm" asChild>
                <Link href="/inventory" className="flex items-center">
                  Go to Inventory <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Tilt3DCard>

        {/* Production Scheduling Card */}
        <Tilt3DCard
          icon={<WorkflowIcon className="h-8 w-8 text-primary" />}
          name="Production Scheduling"
          description="Manage your production workflow efficiently."
          href="/production"
          cta="View Production"
          className="md:col-span-2 md:min-h-[340px]"
          flippable={true}
        >
          <div className="mt-4 text-sm">
            <p className="text-muted-foreground dark:text-slate-300 hidden sm:block">
              Our latest feature enables end-to-end production scheduling,
              syncing seamlessly between web and mobile applications.
            </p>
            <div className="mt-2">
              <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600">
                New
              </Badge>
              <Badge
                variant="outline"
                className="border-primary/30 text-primary dark:text-slate-300 dark:border-slate-600"
              >
                Time-saving
              </Badge>
            </div>
          </div>
        </Tilt3DCard>
      </div>

      {/* Full Changelog Section */}
      <div id="changelog" className="mt-8">
        <Changelog entries={changelogEntries} />
      </div>
    </div>
  );
}
