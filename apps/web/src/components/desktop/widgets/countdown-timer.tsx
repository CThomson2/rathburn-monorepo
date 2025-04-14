"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatDateTime } from "@/utils/format-date";

interface CountdownTimerProps {
  targetDate: Date;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        });
        return;
      }

      // Calculate time left
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      const milliseconds = Math.floor(difference % 1000);

      setTimeLeft({
        hours,
        minutes,
        seconds,
        milliseconds,
      });
    }, 10); // Update every 10ms for smooth millisecond transitions

    return () => clearInterval(interval);
  }, [targetDate]);

  // Zero-pad numbers to maintain consistent display
  const formatNumber = (num: number, digits: number) => {
    return num.toString().padStart(digits, "0");
  };
  return (
    <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
        <span className="font-bold uppercase tracking-wider text-2xl">
          COUNTDOWN TO LAUNCH
        </span>
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {formatDateTime(targetDate)}
      </p>
      <div className="flex justify-center items-center">
        <div className="grid grid-cols-7 gap-1 text-center">
          <div className="col-span-2">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(timeLeft.hours, 2)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              HOURS
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-2xl font-bold">:</div>
          </div>
          <div className="col-span-1">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(timeLeft.minutes, 2)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">MIN</div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-2xl font-bold">:</div>
          </div>
          <div className="col-span-1">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(timeLeft.seconds, 2)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">SEC</div>
          </div>
          {/* <div className="flex items-center justify-center">
            <div className="text-2xl font-bold">:</div>
          </div>
          <motion.div
            className="col-span-1"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(timeLeft.milliseconds, 3)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">MS</div>
          </motion.div> */}
        </div>
      </div>
    </div>
  );
}
