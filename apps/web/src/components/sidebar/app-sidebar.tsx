"use client";

import React, { useState, useEffect } from "react";
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
  Users,
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
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@rathburn/types";

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
          action: "schedule_distillation" as const,
        },
        {
          title: "Transport Stock",
          action: "transport_stock" as const,
        },
        {
          title: "Manage Production",
          action: "manage_production" as const,
        },
      ],
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: Boxes,
      items: [
        {
          title: "Drums",
          url: "/drums",
        },
        {
          title: "Batches",
          url: "/batches",
        },
        {
          title: "Reprocess",
          url: "/reprocess",
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
      title: "People",
      url: "/people",
      icon: Users,
      items: [
        {
          title: "Employees",
          url: "/people/employees",
        },
        {
          title: "Communications",
          url: "/people/comms",
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
    // {
    //   name: "Initial Stock Count",
    //   url: "#",
    //   icon: ScanBarcode,
    // },
    // {
    //   name: "Business Data Review",
    //   url: "#",
    //   icon: DatabaseZapIcon,
    // },
    // {
    //   name: "Training",
    //   url: "#",
    //   icon: GraduationCap,
    // },
    {
      name: "Database",
      url: "https://supabase.com/dashboard/project/ppnulxweiiczciuxcypn",
      icon: DatabaseZapIcon,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const { user, loading: authLoading } = useAuth();
  type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (user && !authLoading) {
        setLoadingProfile(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single<ProfileRow>();

        if (error) {
          console.error("Error fetching profile in AppSidebar:", error);
          setProfile(null);
        } else {
          setProfile(data);
        }
        setLoadingProfile(false);
      } else if (!authLoading) {
        setProfile(null);
        setLoadingProfile(false);
      }
    }

    fetchProfile();
  }, [user, authLoading]);

  const navUserProfile = {
    username: profile?.username ?? (user?.email?.split("@")[0] || "User"),
    email: profile?.email ?? user?.email ?? null,
    avatar_url: profile?.avatar_url ?? "/avatars/default.jpg",
  };

  if (authLoading || loadingProfile) {
    // Render a loading state or skeleton for the user section
    // For simplicity, we can just render the structure with defaults for now
    // Or return a skeleton sidebar
  }

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
        <NavUser userProfile={navUserProfile} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
