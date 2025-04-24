import { useNavigate } from "react-router-dom";
import { Scan, LucideIcon } from "lucide-react";
import { BottomTabBar } from "./bottom-tab-bar";
import { FloatingActionButton } from "./floating-action-button";

interface TabItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface CombinedNavigationProps {
  tabs: TabItem[];
  onScan?: () => void;
}

/**
 * Combined navigation component that integrates a bottom tab bar with a floating action button
 *
 * Provides a modern mobile navigation experience with:
 * - A bottom tab bar for main navigation
 * - A centered floating action button for the primary action (scan)
 */
export function CombinedNavigation({ tabs, onScan }: CombinedNavigationProps) {
  const navigate = useNavigate();

  const handleScan = () => {
    if (onScan) {
      onScan();
    } else {
      navigate("/scan");
    }
  };

  return (
    <>
      {/* Bottom tab bar with space for FAB */}
      <BottomTabBar tabs={tabs} showFloatingButton={true} />

      {/* Centered floating action button */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <FloatingActionButton
          icon={Scan}
          onClick={handleScan}
          color="primary"
          size="md"
          label="Scan"
        />
      </div>
    </>
  );
}
