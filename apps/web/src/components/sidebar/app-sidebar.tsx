"use client";

import React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  Laptop, // Office
  Forklift, // Transport
  Atom, // Lab
  Lock,
  Map,
  PieChart,
  Settings2,
  ClipboardCheck,
  FlaskConical,
  Box,
  Boxes,
  ScanBarcode,
  DatabaseZapIcon,
  GraduationCap,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { NavMain, SidebarItemAction } from "@/components/sidebar/nav-main";
import { NavProjects } from "@/components/sidebar/nav-projects";
import { NavUser } from "@/components/sidebar/nav-user";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { UserProfileData } from "@/types/user";

// This is sample data.
const data = {
  teams: [
    {
      name: "Office",
      logo: Laptop,
    },
    {
      name: "Lab",
      logo: Atom,
    },
    {
      name: "Transport",
      logo: Forklift,
    },
    {
      name: "Admin",
      logo: Lock,
    },
  ],
  navMain: [
    {
      title: "Orders",
      url: "/orders",
      icon: ClipboardCheck,
      isActive: true,
      items: [
        {
          title: "Place Order",
          action: "place_order" as const,
        },
        {
          title: "Log Details",
          action: "log_details" as const,
        },
        {
          title: "Print Labels",
          action: "print_labels" as const,
        },
      ],
    },
    {
      title: "Production",
      url: "/production",
      icon: FlaskConical,
      items: [
        {
          title: "Schedule Distillation",
          url: "#",
        },
        {
          title: "Transport Stock",
          url: "#",
        },
        {
          title: "Manage Production",
          url: "#",
        },
      ],
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: Boxes,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Documents",
      url: "/docs",
      icon: BookOpen,
      items: [
        {
          title: "Guides & SOPs",
          url: "/docs",
        },
        {
          title: "Barcode Labels",
          url: "/docs/barcode-labels",
        },
        {
          title: "Production Records",
          url: "/docs/production",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Initial Stock Count",
      url: "#",
      icon: ScanBarcode,
    },
    {
      name: "Business Data Review",
      url: "#",
      icon: DatabaseZapIcon,
    },
    {
      name: "Training",
      url: "#",
      icon: GraduationCap,
    },
    {
      name: "Database",
      url: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}`
        : "https://supabase.com/dashboard/project/ppnulxweiiczciuxcypn",
      icon: DatabaseZapIcon,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  profileData: UserProfileData;
}

export function AppSidebar({ profileData, ...props }: AppSidebarProps) {
  // const { user } = useAuth(); // Remove or comment out if not needed directly

  // Create userProfile directly from props
  const userProfile = {
    username: profileData.username ?? "User", // Provide default
    email: profileData.email, // Already string | null
    avatar_url: profileData.avatar_url ?? "/avatars/default.jpg", // Provide default
  };

  // Remove old NavUserProfile type assertion if present
  // type NavUserProfile = { ... };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        {/* Ensure NavUser expects username, email, avatar_url */}
        <NavUser userProfile={userProfile} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
