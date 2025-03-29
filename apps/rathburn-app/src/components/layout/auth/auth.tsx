"use client";
import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import SupabaseLogo from "@/components/layout/supabase-logo";
import { cn } from "@/lib/utils";
import { FeatureSection } from "./feature-section";

const inventoryFeatures = [
  {
    icon: (
      <svg
        className="w-7 h-7 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
      </svg>
    ),
    text: "Data Analytics",
  },
  {
    icon: (
      <svg
        className="w-7 h-7 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
        <path
          fillRule="evenodd"
          d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    text: "Stock Management",
  },
  {
    icon: (
      <svg
        className="w-7 h-7 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10z"
          clipRule="evenodd"
        />
      </svg>
    ),
    text: "Order Tracking",
  },
  {
    icon: (
      <svg
        className="w-7 h-7 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    text: "Real-time Updates",
  },
];

const productionFeatures = [
  {
    icon: (
      <svg
        className="w-7 h-7 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
          clipRule="evenodd"
        />
      </svg>
    ),
    text: "Production Scheduling",
  },
  {
    icon: (
      <svg
        className="w-7 h-7 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    text: "Distillation Monitoring",
  },
  {
    icon: (
      <svg
        className="w-7 h-7 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
          clipRule="evenodd"
        />
      </svg>
    ),
    text: "Process Analytics",
  },
  {
    icon: (
      <svg
        className="w-7 h-7 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    text: "Digital Collaboration",
  },
];

export function AuthLayoutContent({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex">
      {/* Main content section with gradient background */}
      <div className="hidden lg:flex lg:w-[80%] 2xl:w-[70%] relative">
        {/* Gradient background with responsive angle */}
        <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-blue-800 via-teal-600 to-green-800 transition-all duration-300 ease-in-out" />

        {/* Background overlay with blur and dots */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent)] backdrop-blur-[2px]" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-8 top-8 grid grid-cols-6 gap-2">
            {[...Array(36)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-white/20" />
            ))}
          </div>
          <div className="absolute right-8 bottom-8 grid grid-cols-6 gap-2">
            {[...Array(36)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-white/20" />
            ))}
          </div>
        </div>

        {/* Content sections */}
        <div className="relative w-full flex flex-col 2xl:flex-row items-center justify-center gap-12 2xl:gap-0 transition-all duration-300 ease-in-out">
          {/* Inventory section */}
          <div className="w-full px-12">
            <FeatureSection
              title="Inventory Management"
              features={inventoryFeatures}
              className="h-full"
              titleClassName="translate-y-0"
            />
          </div>

          {/* Production section */}
          <div className="w-full px-12">
            <FeatureSection
              title="Production Management"
              features={productionFeatures}
              className="h-full"
              titleClassName="2xl:translate-y-0"
            />
          </div>
        </div>
      </div>

      {/* Right section with form */}
      <div className="w-full lg:w-[20%] 2xl:w-[30%] min-w-[400px] bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
