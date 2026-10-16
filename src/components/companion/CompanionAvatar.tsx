"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import type { CompanionId, Mood } from "@/lib/companion";

/**
 * Original, hand-drawn SVG faces for the four companions. Each has its own look
 * (hair, colours, glasses) and six moods. Drawn on a 100x100 grid.
 */

const LOOK: Record<CompanionId, { bg: string; skin: string; hair: string; accent: string }> = {
  mia: { bg: "#FFE4E6", skin: "#F5D0B5", hair: "#5B3A29", accent: "#F43F5E" },
  kai: { bg: "#CCFBF1", skin: "#E3AA84", hair: "#27241F", accent: "#0F766E" },
  theo: { bg: "#E0E7FF", skin: "#C68B62", hair: "#B9B9C0", accent: "#4338CA" },
  pip: { bg: "#FEF3C7", skin: "#F2C9A0", hair: "#EA580C", accent: "#F59E0B" },
};

const INK = "#2B2522";
const EYES = [38, 62] as const;
const EYE_Y = 54;

function Heart({ cx, cy }: { cx: number; cy: number }) {
  return (
    <path
      d={`M${cx} ${cy + 5} C${cx - 8} ${cy - 1}, ${cx - 4} ${cy - 8}, ${cx} ${cy - 3} C${cx + 4} ${cy - 8}, ${cx + 8} ${cy - 1}, ${cx} ${cy + 5} Z`}
      fill="#E5484D"
    />
  );
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === "love") return <>{EYES.map(x => <Heart key={x} cx={x} cy={EYE_Y} />)}</>;
  if (mood === "happy") {
    return (
      <>
        {EYES.map(x => (
          <path key={x} d={`M${x - 5} ${EYE_Y + 1} Q${x} ${EYE_Y - 6} ${x + 5} ${EYE_Y + 1}`} stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
        ))}
      </>
    );
  }
  return (
    <>
      {EYES.map(x => (
        <g key={x}>
          <circle cx={x} cy={EYE_Y} r={3.8} fill={INK} />
          <circle cx={x + 1.3} cy={EYE_Y - 1.3} r={1.2} fill="#fff" />
        </g>
      ))}
    </>
  );
}

function Brows({ mood }: { mood: Mood }) {
  // Inner ends raised for worried and sad.
  if (mood === "worried" || mood === "sad") {
    const lift = mood === "sad" ? 5 : 3;
    return (
      <g stroke={INK} strokeWidth={2.6} strokeLinecap="round">
        <line x1={32} y1={45} x2={43} y2={45 - lift} />
        <line x1={57} y1={45 - lift} x2={68} y2={45} />
      </g>
    );
  }
  if (mood === "hello") {
    return (
      <g stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none">
        <path d="M33 45 Q38 42 43 45" />
        <path d="M57 43 Q62 39 67 43" />
      </g>
    );
  }
  return null;
}

function Mouth({ mood }: { mood: Mood }) {
  const stroke = { stroke: INK, strokeWidth: 3, strokeLinecap: "round" as const, fill: "none" };
  switch (mood) {
    case "love":
      return (
        <g>
          <path d="M37 66 Q50 82 63 66 Z" fill="#7A2E2E" />
          <path d="M43 72 Q50 78 57 72 Q50 75 43 72 Z" fill="#F08A8A" />
        </g>
      );
    case "happy":
      return <path d="M38 67 Q50 78 62 67" {...stroke} />;
    case "okay":
      return <path d="M42 69 Q50 74 58 69" {...stroke} />;
    case "worried":
      return <path d="M40 72 Q45 68 50 72 Q55 76 60 72" {...stroke} />;
    case "sad":
      return <path d="M41 74 Q50 66 59 74" {...stroke} />;
    default:
      return <path d="M44 68 Q50 77 56 68 Z" fill="#7A2E2E" />;
  }
}

function HairBack({ id, c }: { id: CompanionId; c: (typeof LOOK)[CompanionId] }) {
  if (id === "mia") return <path d="M15 58 Q12 14 50 12 Q88 14 85 58 L88 100 L12 100 Z" fill={c.hair} />;
  if (id === "theo") {
    return (
      <>
        <ellipse cx={19} cy={50} rx={7} ry={11} fill={c.hair} />
        <ellipse cx={81} cy={50} rx={7} ry={11} fill={c.hair} />
      </>
    );
  }
  return null;
}

function HairFront({ id, c }: { id: CompanionId; c: (typeof LOOK)[CompanionId] }) {
  switch (id) {
    case "mia":
      return (
        <>
          <path d="M19 50 Q20 20 50 18 Q80 20 81 50 Q70 32 50 35 Q30 33 19 50 Z" fill={c.hair} />
          <g transform="translate(74 27)">
            {[0, 72, 144, 216, 288].map(a => (
              // Rounded so server and browser render identical numbers (no hydration mismatch).
              <circle key={a} cx={Math.round(Math.cos((a * Math.PI) / 180) * 450) / 100} cy={Math.round(Math.sin((a * Math.PI) / 180) * 450) / 100} r={3.6} fill={c.accent} />
            ))}
            <circle r={2.6} fill="#FDE68A" />
          </g>
        </>
      );
    case "kai":
      return (
        <>
          <path d="M17 48 Q15 14 50 13 Q85 14 83 48 Q80 31 50 29 Q20 31 17 48 Z" fill={c.hair} />
          <rect x={19} y={29} width={62} height={6} rx={3} fill={c.accent} />
        </>
      );
    case "theo":
      return (
        <>
          <path d="M28 27 Q50 13 72 27 Q50 22 28 27 Z" fill={c.hair} />
          <g stroke="#3F3F46" strokeWidth={2.4} fill="none">
            <circle cx={EYES[0]} cy={EYE_Y} r={9} />
            <circle cx={EYES[1]} cy={EYE_Y} r={9} />
            <path d={`M${EYES[0] + 9} ${EYE_Y} Q50 ${EYE_Y - 3} ${EYES[1] - 9} ${EYE_Y}`} />
          </g>
        </>
      );
    case "pip":
      return (
        <>
          <path d="M17 48 L19 26 L28 32 L31 14 L41 26 L50 9 L59 26 L69 14 L72 32 L81 26 L83 48 Q67 31 50 33 Q33 31 17 48 Z" fill={c.hair} />
          <g fill="#C2410C" opacity={0.55}>
            <circle cx={32} cy={62} r={1.3} /><circle cx={36} cy={65} r={1.3} /><circle cx={30} cy={66} r={1.3} />
            <circle cx={68} cy={62} r={1.3} /><circle cx={64} cy={65} r={1.3} /><circle cx={70} cy={66} r={1.3} />
          </g>
        </>
      );
  }
}

export function CompanionAvatar({
  companion, mood, size = 64, className, title,
}: { companion: CompanionId; mood: Mood; size?: number; className?: string; title?: string }) {
  const clip = useId().replace(/:/g, "");
  const c = LOOK[companion];
  const blush = mood === "love" || mood === "happy" || mood === "hello";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={clip}><circle cx={50} cy={50} r={50} /></clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <circle cx={50} cy={50} r={50} fill={c.bg} />
        <HairBack id={companion} c={c} />
        <path d="M22 100 Q24 86 50 86 Q76 86 78 100 Z" fill={c.accent} />
        <circle cx={50} cy={54} r={32} fill={c.skin} />
        {blush && (
          <g fill="#FF8FA3" opacity={0.45}>
            <ellipse cx={30} cy={65} rx={5.5} ry={3.2} />
            <ellipse cx={70} cy={65} rx={5.5} ry={3.2} />
          </g>
        )}
        <Brows mood={mood} />
        <Eyes mood={mood} />
        <Mouth mood={mood} />
        {mood === "sad" && <path d="M67 58 Q63.5 65 67 67.5 Q70.5 65 67 58 Z" fill="#6CB4EE" />}
        <HairFront id={companion} c={c} />
      </g>
    </svg>
  );
}
