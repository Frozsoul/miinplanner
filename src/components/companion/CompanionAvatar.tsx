"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import type { CompanionId, Mood } from "@/lib/companion";

/**
 * The Miin assistant: one friendly robot wearing the MiinDigital mark, in a colour per
 * personality, with six moods shown on its screen face. Drawn on a 200x200 grid; all
 * numbers are static so the server and browser render the same markup.
 */

interface Look { bg: string; body: string; bodyDark: string; screen: string; glow: string }

const LOOK: Record<CompanionId, Look> = {
  mia: { bg: "#FFF4C2", body: "#FFD000", bodyDark: "#E0B500", screen: "#1F2430", glow: "#FFE266" },
  kai: { bg: "#D5F5EE", body: "#2B3038", bodyDark: "#1A1D22", screen: "#0E1116", glow: "#5EEAD4" },
  theo: { bg: "#E3E7FA", body: "#6D7FE0", bodyDark: "#5466C7", screen: "#1C2140", glow: "#C7D2FE" },
  pip: { bg: "#FFE3EA", body: "#FF7A9C", bodyDark: "#E85F83", screen: "#2A1C24", glow: "#FFC2D3" },
};

const EYE_Y = 104;
const EYES = [80, 120] as const;

function Eyes({ mood, glow }: { mood: Mood; glow: string }) {
  if (mood === "love") {
    return (
      <>
        {EYES.map(x => (
          <path key={x} d={`M${x} ${EYE_Y + 8} C${x - 12} ${EYE_Y} ${x - 6} ${EYE_Y - 10} ${x} ${EYE_Y - 3} C${x + 6} ${EYE_Y - 10} ${x + 12} ${EYE_Y} ${x} ${EYE_Y + 8} Z`} fill="#FF5C7A" />
        ))}
      </>
    );
  }
  if (mood === "happy") {
    return (
      <>
        {EYES.map(x => (
          <path key={x} d={`M${x - 9} ${EYE_Y + 4} Q${x} ${EYE_Y - 8} ${x + 9} ${EYE_Y + 4}`} stroke={glow} strokeWidth={6} strokeLinecap="round" fill="none" />
        ))}
      </>
    );
  }
  const h = mood === "worried" ? 13 : mood === "sad" ? 12 : 17;
  const dy = mood === "sad" ? 4 : 0;
  return (
    <>
      {EYES.map((x, i) => mood === "hello" && i === 1 ? (
        // A wink.
        <path key={x} d={`M${x - 8} ${EYE_Y + 2} Q${x} ${EYE_Y - 7} ${x + 8} ${EYE_Y + 2}`} stroke={glow} strokeWidth={5.5} strokeLinecap="round" fill="none" />
      ) : (
        <g key={x}>
          <rect x={x - 5.5} y={EYE_Y - h / 2 + dy} width={11} height={h} rx={5.5} fill={glow} />
          <circle cx={x + 1.8} cy={EYE_Y - h / 2 + dy + 3.6} r={1.8} fill="#fff" opacity={0.9} />
        </g>
      ))}
    </>
  );
}

function Brows({ mood, glow }: { mood: Mood; glow: string }) {
  if (mood !== "worried" && mood !== "sad") return null;
  const lift = mood === "sad" ? 6 : 4;
  return (
    <g stroke={glow} strokeWidth={4} strokeLinecap="round">
      <line x1={70} y1={88} x2={88} y2={88 - lift} />
      <line x1={112} y1={88 - lift} x2={130} y2={88} />
    </g>
  );
}

function Mouth({ mood, glow }: { mood: Mood; glow: string }) {
  const line = { stroke: glow, strokeWidth: 5, strokeLinecap: "round" as const, fill: "none" };
  switch (mood) {
    case "love":
    case "happy":
      return <path d="M84 124 Q100 140 116 124 Z" fill={glow} stroke={glow} strokeWidth={3} strokeLinejoin="round" />;
    case "hello":
      return <path d="M88 125 Q100 135 112 125" {...line} />;
    case "okay":
      return <path d="M90 127 Q100 132 110 127" {...line} />;
    case "worried":
      return <path d="M88 130 Q94 125 100 129 Q106 133 112 128" {...line} />;
    case "sad":
      return <path d="M89 133 Q100 124 111 133" {...line} />;
  }
}

/** The MiinDigital mark (two wings forming an M), scaled down as the robot's crest. */
function Crest({ left, right }: { left: string; right: string }) {
  return (
    <g transform="translate(63.5 26) scale(0.0875)">
      <path fill={left} d="M392.98 0 L0 221.07 L107.58 294.66 L282.87 190.73 L282.87 334.55 L392.98 400 Z" />
      <path fill={right} d="M450.56 0 L843.54 221.07 L735.96 294.66 L560.67 190.73 L560.67 334.55 L450.56 400 Z" />
    </g>
  );
}

function Heart({ x, y, s }: { x: number; y: number; s: number }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 6 C-9 0 -6 -8 0 -3 C6 -8 9 0 0 6 Z" fill="#FF5C7A" />;
}

export function CompanionAvatar({
  companion, mood, size = 64, className, title,
}: { companion: CompanionId; mood: Mood; size?: number; className?: string; title?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const c = LOOK[companion];
  const crestLeft = "#1A1A1A";
  const crestRight = companion === "mia" ? "#C99A00" : "#FFD000";
  const cheeks = mood === "love" || mood === "happy" || mood === "hello";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={title} className={cn("shrink-0", className)}>
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={`c${uid}`}><circle cx={100} cy={100} r={100} /></clipPath>
      </defs>
      <g clipPath={`url(#c${uid})`}>
        <circle cx={100} cy={100} r={100} fill={c.bg} />
        {/* body */}
        <rect x={56} y={160} width={88} height={60} rx={30} fill={c.bodyDark} />
        <rect x={86} y={150} width={28} height={16} rx={6} fill={c.bodyDark} />
        {/* ears */}
        <rect x={24} y={92} width={20} height={34} rx={10} fill={c.bodyDark} />
        <rect x={156} y={92} width={20} height={34} rx={10} fill={c.bodyDark} />
        <Crest left={crestLeft} right={crestRight} />
        {/* head */}
        <rect x={36} y={56} width={128} height={100} rx={42} fill={c.body} />
        <path d="M60 64 Q100 54 140 64" stroke="#fff" strokeOpacity={0.35} strokeWidth={5} strokeLinecap="round" fill="none" />
        {/* screen */}
        <rect x={52} y={74} width={96} height={70} rx={30} fill={c.screen} />
        {cheeks && (
          <g fill="#FF8FA8" opacity={0.55}>
            <ellipse cx={45} cy={124} rx={6} ry={4} />
            <ellipse cx={155} cy={124} rx={6} ry={4} />
          </g>
        )}
        <Brows mood={mood} glow={c.glow} />
        <Eyes mood={mood} glow={c.glow} />
        <Mouth mood={mood} glow={c.glow} />
        {mood === "sad" && <path d="M131 112 Q127 120 131 123 Q135 120 131 112 Z" fill="#7CC0F0" />}
        {mood === "worried" && <path d="M160 66 Q155 75 160 79 Q165 75 160 66 Z" fill="#7CC0F0" />}
        {mood === "love" && (
          <g>
            <Heart x={164} y={48} s={1.5} />
            <Heart x={180} y={74} s={1} />
            <Heart x={30} y={56} s={1} />
          </g>
        )}
      </g>
    </svg>
  );
}
