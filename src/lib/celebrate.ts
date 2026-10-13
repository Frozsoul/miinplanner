/**
 * Small confetti burst for finishing a task. No dependencies, cleans up after itself,
 * and does nothing for users who prefer reduced motion.
 */
const COLORS = ["#ffce00", "#22c55e", "#3b82f6", "#f97316", "#ec4899", "#a855f7"];

export function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";

  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.35;

  for (let i = 0; i < 36; i++) {
    const piece = document.createElement("span");
    const size = 6 + Math.random() * 6;
    const angle = Math.random() * Math.PI * 2;
    const distance = 120 + Math.random() * 220;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance + 160; // drift down
    piece.style.cssText = [
      "position:absolute",
      `left:${originX}px`,
      `top:${originY}px`,
      `width:${size}px`,
      `height:${size * 0.6}px`,
      `background:${COLORS[i % COLORS.length]}`,
      "border-radius:2px",
      "opacity:1",
    ].join(";");
    piece.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" },
    );
    layer.appendChild(piece);
  }

  document.body.appendChild(layer);
  window.setTimeout(() => layer.remove(), 1600);
}
