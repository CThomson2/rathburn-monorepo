import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import { MessageSquare, RefreshCw } from "lucide-react";
import { createClient } from "@/core/lib/supabase/client";
import { formatDistance } from "date-fns";
import { PostgrestError } from "@supabase/supabase-js";
import { TaskComment, FormattedTaskComment } from "../types/task-comment";

interface TaskCommentsDialogProps {
  taskType: "transport" | "production";
  taskId: string | null;
  taskName: string;
}

interface CommentWithUserData extends TaskComment {
  users?: {
    email?: string;
    user_profiles?: {
      full_name?: string;
    };
  };
}

export function TaskCommentsDialog({
  taskType,
  taskId,
  taskName,
}: TaskCommentsDialogProps) {
  const [comments, setComments] = useState<FormattedTaskComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    if (!taskId) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Determine which field to query based on task type
      const idFieldName = taskType === "transport" ? "pol_id" : "job_id";

      // Query for comments with user information
      const { data, error } = await supabase
        .from("task_comments")
        .select(
          `
          id,
          created_at,
          comment,
          user_id,
          auth.users!user_id (
            email,
            auth_ext.user_profiles!user_id (
              full_name
            )
          )
        `
        )
        .eq(idFieldName, taskId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to include user email and name
      const formattedComments: FormattedTaskComment[] = (data || []).map(
        (comment: CommentWithUserData) => {
          return {
            id: comment.id,
            created_at: comment.created_at,
            comment: comment.comment,
            user_id: comment.user_id,
            user_email: comment.users?.email || "Unknown user",
            user_name:
              comment.users?.user_profiles?.full_name ||
              comment.users?.email?.split("@")[0] ||
              "Unknown user",
          };
        }
      );

      setComments(formattedComments);
    } catch (err) {
      console.error("Error fetching comments:", err);
      const errorMessage =
        err instanceof PostgrestError
          ? err.message
          : "Failed to load comments. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset and fetch comments when dialog opens (handled by Dialog's onOpenChange)
  const handleDialogOpen = (open: boolean) => {
    if (open && taskId) {
      fetchComments();
    }
  };

  return (
    <Dialog onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>View Comments</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments for {taskName}</DialogTitle>
          <DialogDescription>
            {comments.length === 0 && !isLoading
              ? "No comments yet. Be the first to add a comment."
              : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end my-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchComments}
            disabled={isLoading}
            className="text-xs h-8"
          >
            {isLoading ? (
              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Refresh
          </Button>
        </div>

        <ScrollArea className="flex-grow max-h-[50vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="animate-spin rounded-full h-6 w-6 text-primary" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : comments.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No comments found
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistance(
                        new Date(comment.created_at),
                        new Date(),
                        { addSuffix: true }
                      )}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
