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
import { MessageSquare, RefreshCw, Send } from "lucide-react";
import { formatDistance } from "date-fns";
import { Textarea } from "@/core/components/ui/textarea";
import { useComments } from "../hooks/use-comments";
import { FormattedTaskComment } from "../types/task-comment";

interface TaskCommentsDialogProps {
  taskType: "transport" | "production";
  taskId: string | null;
  taskName: string;
}

export function TaskCommentsDialog({
  taskType,
  taskId,
  taskName,
}: TaskCommentsDialogProps) {
  const [newComment, setNewComment] = useState("");
  const {
    comments: rawComments,
    isLoading,
    error,
    isSubmitting,
    submitComment,
    refreshComments,
  } = useComments({ taskType, taskId });

  // Format comments for display
  const comments: FormattedTaskComment[] =
    rawComments?.map((comment) => ({
      id: comment.id,
      created_at: comment.created_at,
      comment: comment.comment,
      user_id: comment.user_id,
      user_email: comment.username || "Unknown user",
      user_name: comment.username || "Unknown user",
    })) || [];

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    const { success } = await submitComment(newComment);
    if (success) {
      setNewComment("");
    }
  };

  // Reset and fetch comments when dialog opens
  const handleDialogOpen = (open: boolean) => {
    if (open && taskId) {
      refreshComments();
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
            onClick={refreshComments}
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

        <ScrollArea className="flex-grow max-h-[40vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="animate-spin rounded-full h-6 w-6 text-primary" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error.message}</div>
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

        <div className="mt-4 space-y-2">
          <Textarea
            placeholder="Add your comment here..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] w-full"
            disabled={isSubmitting}
          />
          <Button
            onClick={handleSubmitComment}
            className="w-full"
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit Comment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
