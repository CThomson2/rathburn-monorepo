import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type CardSkeletonProps = {
  // For showing actual text or skeleton placeholders
  title?: string;
  description?: string;

  // Content options
  contentClassName?: string;
  children?: React.ReactNode;
};

export function CardSkeleton({
  title,
  description,
  contentClassName,
  children,
}: CardSkeletonProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        {title ? (
          <CardTitle className="text-base">{title}</CardTitle>
        ) : (
          <Skeleton className="h-4 w-[150px]" />
        )}

        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : (
          <Skeleton className="h-3 w-[180px] mt-1" />
        )}
      </CardHeader>
      <CardContent className={contentClassName}>
        {children || <Skeleton className="h-[200px] w-full" />}
      </CardContent>
    </Card>
  );
}
