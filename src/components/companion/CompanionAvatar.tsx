"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import type { CompanionId, Mood } from "@/lib/companion";

/**
 * The Miin assistant: a glossy helmet head with ear fins and headphone pods, framing a
 * soft face with big shiny eyes. One colour per personality, six moods. Drawn on a
 * 200x200 grid; all numbers are static so the server and browser render the same markup.
 */

interface Look { helm: [string, string, string]; acc: string; accDark: string; iris: [string, string]; bg: string }

const LOOK: Record<CompanionId, Look> = {
  mia: { helm: ["#FFFFFF", "#E6EAF0", "#C9D1DC"], acc: "#FF8A3D", accDark: "#E8641A", iris: ["#FFC98A", "#E8641A"], bg: "#FFE9D6" },
  kai: { helm: ["#5A6170", "#3A3F4B", "#262A33"], acc: "#2DD4BF", accDark: "#0F9E8E", iris: ["#9FF5E8", "#0F9E8E"], bg: "#D3F4EE" },
  theo: { helm: ["#FFFFFF", "#E7E8F4", "#CBCDE2"], acc: "#7C6CF2", accDark: "#5A49D6", iris: ["#C9C1FF", "#5A49D6"], bg: "#E6E3FF" },
  pip: { helm: ["#FFFFFF", "#F1E6EC", "#DCC6D2"], acc: "#FF5C8A", accDark: "#E23A6C", iris: ["#FFB3C8", "#E23A6C"], bg: "#FFE1EA" },
};

const INK = "#1B2233";
const EY = 121;
const EX = [76, 124] as const;
const HEART = "M0 6 C-9 0 -6 -8 0 -3 C6 -8 9 0 0 6 Z";

function Eye({ x, wink, mood, irisId }: { x: number; wink: boolean; mood: Mood; irisId: string }) {
  if (mood === "love") {
    return (
      <g>
        <path d={`M${x} ${EY + 10} C${x - 15} ${EY} ${x - 8} ${EY - 13} ${x} ${EY - 4} C${x + 8} ${EY - 13} ${x + 15} ${EY} ${x} ${EY + 10} Z`} fill="#FF4D73" />
        <circle cx={x + 4} cy={EY - 5} r={2.4} fill="#fff" opacity={0.9} />
      </g>
    );
  }
  if (mood === "happy" || wink) {
    return <path d={`M${x - 11} ${EY + 3} Q${x} ${EY - 11} ${x + 11} ${EY + 3}`} stroke={INK} strokeWidth={4.5} strokeLinecap="round" fill="none" />;
  }
  const ry = mood === "sad" ? 11 : mood === "worried" ? 12 : 14;
  const y = EY + (mood === "sad" ? 3 : 0);
  return (
    <g>
      <ellipse cx={x} cy={y} rx={14} ry={ry + 3} fill={INK} />
      <ellipse cx={x} cy={y + 2} rx={11.5} ry={ry} fill={`url(#${irisId})`} />
      <circle cx={x} cy={y + 3} r={5} fill={INK} />
      <ellipse cx={x + 4.5} cy={y - 6} rx={5.2} ry={4.4} fill="#fff" />
      <circle cx={x - 4} cy={y + 6} r={1.8} fill="#fff" opacity={0.8} />
      <path d={`M${x - 15} ${y - ry + 2} Q${x} ${y - ry - 8} ${x + 15} ${y - ry + 2}`} stroke={INK} strokeWidth={3.2} strokeLinecap="round" fill="none" />
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  const line = { stroke: INK, strokeWidth: 3, strokeLinecap: "round" as const, fill: "none" };
  switch (mood) {
    case "love":
    case "happy":
      return <path d="M91 142 Q100 154 109 142 Z" fill="#B23A4F" stroke="#B23A4F" strokeWidth={2} strokeLinejoin="round" />;
    case "hello":
      return <path d="M93 143 Q100 150 107 143" {...line} strokeWidth={3.2} />;
    case "okay":
      return <path d="M94 144 Q100 148 106 144" {...line} />;
    case "worried":
      return <path d="M92 147 Q96 143 100 146 Q104 149 108 145" {...line} />;
    case "sad":
      return <path d="M93 149 Q100 142 107 149" {...line} />;
  }
}

export function CompanionAvatar({
  companion, mood, size = 64, className, title,
}: { companion: CompanionId; mood: Mood; size?: number; className?: string; title?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const c = LOOK[companion];
  const ids = { clip: `c${uid}`, helm: `h${uid}`, face: `f${uid}`, iris: `i${uid}`, acc: `a${uid}` };
  const helm = `url(#${ids.helm})`;
  const acc = `url(#${ids.acc})`;
  const sadBrows = mood === "sad";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={title} className={cn("shrink-0", className)}>
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={ids.clip}><circle cx={100} cy={100} r={100} /></clipPath>
        <radialGradient id={ids.helm} cx="38%" cy="28%" r="80%">
          <stop offset="0" stopColor={c.helm[0]} /><stop offset="0.6" stopColor={c.helm[1]} /><stop offset="1" stopColor={c.helm[2]} />
        </radialGradient>
        <radialGradient id={ids.face} cx="50%" cy="35%" r="75%">
          <stop offset="0" stopColor="#FFF8F2" /><stop offset="1" stopColor="#F6DFD2" />
        </radialGradient>
        <radialGradient id={ids.iris} cx="50%" cy="75%" r="75%">
          <stop offset="0" stopColor={c.iris[0]} /><stop offset="1" stopColor={c.iris[1]} />
        </radialGradient>
        <linearGradient id={ids.acc} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.acc} /><stop offset="1" stopColor={c.accDark} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${ids.clip})`}>
        <circle cx={100} cy={100} r={100} fill={c.bg} />
        {/* ear fins */}
        <path d="M48 78 Q50 40 60 24 Q78 36 94 56 Z" fill={helm} stroke={c.helm[2]} strokeWidth={1.5} strokeLinejoin="round" />
        <path d="M58 64 Q60 44 64 36 Q74 44 82 56 Z" fill={acc} />
        <path d="M152 78 Q150 40 140 24 Q122 36 106 56 Z" fill={helm} stroke={c.helm[2]} strokeWidth={1.5} strokeLinejoin="round" />
        <path d="M142 64 Q140 44 136 36 Q126 44 118 56 Z" fill={acc} />
        {/* helmet */}
        <rect x={34} y={44} width={132} height={136} rx={62} fill={helm} />
        <path d="M58 60 Q100 40 142 60" stroke="#fff" strokeOpacity={0.7} strokeWidth={7} strokeLinecap="round" fill="none" />
        <rect x={88} y={56} width={24} height={9} rx={4.5} fill={acc} />
        {/* headphone pods */}
        <ellipse cx={32} cy={122} rx={15} ry={27} fill={helm} stroke={c.helm[2]} strokeWidth={1.5} />
        <ellipse cx={32} cy={122} rx={8} ry={17} fill={acc} />
        <ellipse cx={168} cy={122} rx={15} ry={27} fill={helm} stroke={c.helm[2]} strokeWidth={1.5} />
        <ellipse cx={168} cy={122} rx={8} ry={17} fill={acc} />
        {/* face */}
        <rect x={47} y={82} width={106} height={88} rx={42} fill={`url(#${ids.face})`} stroke={c.helm[2]} strokeWidth={2.5} />
        <g fill="#FF9AA8" opacity={mood === "sad" ? 0.25 : 0.55}>
          <ellipse cx={66} cy={139} rx={8} ry={5} />
          <ellipse cx={134} cy={139} rx={8} ry={5} />
        </g>
        {(mood === "worried" || mood === "sad") && (
          <g stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.75}>
            <line x1={68} y1={sadBrows ? 99 : 100} x2={86} y2={sadBrows ? 93 : 95} />
            <line x1={114} y1={sadBrows ? 93 : 95} x2={132} y2={sadBrows ? 99 : 100} />
          </g>
        )}
        <Eye x={EX[0]} wink={false} mood={mood} irisId={ids.iris} />
        <Eye x={EX[1]} wink={mood === "hello"} mood={mood} irisId={ids.iris} />
        <Mouth mood={mood} />
        {mood === "sad" && <path d="M134 124 Q129.5 133 134 136.5 Q138.5 133 134 124 Z" fill="#7CC4F4" />}
        {mood === "worried" && <path d="M146 78 Q141 87 146 91 Q151 87 146 78 Z" fill="#7CC4F4" />}
        {mood === "love" && (
          <g fill="#FF4D73">
            <path transform="translate(168 50) scale(1.5)" d={HEART} />
            <path transform="translate(182 78)" d={HEART} />
          </g>
        )}
      </g>
    </svg>
  );
}
