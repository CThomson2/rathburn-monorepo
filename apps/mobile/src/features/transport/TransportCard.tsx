import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  FlaskConical,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransportJob {
  id: number;
  material: string;
  supplier: string;
  totalDrums: number;
  scannedDrums: number;
  created: string;
  scheduled: string;
  assignedWorkers: string[];
  stillAssignment: string;
  location: string;
  drumIds: string[];
  scannedIds: string[];
}

interface TransportCardProps {
  job: TransportJob;
  active: boolean;
  onSelect: () => void;
  onCancelScan: (drumId: string) => void;
}

/**
 * A transport job card that displays job details and drum IDs.
 *
 * @param {TransportJob} job - The transport job to display.
 * @param {boolean} active - Whether the card is active (i.e., can be interacted with).
 * @param {() => void} onSelect - Callback function to call when the card is selected.
 * @param {(drumId: string) => void} onCancelScan - Callback function to call when a drum ID is cancelled.
 */
export function TransportCard({
  job,
  active,
  onSelect,
  onCancelScan,
}: TransportCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Calculate progress percentage
  const progressPercent =
    job.totalDrums > 0
      ? Math.round((job.scannedDrums / job.totalDrums) * 100)
      : 0;

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        active ? "border-primary" : "border-muted"
      )}
      onClick={() => (active ? setExpanded(!expanded) : onSelect())}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{job.material}</CardTitle>
            <CardDescription>{job.supplier}</CardDescription>
          </div>
          <Badge variant="secondary">Drums × {job.totalDrums}</Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <Progress value={progressPercent} className="h-2 mb-1" />
        <div className="text-right text-sm text-muted-foreground">
          {job.scannedDrums}/{job.totalDrums} ({progressPercent}%)
        </div>

        {/* Expanded content */}
        {active && expanded && (
          <div className="mt-4 space-y-3 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="text-muted-foreground">Created</div>
                  <div>{job.created}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="text-muted-foreground">Scheduled</div>
                  <div>{job.scheduled}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="text-muted-foreground">Assigned Workers</div>
                <div>{job.assignedWorkers.join(", ")}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="text-muted-foreground">Still Assignment</div>
                <div>{job.stillAssignment}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="text-muted-foreground">Location</div>
                <div>{job.location}</div>
              </div>
            </div>

            {/* Drum IDs grid */}
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Drum IDs</div>
              <div className="grid grid-cols-3 gap-2">
                {job.drumIds.map((drumId) => {
                  const isScanned = job.scannedIds.includes(drumId);
                  return (
                    <div
                      key={drumId}
                      className={cn(
                        "text-sm py-1 px-2 rounded text-center relative",
                        isScanned
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {drumId}
                      {isScanned && (
                        <button
                          className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-white flex items-center justify-center text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelScan(drumId);
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {active && (
        <CardFooter className="pt-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show More
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
