"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

export default function ToastTestPage() {
  const [count, setCount] = useState(0);

  const createDefaultToast = () => {
    console.log("Creating default toast");
    toast({
      title: "Default Toast",
      description: `This is a default toast notification #${count}`,
      duration: 10000, // 10 seconds
    });
    setCount((prev) => prev + 1);
  };

  const createSuccessToast = () => {
    console.log("Creating success toast");
    toast({
      title: "Success Toast",
      description: `This is a success toast notification #${count}`,
      variant: "success",
      duration: 10000, // 10 seconds
    });
    setCount((prev) => prev + 1);
  };

  const createDestructiveToast = () => {
    console.log("Creating destructive toast");
    toast({
      title: "Destructive Toast",
      description: `This is a destructive toast notification #${count}`,
      variant: "destructive",
      duration: 10000, // 10 seconds
    });
    setCount((prev) => prev + 1);
  };

  const createToastWithAction = () => {
    console.log("Creating toast with action");
    toast({
      title: "Action Toast",
      description: `This toast has an action button #${count}`,
      action: {
        altText: "Try action",
        onClick: () => alert("Toast action clicked!"),
        children: "Try Me",
      },
      duration: 10000, // 10 seconds
    });
    setCount((prev) => prev + 1);
  };

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Toast Testing Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={createDefaultToast} variant="outline">
              Create Default Toast
            </Button>
            <Button
              onClick={createSuccessToast}
              variant="outline"
              className="bg-green-50 dark:bg-green-900/20"
            >
              Create Success Toast
            </Button>
            <Button
              onClick={createDestructiveToast}
              variant="outline"
              className="bg-red-50 dark:bg-red-900/20"
            >
              Create Destructive Toast
            </Button>
            <Button
              onClick={createToastWithAction}
              variant="outline"
              className="bg-blue-50 dark:bg-blue-900/20"
            >
              Create Toast with Action
            </Button>
          </div>

          <div className="mt-8 p-4 border rounded bg-slate-50 dark:bg-slate-900">
            <h3 className="font-medium mb-2">Debugging Notes:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Toasts should appear in the bottom-right corner</li>
              <li>Each toast will remain visible for 10 seconds</li>
              <li>Check the console for logs about toast creation</li>
              <li>
                If toasts are not visible, inspect the DOM to see if they are
                rendering but have styling issues
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
