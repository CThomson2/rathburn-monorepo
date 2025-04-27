"use client";

import * as React from "react";
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
} from "lucide-react";

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

// This is sample data.
const data = {
  user: {
    name: "conrad",
    email: "design@rathburn.co.uk",
    avatar: "/avatars/conrad/library-1.png",
  },
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
    {
      title: "Documentation",
      url: "/docs",
      icon: BookOpen,
      items: [
        {
          title: "Guides",
          url: "#",
        },
        {
          title: "Technical",
          url: "#",
        },
        {
          title: "FAQ",
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
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
