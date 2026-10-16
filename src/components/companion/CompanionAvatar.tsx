"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import type { CompanionId, Mood } from "@/lib/companion";

/**
 * Original flat vector portraits of the four companions (adults, head and shoulders),
 * each with six moods. Drawn on a 200x200 grid. All numbers are static so the server
 * and browser render the same markup.
 */

interface Look {
  bg: string;
  skin: string;
  shade: string; // skin shadow, nose
  hair: string;
  hairLight: string;
  iris: string;
  lips: string;
  top: string;
  topDark: string;
  feminine: boolean;
}

const LOOK: Record<CompanionId, Look> = {
  mia: { bg: "#FDE2E4", skin: "#F3C9A8", shade: "#D9A07E", hair: "#3B2418", hairLight: "#6B4330", iris: "#5A3A22", lips: "#C74B62", top: "#F07167", topDark: "#D85A51", feminine: true },
  kai: { bg: "#CFF5EC", skin: "#A8714F", shade: "#8A5638", hair: "#1C1917", hairLight: "#3A332E", iris: "#2B1A10", lips: "#8E4E3E", top: "#0F766E", topDark: "#0B5C55", feminine: false },
  theo: { bg: "#E2E7F6", skin: "#C48B63", shade: "#A46E4A", hair: "#C9CCD2", hairLight: "#E6E8EC", iris: "#3B2A1E", lips: "#9A5A48", top: "#1E3A5F", topDark: "#142A47", feminine: false },
  pip: { bg: "#FCEFCB", skin: "#F4CDB0", shade: "#DDA889", hair: "#B5471E", hairLight: "#DA6A35", iris: "#3F6B4E", lips: "#D0546B", top: "#E9A23B", topDark: "#CF8A26", feminine: true },
};

const INK = "#2A211C";

const FACE_SOFT = "M64 88 C64 58 80 44 100 44 C120 44 136 58 136 88 C136 112 127 129 113 137 Q100 144 87 137 C73 129 64 112 64 88 Z";
const FACE_SQUARE = "M63 86 C63 56 80 42 100 42 C120 42 137 56 137 86 C137 110 133 124 121 134 Q100 147 79 134 C67 124 63 110 63 86 Z";

function Eye({ cx, mood, look, clipId, right }: { cx: number; mood: Mood; look: Look; clipId: string; right: boolean }) {
  const cy = 95;
  if (mood === "love") {
    return <path d={`M${cx - 8} ${cy + 1} Q${cx} ${cy - 7} ${cx + 8} ${cy + 1}`} stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none" />;
  }
  const lookDown = mood === "sad" ? 1.6 : 0;
  const squint = mood === "happy" ? 1.2 : 0;
  const almond = `M${cx - 8.5} ${cy} Q${cx} ${cy - 7.5 + squint} ${cx + 8.5} ${cy} Q${cx} ${cy + 5.5 - squint} ${cx - 8.5} ${cy} Z`;
  const outer = right ? cx + 8.5 : cx - 8.5;
  const flick = right ? 3.2 : -3.2;
  return (
    <g>
      <defs><clipPath id={clipId}><path d={almond} /></clipPath></defs>
      <path d={almond} fill="#fff" />
      <g clipPath={`url(#${clipId})`}>
        <circle cx={cx} cy={cy + 0.4 + lookDown} r={4.4} fill={look.iris} />
        <circle cx={cx} cy={cy + 0.4 + lookDown} r={2.2} fill={INK} />
        <circle cx={cx + 1.4} cy={cy - 1 + lookDown} r={1.1} fill="#fff" />
      </g>
      <path d={`M${cx - 9} ${cy + 0.3} Q${cx} ${cy - 8 + squint} ${cx + 9} ${cy + 0.3}`} stroke={INK} strokeWidth={look.feminine ? 2.4 : 1.8} strokeLinecap="round" fill="none" />
      {look.feminine && <path d={`M${outer} ${cy - 0.6} L${outer + flick} ${cy - 3.6}`} stroke={INK} strokeWidth={1.8} strokeLinecap="round" />}
      {mood === "happy" && <path d={`M${cx - 6} ${cy + 5} Q${cx} ${cy + 7} ${cx + 6} ${cy + 5}`} stroke={look.shade} strokeWidth={1.2} fill="none" strokeLinecap="round" />}
    </g>
  );
}

function Brows({ mood, look }: { mood: Mood; look: Look }) {
  const color = look.hair === "#C9CCD2" ? "#8E939B" : look.hair;
  const w = look.feminine ? 2.6 : 3.4;
  let left = "M76 84 Q85 79 94 82";
  let right = "M106 82 Q115 79 124 84";
  if (mood === "worried") { left = "M76 84 Q85 81 94 79"; right = "M106 79 Q115 81 124 84"; }
  if (mood === "sad") { left = "M76 85 Q85 82 94 78"; right = "M106 78 Q115 82 124 85"; }
  if (mood === "hello") { right = "M106 80 Q115 74 124 79"; }
  if (mood === "love" || mood === "happy") { left = "M76 82 Q85 77 94 80"; right = "M106 80 Q115 77 124 82"; }
  return (
    <g stroke={color} strokeWidth={w} strokeLinecap="round" fill="none">
      <path d={left} />
      <path d={right} />
    </g>
  );
}

function Mouth({ mood, look }: { mood: Mood; look: Look }) {
  const line = { stroke: look.lips, strokeWidth: 2.6, strokeLinecap: "round" as const, fill: "none" };
  const open = (d: string, teeth: string) => (
    <g>
      <path d={d} fill="#7A2633" />
      <path d={teeth} fill="#fff" />
      <path d={d} fill="none" stroke={look.lips} strokeWidth={1.4} strokeLinejoin="round" />
    </g>
  );
  switch (mood) {
    case "love":
    case "happy":
      return open("M86 120 Q100 138 114 120 Q100 123 86 120 Z", "M88.5 121 Q100 123.8 111.5 121 L110.6 123.6 Q100 126.4 89.4 123.6 Z");
    case "hello":
      return open("M89 121 Q100 133 111 121 Q100 123.5 89 121 Z", "M91 121.8 Q100 124 109 121.8 L108.3 123.8 Q100 126 91.7 123.8 Z");
    case "okay":
      return (
        <g>
          <path d="M89 122 Q100 129 111 122" {...line} />
          {look.feminine && <path d="M94 127.5 Q100 129.5 106 127.5" stroke={look.lips} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.6} />}
        </g>
      );
    case "worried":
      return <path d="M90 126 Q95 122.5 100 125 Q105 127.5 110 124" {...line} />;
    case "sad":
      return <path d="M90 128 Q100 120 110 128" {...line} />;
  }
}

function Body({ id, look }: { id: CompanionId; look: Look }) {
  const torso = <path d="M24 200 C26 174 52 160 100 158 C148 160 174 174 176 200 Z" fill={look.top} />;
  switch (id) {
    case "mia":
      return (
        <g>
          {torso}
          <path d="M84 158 L100 182 L116 158 Z" fill={look.skin} />
          <path d="M80 158 L100 186 L120 158" stroke={look.topDark} strokeWidth={3} fill="none" strokeLinejoin="round" />
          <path d="M92 168 Q100 176 108 168" stroke="#E8C26A" strokeWidth={1.4} fill="none" />
          <circle cx={100} cy={176} r={2} fill="#E8C26A" />
        </g>
      );
    case "kai":
      return (
        <g>
          {torso}
          <path d="M78 160 L100 176 L122 160 L120 150 L100 164 L80 150 Z" fill={look.topDark} />
          <path d="M100 176 L100 200" stroke="#9FD8CF" strokeWidth={1.8} />
          <path d="M40 196 Q46 178 62 170" stroke={look.topDark} strokeWidth={2} fill="none" />
          <path d="M160 196 Q154 178 138 170" stroke={look.topDark} strokeWidth={2} fill="none" />
        </g>
      );
    case "theo":
      return (
        <g>
          {torso}
          <path d="M84 158 L100 192 L116 158 Z" fill="#F4F6FA" />
          <path d="M84 158 L92 168 L100 160 L108 168 L116 158" fill="#E3E7EE" />
          <path d="M84 158 L100 192 L80 200 L70 166 Z" fill={look.topDark} />
          <path d="M116 158 L100 192 L120 200 L130 166 Z" fill={look.topDark} />
        </g>
      );
    case "pip":
      return (
        <g>
          {torso}
          <path d="M82 159 Q100 176 118 159" fill={look.skin} />
          <path d="M80 158 Q100 180 120 158" stroke={look.topDark} strokeWidth={3.5} fill="none" />
        </g>
      );
  }
}

function HairBack({ id, look }: { id: CompanionId; look: Look }) {
  switch (id) {
    case "mia":
      return (
        <g>
          <path d="M58 92 C50 50 74 28 101 28 C130 28 152 50 144 94 C150 122 156 150 147 178 C139 184 127 182 121 172 L120 150 L80 150 L79 172 C73 182 61 184 53 178 C44 150 51 120 58 92 Z" fill={look.hair} />
          <path d="M140 110 C146 130 150 152 144 172" stroke={look.hairLight} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.7} />
        </g>
      );
    case "pip":
      return (
        <g fill={look.hair}>
          {[[64, 80, 20], [68, 58, 20], [84, 42, 20], [104, 36, 21], [124, 42, 20], [138, 60, 20], [140, 82, 19], [60, 102, 16], [142, 104, 16], [62, 120, 12], [140, 122, 12]].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

function HairFront({ id, look }: { id: CompanionId; look: Look }) {
  switch (id) {
    case "mia":
      return (
        <g>
          <path d="M63 94 C58 60 76 37 103 37 C128 37 142 56 139 86 C133 66 119 56 105 54 C97 67 81 80 63 94 Z" fill={look.hair} />
          <path d="M63 94 C61 112 63 132 70 148 C66 128 66 110 71 93 Z" fill={look.hair} />
          <path d="M106 44 C120 46 132 56 136 72" stroke={look.hairLight} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.8} />
          <circle cx={63} cy={116} r={2.6} fill="#E8C26A" />
          <circle cx={137} cy={116} r={2.6} fill="#E8C26A" />
        </g>
      );
    case "kai":
      return (
        <g>
          <path d="M63 86 C59 60 68 41 88 36 C99 30 117 30 127 38 C137 46 141 63 137 84 C134 71 128 63 118 60 C108 56 94 56 84 58 C74 61 67 71 63 86 Z" fill={look.hair} />
          <path d="M82 44 C90 31 112 27 126 37 C114 34 100 36 90 45 Z" fill={look.hairLight} />
          <path d="M64 88 C64 78 66 72 69 68 L68 86 Z M136 88 C136 78 134 72 131 68 L132 86 Z" fill={look.hairLight} opacity={0.6} />
          <path d="M70 112 C74 128 86 140 100 141 C114 140 126 128 130 112 C124 124 113 132 100 132 C87 132 76 124 70 112 Z" fill={look.hair} opacity={0.14} />
        </g>
      );
    case "theo":
      return (
        <g>
          <path d="M64 86 C60 56 76 37 100 36 C124 36 141 54 136 86 C134 70 126 58 112 54 C98 50 81 56 71 66 C67 72 65 79 64 86 Z" fill={look.hair} />
          <path d="M78 52 C90 44 108 42 124 50" stroke={look.hairLight} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M66 104 C68 126 83 145 100 146 C117 145 132 126 134 104 C130 114 124 120 116 121 Q100 117 84 121 C76 120 70 114 66 104 Z" fill={look.hair} />
          <path d="M87 118.5 Q100 112.5 113 118.5 Q100 116.5 87 118.5 Z" fill={look.hair} />
          <g stroke="#2F2F35" strokeWidth={2.2} fill="none">
            <rect x={73} y={87} width={24} height={16} rx={5} />
            <rect x={103} y={87} width={24} height={16} rx={5} />
            <path d="M97 93 Q100 91 103 93" />
            <path d="M73 92 L65 90 M127 92 L135 90" />
          </g>
        </g>
      );
    case "pip":
      return (
        <g>
          <g fill={look.hair}>
            {[[78, 58, 12], [92, 52, 12], [108, 51, 12], [122, 58, 11], [68, 70, 10], [132, 70, 10]].map(([x, y, r]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
            ))}
          </g>
          <g fill="none" stroke={look.hairLight} strokeWidth={2} strokeLinecap="round" opacity={0.85}>
            <path d="M86 50 Q92 46 98 50" /><path d="M104 48 Q110 45 116 50" /><path d="M128 40 Q134 44 136 50" />
          </g>
          <g fill="#C2643A" opacity={0.5}>
            <circle cx={80} cy={106} r={1.3} /><circle cx={85} cy={109} r={1.3} /><circle cx={77} cy={111} r={1.3} />
            <circle cx={120} cy={106} r={1.3} /><circle cx={115} cy={109} r={1.3} /><circle cx={123} cy={111} r={1.3} />
          </g>
          <circle cx={63} cy={118} r={4} fill="none" stroke="#E8C26A" strokeWidth={1.6} />
          <circle cx={137} cy={118} r={4} fill="none" stroke="#E8C26A" strokeWidth={1.6} />
        </g>
      );
  }
}

function Heart({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 6 C-9 0 -6 -8 0 -3 C6 -8 9 0 0 6 Z"
      fill="#E5484D"
    />
  );
}

export function CompanionAvatar({
  companion, mood, size = 64, className, title,
}: { companion: CompanionId; mood: Mood; size?: number; className?: string; title?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const look = LOOK[companion];
  const blush = mood === "love" || mood === "happy" || mood === "hello";
  const face = look.feminine ? FACE_SOFT : FACE_SQUARE;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={title} className={cn("shrink-0", className)}>
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={`c${uid}`}><circle cx={100} cy={100} r={100} /></clipPath>
      </defs>
      <g clipPath={`url(#c${uid})`}>
        <circle cx={100} cy={100} r={100} fill={look.bg} />
        <g transform="translate(100 124) scale(1.17) translate(-100 -124)">
        <HairBack id={companion} look={look} />
        <path d="M85 124 L85 164 Q100 172 115 164 L115 124 Z" fill={look.skin} />
        <Body id={companion} look={look} />
        <path d="M85 136 Q100 150 115 136 L115 128 L85 128 Z" fill={look.shade} opacity={0.55} />
        <ellipse cx={63} cy={101} rx={7} ry={11} fill={look.skin} />
        <ellipse cx={137} cy={101} rx={7} ry={11} fill={look.skin} />
        <path d={face} fill={look.skin} />
        {blush && (
          <g fill="#F28B9B" opacity={0.35}>
            <ellipse cx={79} cy={111} rx={8} ry={4.5} />
            <ellipse cx={121} cy={111} rx={8} ry={4.5} />
          </g>
        )}
        <Brows mood={mood} look={look} />
        <Eye cx={85} mood={mood} look={look} clipId={`l${uid}`} right={false} />
        <Eye cx={115} mood={mood} look={look} clipId={`r${uid}`} right />
        <path d="M101 99 Q99 108 95 112 Q99 114.5 104 112.5" stroke={look.shade} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <HairFront id={companion} look={look} />
        <Mouth mood={mood} look={look} />
        {mood === "sad" && <path d="M126 99 Q122.5 106 126 108.5 Q129.5 106 126 99 Z" fill="#7CC0F0" />}
        {mood === "worried" && <path d="M141 70 Q137 77 141 80 Q145 77 141 70 Z" fill="#7CC0F0" />}
        </g>
        {mood === "love" && (
          <g>
            <Heart x={160} y={44} s={1.4} />
            <Heart x={176} y={68} s={1} />
            <Heart x={34} y={56} s={0.9} />
          </g>
        )}
      </g>
    </svg>
  );
}
