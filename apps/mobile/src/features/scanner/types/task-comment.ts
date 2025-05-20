import { Database } from "@rathburn/types";

export type TaskComment = Database["public"]["Tables"]["task_comments"]["Row"];

export interface FormattedTaskComment {
  id: string;
  created_at: string;
  comment: string;
  user_id: string;
  user_email: string;
  user_name: string;
}
