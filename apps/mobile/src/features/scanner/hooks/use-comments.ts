import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/core/lib/supabase/client";
import { Database } from "@rathburn/types";
import { useToast } from "@/core/components/ui/use-toast";

type TaskComment = Database["public"]["Tables"]["task_comments"]["Row"];

type TaskType = "transport" | "production";

interface UseCommentsProps {
  taskType?: TaskType;
  taskId?: string | null;
}

/**
 * Hook to fetch, submit, and manage comments for a given task
 * @param taskType - The type of task (transport or production)
 * @param taskId - The ID of the task to fetch comments for
 * @returns Object containing comments, loading states, and CRUD operations
 */
export function useComments({ taskType, taskId }: UseCommentsProps = {}) {
  const [comments, setComments] = useState<TaskComment[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const fetchComments = useCallback(async () => {
    if (!taskId || !taskType) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Determine which field to query based on task type
      const fieldName = taskType === "transport" ? "pol_id" : "job_id";
      
      const { data, error: fetchError } = await supabase
        .from("task_comments")
        .select("*")
        .eq(fieldName, taskId)
        .order("created_at", { ascending: false });
      
      if (fetchError) throw new Error(fetchError.message);
      
      setComments(data);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch comments"));
    } finally {
      setIsLoading(false);
    }
  }, [taskId, taskType]);
  
  // Fetch comments when taskId or taskType changes
  useEffect(() => {
    if (taskId && taskType) {
      fetchComments();
    }
  }, [taskId, taskType, fetchComments]);
  
  const submitComment = useCallback(async (commentText: string) => {
    if (!taskId || !taskType || !commentText.trim()) {
      toast({
        title: "Error",
        description: "Missing required information to submit comment",
        variant: "destructive",
      });
      return { success: false };
    }
    
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Create the comment data object with required fields based on task type
      const commentData = {
        user_id: user.id,
        comment: commentText,
        ...(taskType === "transport" 
          ? { pol_id: taskId } 
          : { job_id: taskId }),
      };
      
      const { error: insertError } = await supabase
        .from("task_comments")
        .insert(commentData);
      
      if (insertError) throw new Error(insertError.message);
      
      toast({
        title: "Comment saved",
        description: "Your comment has been saved successfully",
      });
      
      // Refresh comments after successful submission
      await fetchComments();
      
      return { success: true };
    } catch (err) {
      console.error("Error saving comment:", err);
      toast({
        title: "Failed to save comment",
        description: "There was an error saving your comment. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: err };
    } finally {
      setIsSubmitting(false);
    }
  }, [taskId, taskType, toast, fetchComments]);
  
  const deleteComment = useCallback(async (commentId: string) => {
    if (!commentId) return { success: false };
    
    try {
      const supabase = createClient();
      
      const { error: deleteError } = await supabase
        .from("task_comments")
        .delete()
        .eq("id", commentId);
      
      if (deleteError) throw new Error(deleteError.message);
      
      toast({
        title: "Comment deleted",
        description: "The comment has been removed successfully",
      });
      
      // Refresh comments after successful deletion
      await fetchComments();
      
      return { success: true };
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast({
        title: "Failed to delete comment",
        description: "There was an error deleting the comment. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  }, [toast, fetchComments]);
  
  return { 
    comments, 
    isLoading, 
    error, 
    isSubmitting, 
    submitComment, 
    deleteComment,
    refreshComments: fetchComments
  };
}
