"use client";

import { useState } from "react";
import { MessageType, AudienceType } from "../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateNotificationProps {
  className?: string;
  onNotificationCreated?: () => void;
}

export function CreateNotification({
  className = "",
  onNotificationCreated,
}: CreateNotificationProps) {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("info");
  const [audienceType, setAudienceType] = useState<AudienceType>("all");
  const [expires, setExpires] = useState("24"); // Default to 24 hours
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a message.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expires, 10));

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create notifications");
      }

      // Insert notification
      const { error } = await supabase.from("notification").insert({
        message: message.trim(),
        message_type: messageType,
        audience_type: audienceType,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        is_read: false,
        private: false,
      });

      if (error) throw error;

      // Reset form
      setMessage("");

      toast({
        title: "Success",
        description: "Notification created successfully",
      });

      // Notify parent component
      onNotificationCreated?.();
    } catch (error) {
      console.error("Error creating notification:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create notification",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          Create Notification
        </CardTitle>
        <CardDescription>Send a notification to users</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Message Type</label>
              <Select
                value={messageType}
                onValueChange={(value) => setMessageType(value as MessageType)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Audience</label>
              <Select
                value={audienceType}
                onValueChange={(value) =>
                  setAudienceType(value as AudienceType)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="lab_workers">Lab Workers</SelectItem>
                  <SelectItem value="inventory_workers">
                    Inventory Workers
                  </SelectItem>
                  <SelectItem value="office_workers">Office Workers</SelectItem>
                  <SelectItem value="managers">Managers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Expires after (hours)</label>
            <Input
              type="number"
              min="1"
              max="720" // 30 days
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Enter your notification message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Notification
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
