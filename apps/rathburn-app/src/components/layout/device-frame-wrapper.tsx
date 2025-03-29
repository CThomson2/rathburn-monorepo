"use client";

import { useState, useEffect } from "react";
import { DeviceFrameset } from "react-device-frameset";
import "react-device-frameset/styles/marvel-devices.min.css";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define device options with specific types
const deviceOptions = [
  {
    id: "iPhone8",
    label: "iPhone 8",
    device: "iPhone 8" as const,
    color: "gold",
    width: 375,
    height: 667,
  },
  {
    id: "iPhoneX",
    label: "iPhone X",
    device: "iPhone X" as const,
    color: "black",
    width: 375,
    height: 812,
  },
  {
    id: "iPad",
    label: "iPad",
    device: "iPad Mini" as const,
    color: "silver",
    width: 768,
    height: 1024,
  },
  {
    id: "MacBookPro",
    label: "MacBook Pro",
    device: "MacBook Pro" as const,
    color: "silver",
    width: 1280,
    height: 800,
  },
];

interface DeviceFrameWrapperProps {
  children: React.ReactNode;
}

// Add this helper function to map any device to a supported one
const getSupportedDevice = (device: string) => {
  // Map unsupported devices to supported ones
  const deviceMap: Record<string, "iPhone X" | "MacBook Pro"> = {
    "iPhone 8": "iPhone X",
    "iPhone X": "iPhone X",
    "iPad Mini": "MacBook Pro", // Default to MacBook Pro for tablets
    "MacBook Pro": "MacBook Pro",
  };

  return deviceMap[device] || "iPhone X"; // Default to iPhone X if unknown
};

export function DeviceFrameWrapper({ children }: DeviceFrameWrapperProps) {
  // State for selected device
  const [selectedDevice, setSelectedDevice] = useState(deviceOptions[1]); // Default to iPhone X
  const [showFrame, setShowFrame] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Handle hydration mismatch by only rendering on client side
  useEffect(() => {
    setIsClient(true);

    // Check for saved preferences in localStorage
    const savedDevice = localStorage.getItem("preferredDeviceFrame");
    if (savedDevice) {
      const device = deviceOptions.find((d) => d.id === savedDevice);
      if (device) setSelectedDevice(device);
    }

    const savedShowFrame = localStorage.getItem("showDeviceFrame");
    if (savedShowFrame !== null) {
      setShowFrame(savedShowFrame === "true");
    }
  }, []);

  // Update localStorage when preferences change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("preferredDeviceFrame", selectedDevice.id);
      localStorage.setItem("showDeviceFrame", String(showFrame));
    }
  }, [selectedDevice.id, showFrame, isClient]);

  // Don't render anything on server to avoid hydration issues
  if (!isClient) {
    return <div className="min-h-screen">{children}</div>;
  }

  if (!showFrame) {
    return (
      <div className="relative">
        <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFrame(true)}
            className="bg-background/80 backdrop-blur-sm"
          >
            Show Device Frame
          </Button>
        </div>
        <div className="min-h-screen">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 overflow-auto">
      <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2">
        <Select
          value={selectedDevice.id}
          onValueChange={(value) => {
            const device = deviceOptions.find((d) => d.id === value);
            if (device) setSelectedDevice(device);
          }}
        >
          <SelectTrigger className="w-40 bg-background/80 backdrop-blur-sm">
            <SelectValue placeholder="Select device" />
          </SelectTrigger>
          <SelectContent>
            {deviceOptions.map((device) => (
              <SelectItem key={device.id} value={device.id}>
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFrame(false)}
          className="bg-background/80 backdrop-blur-sm"
        >
          Hide Frame
        </Button>
      </div>

      <div className="flex justify-center items-start pt-16 pb-8">
        <div className="device-container">
          <DeviceFrameset
            device={getSupportedDevice(selectedDevice.device)}
            color={selectedDevice.color}
          >
            <div
              style={{
                width: selectedDevice.width,
                height: selectedDevice.height,
                overflow: "auto",
              }}
            >
              {children}
            </div>
          </DeviceFrameset>
        </div>
      </div>

      <style jsx>{`
        .device-container {
          max-height: calc(100vh - 100px);
          transform-origin: top center;
          transform: ${selectedDevice.id.includes("iPad")
            ? "scale(0.8)"
            : "scale(1)"};
        }

        @media (max-height: 900px) {
          .device-container {
            transform: scale(0.7);
          }
        }

        @media (max-height: 700px) {
          .device-container {
            transform: scale(0.6);
          }
        }
      `}</style>
    </div>
  );
}
