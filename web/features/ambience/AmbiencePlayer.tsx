"use client";

import { useEffect, useMemo } from "react";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { defaultAmbiencePreset } from "@/lib/store/defaults";
import type { AmbienceLayerId } from "@/lib/types";

function makeNoiseBuffer(ctx: AudioContext, id: AmbienceLayerId) {
  const seconds = 2;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = id === "brownNoise" ? (last + 0.02 * white) / 1.02 : white;
    data[i] = id === "brownNoise" ? last * 3.5 : white * 0.65;
  }
  return buffer;
}

function filterFor(ctx: AudioContext, id: AmbienceLayerId) {
  const filter = ctx.createBiquadFilter();
  if (id === "rain") {
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    filter.Q.value = 0.7;
  } else if (id === "wind") {
    filter.type = "lowpass";
    filter.frequency.value = 450;
    filter.Q.value = 0.4;
  } else if (id === "cafeHum") {
    filter.type = "lowpass";
    filter.frequency.value = 180;
    filter.Q.value = 0.6;
  } else {
    filter.type = "lowpass";
    filter.frequency.value = 260;
  }
  return filter;
}

export function AmbiencePlayer() {
  const presets = useWispalStore((s) => s.ambiencePresets);
  const activeAmbienceId = useWispalStore((s) => s.activeAmbienceId);
  const preset = useMemo(
    () =>
      presets.find((p) => p.id === activeAmbienceId) ??
      presets[0] ??
      defaultAmbiencePreset(),
    [activeAmbienceId, presets],
  );

  useEffect(() => {
    const enabled = preset.layers.filter((l) => l.enabled && l.volume > 0);
    if (preset.muted || preset.masterVolume <= 0 || enabled.length === 0) return;

    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = Math.max(0, Math.min(1, preset.masterVolume)) * 0.35;
    master.connect(ctx.destination);
    void ctx.resume();

    const sources = enabled.map((layer) => {
      const source = ctx.createBufferSource();
      source.buffer = makeNoiseBuffer(ctx, layer.id);
      source.loop = true;
      const gain = ctx.createGain();
      const filter = filterFor(ctx, layer.id);
      gain.gain.value = Math.max(0, Math.min(1, layer.volume));
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start();
      return source;
    });

    return () => {
      for (const source of sources) {
        try {
          source.stop();
        } catch {
          /* already stopped */
        }
      }
      void ctx.close();
    };
  }, [preset.id, preset.muted, preset.masterVolume, JSON.stringify(preset.layers)]);

  return null;
}
