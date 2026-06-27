"use client";

import { useEffect, useRef, useState } from "react";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { starCount, seeded, NIGHT_MILESTONES } from "@/lib/world";
import { getThemePack } from "@/features/content/loader";
import { backgroundStageForGrowth, stageForGrowth } from "@/lib/scene";
import type { DecorPlacement, ThemeBackgroundStage, ThemePack, ThemeRenderer } from "@/lib/types";

/**
 * StudySceneCanvas: image-first study scenes with the original deterministic pixel world
 * preserved as a first-class pixel renderer/fallback.
 */

const VB_W = 1000;
const VB_H = 560;
const GROUND_Y = 400;

function Pine({ x, scale }: { x: number; scale: number }) {
  const h = 90 * scale;
  const w = 34 * scale;
  return (
    <g transform={`translate(${x} ${GROUND_Y})`} fill="#0c1322">
      <polygon points={`0,${-h} ${-w},${-h * 0.35} ${w},${-h * 0.35}`} />
      <polygon points={`0,${-h * 0.7} ${-w * 1.2},${0} ${w * 1.2},${0}`} />
      <rect x={-3} y={-2} width={6} height={10} fill="#0c1322" />
    </g>
  );
}

function ImageWorldRenderer({
  theme,
  stage,
  onImageError,
}: {
  theme: ThemePack;
  stage: ThemeBackgroundStage;
  onImageError: () => void;
}) {
  return (
    <div className="study-scene study-scene--image" aria-hidden>
      <img
        key={`${theme.id}-${stage.stage}-${stage.src}`}
        src={stage.src}
        alt=""
        className="study-scene__image"
        draggable={false}
        onError={() => {
          if (process.env.NODE_ENV !== "production") {
            console.warn(`[wispal] Missing background asset for ${theme.id} stage ${stage.stage}: ${stage.src}`);
          }
          onImageError();
        }}
      />
      <div className={`study-scene__overlay study-scene__overlay--${theme.overlayProfile}`} />
      <div className="study-scene__ui-scrim" />
    </div>
  );
}

function PixelWorldRenderer({ growth, decor }: { growth: number; decor: DecorPlacement[] }) {
  // Derive from growth directly (not persisted ids) so renaming milestones can't orphan it.
  const has = (id: string) => growth >= (NIGHT_MILESTONES.find((m) => m.id === id)?.at ?? Infinity);

  const unlockedCount = NIGHT_MILESTONES.filter((m) => growth >= m.at).length;
  const title = `Your night — ${growth} ${growth === 1 ? "block" : "blocks"} painted${unlockedCount ? `, ${unlockedCount} milestones` : ""}`;

  const count = starCount(growth);
  const stars = Array.from({ length: count }, (_, i) => ({
    x: 30 + seeded(i + 1) * (VB_W - 60),
    y: 24 + seeded(i + 51) * (GROUND_Y - 90),
    r: 0.8 + seeded(i + 101) * 1.8,
    accent: seeded(i + 151),
  }));

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
    {/* aurora (top milestone) */}
    {has("aurora") && (
      <g opacity={0.35}>
        <path d={`M0 90 Q 250 20 500 80 T 1000 70`} stroke="var(--wisp)" strokeWidth={40} fill="none" strokeLinecap="round" />
        <path d={`M0 140 Q 300 70 600 130 T 1000 120`} stroke="var(--bloom)" strokeWidth={30} fill="none" strokeLinecap="round" />
      </g>
    )}

    {/* moon */}
    {has("moon") && (
      <g transform="translate(150 110)">
        <circle r={44} fill="var(--glow)" opacity={0.92} />
        <circle cx={16} cy={-8} r={40} fill="var(--page-1)" />
      </g>
    )}

    {/* stars */}
    {stars.map((s, i) => (
      <circle
        key={i}
        cx={s.x}
        cy={s.y}
        r={s.r}
        fill={s.accent > 0.85 ? "var(--glow)" : s.accent > 0.7 ? "var(--wisp)" : "var(--ink)"}
        opacity={0.5 + seeded(i + 201) * 0.5}
      />
    ))}

    {/* constellation: faint links between the first few stars */}
    {has("constellation") && stars.length > 4 && (
      <polyline
        points={stars.slice(0, 5).map((s) => `${s.x},${s.y}`).join(" ")}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={0.8}
        opacity={0.25}
      />
    )}

    {/* shooting star */}
    {has("shooting-star") && (
      <g opacity={0.85}>
        <line x1={620} y1={70} x2={760} y2={140} stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" />
        <circle cx={760} cy={140} r={3} fill="var(--glow)" />
      </g>
    )}

    {/* rolling hills (theme-aware silhouettes) */}
    <path d={`M0 ${GROUND_Y} Q 250 ${GROUND_Y - 70} 520 ${GROUND_Y - 20} T 1000 ${GROUND_Y - 30} V ${VB_H} H 0 Z`} fill="color-mix(in srgb, var(--page-1) 78%, #000)" />
    <rect x={0} y={GROUND_Y + 30} width={VB_W} height={VB_H - GROUND_Y} fill="color-mix(in srgb, var(--page-1) 88%, #000)" />

    {/* pond */}
    {has("pond") && (
      <g>
        <ellipse cx={810} cy={GROUND_Y + 90} rx={130} ry={34} fill="var(--rest)" opacity={0.4} />
        <ellipse cx={780} cy={GROUND_Y + 82} rx={34} ry={7} fill="var(--ink)" opacity={0.3} />
      </g>
    )}

    {/* pine grove */}
    {has("pines") && (
      <>
        <Pine x={120} scale={1.1} />
        <Pine x={210} scale={0.8} />
        <Pine x={880} scale={1.0} />
        {growth >= 20 && <Pine x={300} scale={0.7} />}
      </>
    )}

    {/* lanterns */}
    {has("lanterns") &&
      [0, 1, 2].map((i) => (
        <g key={i} className="animate-breathe" style={{ animationDelay: `${i * 0.5}s` }}>
          <circle cx={360 + i * 150} cy={GROUND_Y + 24} r={9} fill="var(--ember)" opacity={0.5} />
          <circle cx={360 + i * 150} cy={GROUND_Y + 24} r={4} fill="var(--glow)" />
        </g>
      ))}

    {/* fireflies */}
    {has("fireflies") &&
      [0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          className="animate-bob"
          style={{ animationDelay: `${i * 0.4}s` }}
          cx={420 + i * 90}
          cy={300 + (i % 2) * 30}
          r={2.5}
          fill="var(--glow)"
          opacity={0.8}
        />
      ))}

    {/* placed decor: expression rewards, never productivity multipliers */}
    {decor.map((d) => (
      <g key={d.id} transform={`translate(${120 + d.x * 760} ${GROUND_Y + 38 + d.y * 105}) scale(${d.scale})`}>
        <rect x={-18} y={-18} width={36} height={28} rx={4} fill="var(--surface-2)" stroke="var(--border)" strokeWidth={2} />
        <circle cx={0} cy={-22} r={10} fill={d.itemId.includes("lantern") ? "var(--glow)" : "var(--bloom)"} opacity={0.82} />
        <rect x={-3} y={-12} width={6} height={20} fill="var(--ember)" opacity={0.65} />
      </g>
    ))}

      <title>{title}</title>
    </svg>
  );
}

function DecorHotspots({
  decor,
  renderer,
  onDecorClick,
}: {
  decor: DecorPlacement[];
  renderer: ThemeRenderer;
  onDecorClick: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-label="decor interactions">
      {decor.map((d) => {
        const left = renderer === "image" ? 18 + d.x * 64 : 12 + d.x * 76;
        const top = renderer === "image" ? 62 + d.y * 24 : 78.2 + d.y * 18.8;
        return (
          <button
            key={`${d.id}_hotspot`}
            type="button"
            className={`decor-hotspot pointer-events-auto ${renderer === "image" ? "decor-hotspot--image" : ""}`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              transform: `translate(-50%, -50%) scale(${Math.max(0.7, d.scale)})`,
            }}
            aria-label="show companion this decor"
            title="Show pet this decor"
            onClick={(event) => {
              event.stopPropagation();
              onDecorClick(d.id);
            }}
          />
        );
      })}
    </div>
  );
}

export function WorldCanvas() {
  const growth = useWispalStore((s) => s.world.growthPoints);
  const themeId = useWispalStore((s) => s.world.themeId);
  const decor = useWispalStore((s) => s.world.decorPlacements);
  const dispatchPetAction = useWispalStore((s) => s.dispatchPetAction);
  const theme = getThemePack(themeId);
  const stage = backgroundStageForGrowth(theme, growth);
  const computedStage = stage?.stage ?? stageForGrowth(growth).stage;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const previousStage = useRef<number | null>(null);
  const imageStage = theme?.renderer === "image" && stage && failedSrc !== stage.src ? stage : null;

  useEffect(() => {
    if (previousStage.current === null) {
      previousStage.current = computedStage;
      return;
    }
    if (computedStage > previousStage.current) {
      dispatchPetAction("complete_jump", { source: "system" });
    }
    previousStage.current = computedStage;
  }, [computedStage, dispatchPetAction]);

  return (
    <>
      {theme && imageStage ? (
        <ImageWorldRenderer theme={theme} stage={imageStage} onImageError={() => setFailedSrc(imageStage.src)} />
      ) : (
        <PixelWorldRenderer growth={growth} decor={decor} />
      )}
      <DecorHotspots
        decor={decor}
        renderer={theme?.renderer ?? "pixel"}
        onDecorClick={(id) => dispatchPetAction("decor_visit", { targetId: id, source: "decor" })}
      />
    </>
  );
}
