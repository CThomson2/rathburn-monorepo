import { ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/core/ui/badge";

export type WorkflowRole = "admin" | "operator" | "manager" | "all";

export interface WorkflowCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  role: WorkflowRole;
  roleIcon?: React.ReactNode; // New prop for role icon
  path: string;
  restricted?: boolean;
}

const roleColors = {
  admin: "bg-red-100 text-red-800 border-red-200",
  operator: "bg-blue-100 text-blue-800 border-blue-200",
  manager: "bg-purple-100 text-purple-800 border-purple-200",
  all: "bg-green-100 text-green-800 border-green-200",
};

export function WorkflowCard({
  title,
  description,
  icon,
  role,
  roleIcon,
  path,
  restricted = false,
}: WorkflowCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md group">
      <CardHeader className={cn("pb-2", roleColors[role])}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge
            variant="outline"
            className="font-normal flex items-center gap-1"
          >
            {roleIcon}
            <span className="text-xs">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 relative">
        <div className="mb-8 flex justify-center items-center text-muted-foreground">
          {icon}
        </div>
        {restricted && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary">
              <span className="mr-1">🔒</span> Restricted
            </Badge>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-100 dark:bg-gray-800 p-3 flex justify-between items-center">
        <CardDescription className="text-xs">{description}</CardDescription>
        <a
          href={path}
          className="rounded-full bg-background p-1.5 shadow-sm transition-transform group-hover:translate-x-1"
        >
          <ArrowRight className="h-4 w-4" />
        </a>
      </CardFooter>
    </Card>
  );
}
