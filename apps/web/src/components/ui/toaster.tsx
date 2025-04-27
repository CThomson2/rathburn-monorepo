"use client";

import { useToast } from "@/hooks/use-toast";
import { Toast, type ToastProps } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import { Sonner } from "@/components/ui/sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

// export function Toaster() {
//   const { toasts, dismiss } = useToast();

//   console.log("Toaster rendering with toasts:", toasts);

//   // Render the toasts instead of returning null
//   return (
//     <>
//       {/* Debug element to ensure the toast container is visible */}
//       {/* <div className="fixed top-4 right-4 z-[9999] bg-yellow-300 text-black p-2 rounded text-xs">
//         Toast Debug: {toasts.length} toasts
//       </div> */}

//       <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 border-4 border-dashed border-yellow-500 p-2 min-h-[100px] min-w-[200px]">
//         {toasts.length === 0 && (
//           <div className="text-center p-2 bg-white dark:bg-gray-800 rounded opacity-70">
//             No toasts to display
//           </div>
//         )}
//         {toasts.map((toast) => {
//           console.log("Rendering toast:", toast);
//           return (
//             <Toast
//               key={toast.id}
//               {...toast}
//               onClose={() => {
//                 console.log("Toast close triggered:", toast.id);
//                 dismiss(toast.id);
//               }}
//             />
//           );
//         })}
//       </div>
//     </>
//   );
// }
