import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface TopNavbarProps {
  navLinks: NavItem[];
}

const TopNavbar: React.FC<TopNavbarProps> = ({ navLinks }) => {
  const [time, setTime] = useState<string>("");
  const [activeNavItem, setActiveNavItem] = useState<string>(navLinks[0].name);

  useEffect(() => {
    // Update time every minute
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  return <NavBar items={navLinks} />;
};

export default TopNavbar;
