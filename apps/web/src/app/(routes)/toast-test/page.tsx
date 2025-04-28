"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function ToastTestPage() {
  const [count, setCount] = useState(0);

  const createDefaultToast = () => {
    console.log("Creating default toast");
    toast.default(`This is a default toast notification #${count}`);
    setCount((prev) => prev + 1);
  };

  const createSuccessToast = () => {
    console.log("Creating success toast");
    toast.success(`This is a success toast notification #${count}`);
    setCount((prev) => prev + 1);
  };

  const createErrorToast = () => {
    console.log("Creating error toast");
    toast.error(`This is an error toast notification #${count}`);
    setCount((prev) => prev + 1);
  };

  const createWarningToast = () => {
    console.log("Creating warning toast");
    toast.warning(`This is a warning toast notification #${count}`);
    setCount((prev) => prev + 1);
  };

  const createInfoToast = () => {
    console.log("Creating info toast");
    toast.info(`This is an info toast notification #${count}`);
    setCount((prev) => prev + 1);
  };

  const createNotificationToast = () => {
    console.log("Creating notification toast");
    toast.notify(
      "Operation Completed",
      `This is a notification toast with title #${count}`,
      "success",
      { autoClose: 8000 }
    );
    setCount((prev) => prev + 1);
  };

  const createCustomToast = () => {
    console.log("Creating custom toast");
    toast.custom(
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3">
          <span className="text-white font-bold">!</span>
        </div>
        <div>
          <h4 className="font-bold">Custom Toast</h4>
          <p>This is a custom toast with JSX content #{count}</p>
        </div>
      </div>,
      { position: "top-center", autoClose: 10000 }
    );
    setCount((prev) => prev + 1);
  };

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Toast Testing Page (React Toastify)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={createDefaultToast} variant="outline">
              Default Toast
            </Button>
            <Button
              onClick={createSuccessToast}
              variant="outline"
              className="bg-green-50 dark:bg-green-900/20"
            >
              Success Toast
            </Button>
            <Button
              onClick={createErrorToast}
              variant="outline"
              className="bg-red-50 dark:bg-red-900/20"
            >
              Error Toast
            </Button>
            <Button
              onClick={createWarningToast}
              variant="outline"
              className="bg-yellow-50 dark:bg-yellow-900/20"
            >
              Warning Toast
            </Button>
            <Button
              onClick={createInfoToast}
              variant="outline"
              className="bg-blue-50 dark:bg-blue-900/20"
            >
              Info Toast
            </Button>
            <Button
              onClick={createNotificationToast}
              variant="outline"
              className="bg-purple-50 dark:bg-purple-900/20"
            >
              Notification Toast
            </Button>
            <Button
              onClick={createCustomToast}
              variant="outline"
              className="bg-indigo-50 dark:bg-indigo-900/20 col-span-2"
            >
              Custom JSX Toast
            </Button>
          </div>

          <div className="mt-8 p-4 border rounded bg-slate-50 dark:bg-slate-900">
            <h3 className="font-medium mb-2">React Toastify Examples:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Default - Simple text toast</li>
              <li>Success - Green success message</li>
              <li>Error - Red error message</li>
              <li>Warning - Yellow warning message</li>
              <li>Info - Blue information message</li>
              <li>Notification - Toast with title and message</li>
              <li>Custom JSX - Custom styled component with JSX content</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
