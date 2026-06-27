/**
 * The limbed companion rig — a port of `buildChar()` from "Wispal Companion Animator.dc.html".
 *
 * Composed pets are drawn as four separately-animated layers (body + 2 arms + 2 legs) so
 * they can idle, walk, hop and dance instead of just floating. The body grid is the same
 * 12×16 sprite the rest of the app rasterises; arms (`ARM`) and legs (`FOOT`) reuse the
 * pet's own palette so they're auto-coloured. Each mode assigns a CSS keyframe (defined in
 * globals.css as `pet-rig-*`) to each limb; the timing lives here so modes stay flexible.
 *
 * Cross-stage roaming is intentionally left to `.pet-positioner` in the renderer — this rig
 * animates in place and never translates the whole container (the old `a_stroll` move).
 */
import { PixelSprite, type Palette } from "@/features/design/pixel";

export type RigMode = "idle" | "study" | "walk" | "hop" | "dance" | "sleepy" | "tired" | "rest" | "wave";

const FOOT = [".oo.", "obbo", "oooo"];
const ARM = ["obo", "obo", "obo", "obb"];

interface ModeAnim {
  cont: string;
  bob: string;
  body: string;
  armL: string;
  armR: string;
  legL: string;
  legR: string;
}

const ANIM: Record<RigMode, ModeAnim> = {
  idle: { cont: "", bob: "pet-rig-bob 3.2s ease-in-out infinite", body: "", armL: "pet-rig-armidle 3.2s ease-in-out infinite", armR: "pet-rig-armidle 3.2s ease-in-out infinite .3s", legL: "", legR: "" },
  study: { cont: "", bob: "pet-rig-bobw 2.6s ease-in-out infinite", body: "", armL: "pet-rig-armidle 2.6s ease-in-out infinite", armR: "pet-rig-armidle 2.6s ease-in-out infinite .3s", legL: "", legR: "" },
  walk: { cont: "", bob: "pet-rig-bobw .5s ease-in-out infinite", body: "", armL: "pet-rig-swing .5s ease-in-out infinite", armR: "pet-rig-swing .5s ease-in-out infinite .25s", legL: "pet-rig-step .5s ease-in-out infinite", legR: "pet-rig-step .5s ease-in-out infinite .25s" },
  hop: { cont: "pet-rig-hop 1.1s ease-in-out infinite", bob: "", body: "pet-rig-squash 1.1s ease-in-out infinite", armL: "pet-rig-armup 1.1s ease-in-out infinite", armR: "pet-rig-armup 1.1s ease-in-out infinite", legL: "pet-rig-tuck 1.1s ease-in-out infinite", legR: "pet-rig-tuck 1.1s ease-in-out infinite" },
  dance: { cont: "pet-rig-side .8s ease-in-out infinite", bob: "", body: "pet-rig-wiggle .8s ease-in-out infinite", armL: "pet-rig-dancearm .8s ease-in-out infinite", armR: "pet-rig-dancearm .8s ease-in-out infinite .4s", legL: "pet-rig-tap .8s ease-in-out infinite", legR: "pet-rig-tap .8s ease-in-out infinite .4s" },
  sleepy: { cont: "", bob: "pet-rig-bob 5.5s ease-in-out infinite", body: "", armL: "", armR: "", legL: "pet-rig-tuck 5.5s ease-in-out infinite", legR: "pet-rig-tuck 5.5s ease-in-out infinite" },
  tired: { cont: "", bob: "pet-rig-bobw 4s ease-in-out infinite", body: "pet-rig-droop 4s ease-in-out infinite", armL: "", armR: "", legL: "", legR: "" },
  rest: { cont: "", bob: "pet-rig-bob 4.8s ease-in-out infinite", body: "pet-rig-squash 4.8s ease-in-out infinite", armL: "", armR: "", legL: "pet-rig-tuck 4.8s ease-in-out infinite", legR: "pet-rig-tuck 4.8s ease-in-out infinite" },
  wave: { cont: "", bob: "pet-rig-bob 1.6s ease-in-out infinite", body: "", armL: "pet-rig-armup .6s ease-in-out infinite", armR: "pet-rig-armidle 2.6s ease-in-out infinite", legL: "", legR: "" },
};

function Limb({ sprite, left, top, animation, origin }: { sprite: React.ReactNode; left: number; top: number; animation: string; origin?: string }) {
  return (
    <div style={{ position: "absolute", left, top, animation: animation || undefined, transformOrigin: origin ?? "center" }}>
      {sprite}
    </div>
  );
}

export function LimbedCompanion({
  grid,
  palette,
  unit = 9,
  mode = "idle",
}: {
  grid: string[];
  palette: Palette;
  unit?: number;
  mode?: RigMode;
}) {
  const U = unit;
  const A = ANIM[mode] ?? ANIM.idle;
  const body = <PixelSprite grid={grid} palette={palette} unit={U} />;
  const foot = <PixelSprite grid={FOOT} palette={palette} unit={U} />;
  const arm = <PixelSprite grid={ARM} palette={palette} unit={U} />;
  const w = 12 * U;
  const h = 16 * U;

  return (
    <div style={{ position: "relative", width: w, height: h, animation: A.cont || undefined }}>
      <div style={{ position: "relative", width: w, height: h, animation: A.bob || undefined }}>
        <Limb sprite={arm} left={0.3 * U} top={7.6 * U} animation={A.armL} origin="top center" />
        <Limb sprite={arm} left={8.7 * U} top={7.6 * U} animation={A.armR} origin="top center" />
        <Limb sprite={foot} left={2.5 * U} top={12.4 * U} animation={A.legL} />
        <Limb sprite={foot} left={6.5 * U} top={12.4 * U} animation={A.legR} />
        <div style={{ position: "absolute", left: 0, top: 0, animation: A.body || undefined, transformOrigin: "bottom center" }}>{body}</div>
      </div>
    </div>
  );
}
