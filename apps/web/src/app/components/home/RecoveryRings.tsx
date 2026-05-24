"use client";

import { motion, useReducedMotion } from "framer-motion";

const rings = [
  {
    size: "74%",
    color: "var(--hrv)",
    mix: 34,
    delay: 0,
    glowSoft: "rgba(215, 184, 255, 0.18)",
    glowStrong: "rgba(215, 184, 255, 0.42)",
  },
  {
    size: "58%",
    color: "var(--load)",
    mix: 34,
    delay: 0.15,
    glowSoft: "rgba(242, 184, 128, 0.16)",
    glowStrong: "rgba(242, 184, 128, 0.4)",
  },
  {
    size: "40%",
    color: "var(--recovery)",
    mix: 48,
    delay: 0.3,
    glowSoft: "rgba(168, 213, 186, 0.18)",
    glowStrong: "rgba(168, 213, 186, 0.44)",
  },
];

export function RecoveryRings() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative aspect-square w-full max-w-[520px]">
      {rings.map((ring) => (
        <motion.div
          key={ring.size}
          className="absolute left-1/2 top-1/2 rounded-full border-[3px] border-solid -translate-x-1/2 -translate-y-1/2"
          style={{
            width: ring.size,
            height: ring.size,
            borderColor: `color-mix(in srgb, ${ring.color} ${ring.mix}%, transparent)`,
            boxShadow: `0 0 0 1px ${ring.glowSoft}, 0 0 24px ${ring.glowSoft}`,
          }}
          initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.82 }}
          animate={
            reduceMotion
              ? {
                  opacity: 1,
                  scale: 1,
                  boxShadow: `0 0 0 1px ${ring.glowSoft}, 0 0 24px ${ring.glowSoft}`,
                }
              : {
                  opacity: [0.72, 1, 0.72],
                  scale: [0.96, 1.06, 0.96],
                  y: [0, -4, 0],
                  boxShadow: [
                    `0 0 0 1px ${ring.glowSoft}, 0 0 18px ${ring.glowSoft}`,
                    `0 0 0 1px ${ring.glowStrong}, 0 0 42px ${ring.glowStrong}`,
                    `0 0 0 1px ${ring.glowSoft}, 0 0 18px ${ring.glowSoft}`,
                  ],
                }
          }
          transition={{
            duration: 3.5,
            delay: ring.delay,
            ease: "easeInOut",
            repeat: reduceMotion ? 0 : Infinity,
          }}
        />
      ))}

      <motion.div
        className="absolute left-1/2 top-1/2 h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(168,213,186,0.34) 0%, rgba(169,183,255,0.22) 45%, rgba(169,183,255,0) 76%)",
        }}
        initial={reduceMotion ? { opacity: 0.7, scale: 1 } : { opacity: 0, scale: 0.8 }}
        animate={
          reduceMotion
            ? { opacity: 0.7, scale: 1 }
            : {
                opacity: [0.45, 0.82, 0.45],
                scale: [0.88, 1.14, 0.88],
                y: [0, -5, 0],
              }
        }
        transition={{
          duration: 3.2,
          delay: 0.15,
          ease: "easeInOut",
          repeat: reduceMotion ? 0 : Infinity,
        }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[var(--recovery)] via-[color-mix(in_srgb,var(--sleep)_64%,var(--recovery))] to-[var(--sleep)] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
        style={{
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.25), 0 0 26px rgba(168,213,186,0.38), 0 0 52px rgba(169,183,255,0.26)",
        }}
        initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
        animate={
            reduceMotion
              ? {
                  opacity: 1,
                  scale: 1,
                  boxShadow:
                    "0 20px 60px rgba(0,0,0,0.25), 0 0 26px rgba(168,213,186,0.38), 0 0 52px rgba(169,183,255,0.26)",
                }
              : {
                  opacity: [0.82, 1, 0.82],
                  scale: [0.92, 1.1, 0.92],
                  y: [0, -6, 0],
                  rotate: [0, 8, -8, 0],
                  boxShadow: [
                    "0 20px 60px rgba(0,0,0,0.22), 0 0 22px rgba(168,213,186,0.28), 0 0 40px rgba(169,183,255,0.18)",
                    "0 24px 72px rgba(0,0,0,0.28), 0 0 34px rgba(168,213,186,0.48), 0 0 66px rgba(169,183,255,0.34)",
                    "0 20px 60px rgba(0,0,0,0.22), 0 0 22px rgba(168,213,186,0.28), 0 0 40px rgba(169,183,255,0.18)",
                  ],
                }
          }
        transition={{
          duration: 4.5,
          delay: 0.25,
          ease: "easeInOut",
          repeat: reduceMotion ? 0 : Infinity,
        }}
      />
    </div>
  );
}
