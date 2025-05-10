import React from "react";
import { motion } from "framer-motion";

interface FloatingDrumProps {
  active: boolean;
  width?: number;
  height?: number;
}

/**
 * A simple animated drum component using Framer Motion
 *
 * @param active - Controls animation intensity (true = more active)
 * @param width - Width of the image (default: 200)
 * @param height - Height of the image (default: 200)
 */
export function FloatingDrum({
  active,
  width = 200,
  height = 200,
}: FloatingDrumProps) {
  return (
    <div className="relative" style={{ width, height }}>
      {/* Shadow effect */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/20 rounded-full"
        style={{
          width: width * 0.8,
          height: height * 0.1,
        }}
        animate={{
          scale: active ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: active ? [0.3, 0.4, 0.3] : [0.2, 0.25, 0.2],
        }}
        transition={{
          duration: active ? 1.5 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Drum image */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ width, height }}
        animate={{
          y: active ? [0, -15, 0] : [0, -8, 0],
          rotate: active ? [0, 5, 0, -5, 0] : [0, 2, 0, -2, 0],
        }}
        transition={{
          y: {
            duration: active ? 1.5 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          },
          rotate: {
            duration: active ? 3 : 6,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      >
        <motion.img
          src="/assets/images/drum.png"
          alt="Whiskey Drum"
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback if image is missing
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src =
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIHJ4PSIxMDAiIGZpbGw9IiM5MjRDMDAiLz48cmVjdCB4PSIyNSIgeT0iNDUiIHdpZHRoPSIxNTAiIGhlaWdodD0iMTEwIiByeD0iMTAiIGZpbGw9IiNERTc2MDAiLz48cmVjdCB4PSIzMCIgeT0iNTAiIHdpZHRoPSIxNDAiIGhlaWdodD0iMTAwIiByeD0iNSIgZmlsbD0iI0NGNkQwMCIgc3Ryb2tlPSIjNEEyOTAwIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSI0MCIgeT0iNjAiIHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IiNCQjYwMDAiLz48dGV4dCB4PSI2MCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIj5XSEVSS0VZPC90ZXh0PjxsaW5lIHgxPSI0MCIgeTE9IjgwIiB4Mj0iMTYwIiB5Mj0iODAiIHN0cm9rZT0iIzRBMjkwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjQwIiB5MT0iMTIwIiB4Mj0iMTYwIiB5Mj0iMTIwIiBzdHJva2U9IiM0QTI5MDAiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==";
          }}
          animate={{
            scale: active ? [1, 1.05, 1] : [1, 1.02, 1],
          }}
          transition={{
            scale: {
              duration: active ? 1.5 : 3,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        />
      </motion.div>
    </div>
  );
}

/**
 * Alternative variant with a simple SVG drum if no image is available
 */
export function FloatingDrumSVG({
  active,
  width = 200,
  height = 200,
}: FloatingDrumProps) {
  return (
    <div className="relative" style={{ width, height }}>
      {/* Shadow effect */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/20 rounded-full"
        style={{
          width: width * 0.8,
          height: height * 0.1,
        }}
        animate={{
          scale: active ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: active ? [0.3, 0.4, 0.3] : [0.2, 0.25, 0.2],
        }}
        transition={{
          duration: active ? 1.5 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Drum SVG */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ width, height }}
        animate={{
          y: active ? [0, -15, 0] : [0, -8, 0],
          rotate: active ? [0, 5, 0, -5, 0] : [0, 2, 0, -2, 0],
        }}
        transition={{
          y: {
            duration: active ? 1.5 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          },
          rotate: {
            duration: active ? 3 : 6,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      >
        <motion.svg
          viewBox="0 0 200 200"
          width={width}
          height={height}
          animate={{
            scale: active ? [1, 1.05, 1] : [1, 1.02, 1],
          }}
          transition={{
            scale: {
              duration: active ? 1.5 : 3,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          {/* Drum body */}
          <rect
            width="140"
            height="100"
            rx="5"
            x="30"
            y="50"
            fill="#CF6D00"
            stroke="#4A2900"
            strokeWidth="2"
          />
          <rect width="120" height="80" x="40" y="60" fill="#BB6000" />

          {/* Drum rings */}
          <line
            x1="40"
            y1="80"
            x2="160"
            y2="80"
            stroke="#4A2900"
            strokeWidth="2"
          />
          <line
            x1="40"
            y1="120"
            x2="160"
            y2="120"
            stroke="#4A2900"
            strokeWidth="2"
          />

          {/* Drum text */}
          <text x="60" y="110" fontFamily="Arial" fontSize="20" fill="white">
            WHISKEY
          </text>
        </motion.svg>
      </motion.div>
    </div>
  );
}
