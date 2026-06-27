"use client";

import { useMemo, useState } from "react";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { useUIStore } from "@/lib/store/useUIStore";
import { getShopCatalog, listThemes } from "@/features/content/loader";
import { canAccess } from "@/features/entitlement/canAccess";
import { backgroundStageForGrowth } from "@/lib/scene";
import { defaultAmbiencePreset, newId } from "@/lib/store/defaults";
import { Button, FieldLabel, Pill, Toggle } from "@/features/design/kit";
import type { AmbienceLayerId, AmbienceLayerSetting, ShopItem, ThemePack } from "@/lib/types";

const LAYER_LABEL: Record<AmbienceLayerId, string> = {
  rain: "Rain",
  wind: "Wind",
  brownNoise: "Brown noise",
  cafeHum: "Cafe hum",
};

function LayerRow({
  layer,
  onChange,
}: {
  layer: AmbienceLayerSetting;
  onChange: (layer: AmbienceLayerSetting) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Toggle on={layer.enabled} onClick={() => onChange({ ...layer, enabled: !layer.enabled })} label={LAYER_LABEL[layer.id]} />
      <div className="min-w-0 flex-1">
        <div style={{ font: "600 14px var(--font-body)", color: "var(--ink)" }}>{LAYER_LABEL[layer.id]}</div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={layer.volume}
          onChange={(e) => onChange({ ...layer, volume: Number(e.target.value) })}
          className="w-full"
        />
      </div>
      <span style={{ font: "600 11px var(--font-mono)", color: "var(--ink-mut)" }}>{Math.round(layer.volume * 100)}%</span>
    </div>
  );
}

export function AmbienceStudio() {
  const presets = useWispalStore((s) => s.ambiencePresets);
  const activeAmbienceId = useWispalStore((s) => s.activeAmbienceId);
  const profile = useWispalStore((s) => s.profile);
  const inventory = useWispalStore((s) => s.inventory);
  const world = useWispalStore((s) => s.world);
  const setTheme = useWispalStore((s) => s.setTheme);
  const setActiveAmbience = useWispalStore((s) => s.setActiveAmbience);
  const saveAmbiencePreset = useWispalStore((s) => s.saveAmbiencePreset);
  const updateActiveAmbience = useWispalStore((s) => s.updateActiveAmbience);
  const flash = useUIStore((s) => s.flash);
  const [name, setName] = useState("");
  const themes = listThemes();
  const catalog = getShopCatalog();
  const themeItems = useMemo(() => new Map(catalog.filter((item) => item.type === "theme").map((item) => [item.packId, item])), [catalog]);
  const groupedThemes = useMemo(
    () => ({
      Aesthetic: themes.filter((theme) => theme.styleFamily === "aesthetic"),
      Pixel: themes.filter((theme) => theme.styleFamily === "pixel"),
    }),
    [themes],
  );
  const preset = useMemo(
    () =>
      presets.find((p) => p.id === activeAmbienceId) ??
      presets[0] ??
      defaultAmbiencePreset(),
    [activeAmbienceId, presets],
  );

  const setLayer = (layer: AmbienceLayerSetting) => {
    updateActiveAmbience({
      layers: preset.layers.map((l) => (l.id === layer.id ? layer : l)),
      muted: false,
    });
  };

  const saveCopy = () => {
    const now = new Date().toISOString();
    saveAmbiencePreset({
      ...preset,
      id: newId(),
      name: name.trim() || `${preset.name} copy`,
      createdAt: now,
      updatedAt: now,
    });
    setName("");
  };

  const themeOwnership = (theme: ThemePack): { item?: ShopItem; unlocked: boolean; reason?: string } => {
    const item = themeItems.get(theme.id);
    if (!item) return { unlocked: true };
    if (world.themeId === item.packId) return { item, unlocked: true };
    if (!canAccess(item, profile)) return { item, unlocked: false, reason: "Plus" };
    if (item.price === 0) return { item, unlocked: true };
    if (inventory.some((owned) => owned.id === item.id)) return { item, unlocked: true };
    return { item, unlocked: false, reason: `${item.price} sparks` };
  };

  const selectTheme = (theme: ThemePack) => {
    const ownership = themeOwnership(theme);
    if (!ownership.unlocked) {
      flash(
        ownership.reason === "Plus"
          ? "That scene is part of Wispal Plus - coming soon."
          : "Unlock that scene in the Wisp shop first.",
      );
      return;
    }
    setTheme(theme.id);
    updateActiveAmbience({ themeId: theme.id });
  };

  return (
    <div>
      <h2 className="mb-1" style={{ font: "600 24px var(--font-head)", color: "var(--ink)" }}>Ambience studio</h2>
      <p className="mb-5" style={{ font: "500 13px/1.5 var(--font-body)", color: "var(--ink-dim)" }}>
        Save quiet mixes for different kinds of study blocks.
      </p>

      <FieldLabel>Presets</FieldLabel>
      <div className="mb-5 flex flex-wrap gap-2">
        {presets.map((p) => (
          <Pill key={p.id} active={p.id === preset.id} onClick={() => setActiveAmbience(p.id)}>
            {p.name}
          </Pill>
        ))}
      </div>

      <FieldLabel>Background gallery</FieldLabel>
      <div className="mb-5 space-y-4">
        {Object.entries(groupedThemes).map(([group, groupThemes]) => (
          <section key={group} className="theme-gallery" aria-label={`${group} backgrounds`}>
            <div className="theme-gallery__header">{group}</div>
            <div className="theme-gallery__grid">
              {groupThemes.map((theme) => {
                const stage = backgroundStageForGrowth(theme, world.growthPoints);
                const ownership = themeOwnership(theme);
                const active = world.themeId === theme.id || preset.themeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    className={`theme-card ${active ? "theme-card--active" : ""} ${ownership.unlocked ? "" : "theme-card--locked"}`}
                    aria-pressed={active}
                    aria-disabled={!ownership.unlocked}
                    onClick={() => selectTheme(theme)}
                  >
                    {stage?.src ? (
                      <img src={stage.src} alt="" className="theme-card__image" draggable={false} />
                    ) : (
                      <span className="theme-card__fallback" aria-hidden />
                    )}
                    <span className="theme-card__shade" />
                    <span className="theme-card__meta">
                      <span className="theme-card__name">{theme.name}</span>
                      <span className="theme-card__sub">
                        Stage {stage?.stage ?? 0} / {theme.renderer === "image" ? "image" : "pixel"}
                      </span>
                    </span>
                    {!ownership.unlocked && <span className="theme-card__lock">{ownership.reason}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="ds-card" style={{ padding: "4px 16px" }}>
        <div className="flex items-center justify-between gap-3 py-3">
          <div>
            <div style={{ font: "600 14px var(--font-body)", color: "var(--ink)" }}>Muted</div>
            <div style={{ font: "500 12px var(--font-body)", color: "var(--ink-mut)" }}>Audio starts only after you enable it.</div>
          </div>
          <Toggle on={preset.muted} onClick={() => updateActiveAmbience({ muted: !preset.muted })} label="Muted" />
        </div>
        <div className="py-3">
          <div className="mb-1 flex justify-between" style={{ font: "600 12px var(--font-mono)", color: "var(--ink-mut)" }}>
            <span>Master</span>
            <span>{Math.round(preset.masterVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={preset.masterVolume}
            onChange={(e) => updateActiveAmbience({ masterVolume: Number(e.target.value), muted: false })}
            className="w-full"
          />
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border-2)" }}>
          {preset.layers.map((layer) => (
            <LayerRow key={layer.id} layer={layer} onChange={setLayer} />
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Preset name"
          className="ds-input"
        />
        <Button variant="secondary" onClick={saveCopy}>
          Save
        </Button>
      </div>
    </div>
  );
}
