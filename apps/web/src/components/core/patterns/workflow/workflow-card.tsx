import { ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type WorkflowRole = "admin" | "operator" | "manager" | "all";

export interface WorkflowCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  role: WorkflowRole;
  roleIcon?: React.ReactNode;
  path: string;
  restricted?: boolean;
}

// Modern color palette with softer, more elegant tones
const roleColors = {
  admin: {
    bg: "bg-rose-50",
    border: "border-l-4 border-l-rose-500",
    text: "text-rose-700",
    hover: "group-hover:bg-rose-100",
    icon: "text-rose-500",
  },
  operator: {
    bg: "bg-sky-50",
    border: "border-l-4 border-l-sky-500",
    text: "text-sky-700",
    hover: "group-hover:bg-sky-100",
    icon: "text-sky-500",
  },
  manager: {
    bg: "bg-violet-50",
    border: "border-l-4 border-l-violet-500",
    text: "text-violet-700",
    hover: "group-hover:bg-violet-100",
    icon: "text-violet-500",
  },
  all: {
    bg: "bg-emerald-50",
    border: "border-l-4 border-l-emerald-500",
    text: "text-emerald-700",
    hover: "group-hover:bg-emerald-100",
    icon: "text-emerald-500",
  },
};

/**
 * A redesigned workflow card with a longer rectangular layout, improved hover effects,
 * and a more sophisticated color palette.
 *
 * @param {string} title - The title of the workflow.
 * @param {string} description - A brief description of the workflow.
 * @param {React.ReactNode} icon - An icon representing the workflow.
 * @param {WorkflowRole} role - The role associated with the workflow (e.g., admin, operator).
 * @param {React.ReactNode} [roleIcon] - An optional icon representing the role.
 * @param {string} path - The URL path to navigate to when the card is clicked.
 * @param {boolean} [restricted=false] - Flag indicating if the workflow is restricted.
 */
export function WorkflowCard({
  title,
  description,
  icon,
  role,
  roleIcon,
  path,
  restricted = false,
}: WorkflowCardProps) {
  const roleColor = roleColors[role];

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 group h-24",
        "flex flex-row items-stretch",
        roleColor.bg,
        roleColor.border,
        "hover:shadow-lg transform hover:-translate-y-1"
      )}
    >
      {/* Icon Section */}
      <div
        className={cn(
          "p-4 flex items-center justify-center w-24 transition-colors duration-300",
          roleColor.icon
        )}
      >
        {icon}
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-center py-3 pr-3 relative">
        <div className="flex justify-between items-center mb-1">
          <CardTitle className={cn("text-lg font-semibold", roleColor.text)}>
            {title}
          </CardTitle>

          {restricted && (
            <Badge variant="outline" className="font-normal text-xs opacity-80">
              <span className="mr-1">🔒</span> Restricted
            </Badge>
          )}
        </div>

        <CardDescription className="text-sm line-clamp-2">
          {description}
        </CardDescription>
      </div>

      {/* Right Section with Role Badge and Arrow */}
      <div
        className={cn(
          "w-12 flex flex-col items-center justify-between py-3 pr-3 transition-colors duration-300",
          roleColor.hover
        )}
      >
        <Badge
          variant="outline"
          className={cn(
            "font-normal text-xs px-1 py-0.5 flex items-center gap-1",
            "border border-transparent",
            roleColor.text
          )}
        >
          {roleIcon && <span className="scale-75">{roleIcon}</span>}
          {!roleIcon && (
            <span className="text-[10px]">{role.charAt(0).toUpperCase()}</span>
          )}
        </Badge>

        <a
          href={path}
          className={cn(
            "rounded-full p-1.5 transition-all duration-300",
            "opacity-60 group-hover:opacity-100",
            "group-hover:translate-x-1"
          )}
        >
          <ArrowRight className={cn("h-4 w-4", roleColor.text)} />
        </a>
      </div>
    </Card>
  );
}
