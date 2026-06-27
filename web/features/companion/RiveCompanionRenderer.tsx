"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import type { BondTier, CompanionMood, PetAction, PetNeedState, PetRuntimeState } from "@/lib/types";
import { tierRank } from "@/lib/bond";

const MACHINE = "WispalPetMachine";
const SRC = "/rive/wispal_pet_v1.riv";

const MOOD_NUMBER: Record<CompanionMood, number> = {
  idle: 0,
  greeting: 1,
  welcomeBack: 2,
  studying: 3,
  celebrating: 4,
  sleepy: 5,
  tired: 6,
  resting: 7,
};

function setInput(input: { value: number | boolean } | null, value: number | boolean) {
  if (input) input.value = value;
}

export function RiveCompanionRenderer({
  mood,
  bondTier,
  needs,
  activeAction,
  activeActionAt,
  activeRuntime,
  roomX,
  hovered,
  pointerNear,
  cursor,
  fallback,
}: {
  mood: CompanionMood;
  bondTier: BondTier;
  needs: PetNeedState;
  activeAction: PetAction | null;
  activeActionAt: number | null;
  activeRuntime: PetRuntimeState | null;
  roomX: number;
  hovered: boolean;
  pointerNear: boolean;
  cursor: { x: number; y: number };
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const { rive, RiveComponent } = useRive({
    src: SRC,
    artboard: "WispalPet",
    stateMachines: MACHINE,
    autoplay: true,
    onLoadError: () => {
      setFailed(true);
      if (process.env.NODE_ENV !== "production") {
        console.warn(`Wispal Rive asset missing or invalid: ${SRC}. Pixel fallback is active.`);
      }
    },
  });

  const isStudying = useStateMachineInput(rive, MACHINE, "isStudying", mood === "studying");
  const isIdleUser = useStateMachineInput(rive, MACHINE, "isIdleUser", mood === "sleepy");
  const isTired = useStateMachineInput(rive, MACHINE, "isTired", mood === "tired");
  const isResting = useStateMachineInput(rive, MACHINE, "isResting", mood === "resting");
  const isHovered = useStateMachineInput(rive, MACHINE, "isHovered", hovered);
  const isPointerNear = useStateMachineInput(rive, MACHINE, "isPointerNear", pointerNear);
  const moodInput = useStateMachineInput(rive, MACHINE, "mood", MOOD_NUMBER[mood]);
  const bondInput = useStateMachineInput(rive, MACHINE, "bondTier", tierRank(bondTier));
  const energyInput = useStateMachineInput(rive, MACHINE, "energy", needs.energy);
  const cursorXInput = useStateMachineInput(rive, MACHINE, "cursorX", cursor.x);
  const cursorYInput = useStateMachineInput(rive, MACHINE, "cursorY", cursor.y);
  const roomXInput = useStateMachineInput(rive, MACHINE, "roomX", roomX);
  const targetXInput = useStateMachineInput(rive, MACHINE, "targetX", activeRuntime?.targetX ?? roomX);
  const targetYInput = useStateMachineInput(rive, MACHINE, "targetY", activeRuntime?.targetY ?? 0.5);

  const tap = useStateMachineInput(rive, MACHINE, "tap");
  const pet = useStateMachineInput(rive, MACHINE, "pet");
  const feed = useStateMachineInput(rive, MACHINE, "feed");
  const dance = useStateMachineInput(rive, MACHINE, "dance");
  const jump = useStateMachineInput(rive, MACHINE, "jump");
  const wave = useStateMachineInput(rive, MACHINE, "wave");
  const celebrate = useStateMachineInput(rive, MACHINE, "celebrate");
  const questDone = useStateMachineInput(rive, MACHINE, "questDone");
  const flowHit = useStateMachineInput(rive, MACHINE, "flowHit");
  const goalHit = useStateMachineInput(rive, MACHINE, "goalHit");
  const restAccepted = useStateMachineInput(rive, MACHINE, "restAccepted");
  const giftReceived = useStateMachineInput(rive, MACHINE, "giftReceived");
  const equipChanged = useStateMachineInput(rive, MACHINE, "equipChanged");
  const roomEnter = useStateMachineInput(rive, MACHINE, "roomEnter");

  const triggers = useMemo(
    () => ({
      tap,
      pet,
      feed,
      dance,
      jump,
      wave,
      celebrate,
      questDone,
      flowHit,
      goalHit,
      restAccepted,
      giftReceived,
      equipChanged,
      roomEnter,
    }),
    [celebrate, dance, equipChanged, feed, flowHit, giftReceived, goalHit, jump, pet, questDone, restAccepted, roomEnter, tap, wave],
  );

  useEffect(() => {
    setInput(isStudying, mood === "studying");
    setInput(isIdleUser, mood === "sleepy");
    setInput(isTired, mood === "tired");
    setInput(isResting, mood === "resting");
    setInput(isHovered, hovered);
    setInput(isPointerNear, pointerNear);
    setInput(moodInput, MOOD_NUMBER[mood]);
    setInput(bondInput, tierRank(bondTier));
    setInput(energyInput, needs.energy);
    setInput(cursorXInput, cursor.x);
    setInput(cursorYInput, cursor.y);
    setInput(roomXInput, roomX);
    setInput(targetXInput, activeRuntime?.targetX ?? roomX);
    setInput(targetYInput, activeRuntime?.targetY ?? 0.5);
  }, [
    activeRuntime?.targetX,
    activeRuntime?.targetY,
    bondInput,
    bondTier,
    cursor.x,
    cursor.y,
    cursorXInput,
    cursorYInput,
    energyInput,
    hovered,
    isHovered,
    isIdleUser,
    isPointerNear,
    isResting,
    isStudying,
    isTired,
    mood,
    moodInput,
    needs.energy,
    pointerNear,
    roomX,
    roomXInput,
    targetXInput,
    targetYInput,
  ]);

  useEffect(() => {
    if (!activeAction || !activeActionAt) return;
    const trigger = triggers[activeAction.riveTrigger as keyof typeof triggers];
    trigger?.fire();
  }, [activeAction, activeActionAt, triggers]);

  if (failed || !rive) return <>{fallback}</>;

  return (
    <div className="h-[190px] w-[220px]" aria-label={`rive companion: ${mood}`}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
