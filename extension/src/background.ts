/**
 * Background service worker (MV3). Its ONLY job is to watch chrome.idle and broadcast a
 * coarse presence status to the new-tab page. It never reads tab URLs, page content,
 * history, or keystrokes (spec §5 privacy rule) — just active / idle / locked.
 */

const IDLE_SECONDS = 60;
const RULE_BASE = 7000;

type FocusGateProfile = {
  id: string;
  mode: "soft" | "strict";
  enabled: boolean;
  activeOnlyDuringSessions: boolean;
  blocklist: string[];
  allowlist: string[];
  bypassMinutes: number;
  bypassUntil?: number | null;
};

type GateState = {
  activeSession: boolean;
  gate: FocusGateProfile | null;
};

const DEFAULT_STATE: GateState = { activeSession: false, gate: null };

function broadcast(state: chrome.idle.IdleState) {
  // active | idle | locked → the webapp only cares active vs not.
  chrome.runtime
    .sendMessage({ source: "wispal-extension", kind: "presence", state })
    .catch(() => {
      // No new-tab page open to receive it — fine, it's fire-and-forget.
    });
}

chrome.idle.setDetectionInterval(IDLE_SECONDS);
chrome.idle.onStateChanged.addListener(broadcast);

function cleanDomain(input: string) {
  return input
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

async function readState(): Promise<GateState> {
  const stored = await chrome.storage.local.get(["gateState"]);
  return { ...DEFAULT_STATE, ...(stored.gateState as Partial<GateState> | undefined) };
}

async function writeState(state: GateState) {
  await chrome.storage.local.set({ gateState: state });
}

async function clearRules() {
  const existing = await chrome.declarativeNetRequest.getSessionRules();
  const ids = existing.filter((r) => r.id >= RULE_BASE && r.id < RULE_BASE + 1000).map((r) => r.id);
  if (ids.length) await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: ids });
}

function ruleForDomain(domain: string, offset: number, action: "allow" | "redirect"): chrome.declarativeNetRequest.Rule {
  return {
    id: RULE_BASE + offset,
    priority: action === "allow" ? 2 : 1,
    action:
      action === "allow"
        ? { type: "allow" }
        : { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
    condition: {
      urlFilter: `||${domain}^`,
      resourceTypes: ["main_frame" as chrome.declarativeNetRequest.ResourceType],
    },
  };
}

async function applyGateRules() {
  const state = await readState();
  await clearRules();
  const gate = state.gate;
  if (!gate?.enabled || gate.mode !== "strict") return;
  if (gate.activeOnlyDuringSessions && !state.activeSession) return;
  if (gate.bypassUntil && gate.bypassUntil > Date.now()) {
    setTimeout(() => void applyGateRules(), gate.bypassUntil - Date.now() + 250);
    return;
  }

  const allow = gate.allowlist.map(cleanDomain).filter(Boolean);
  const block = gate.blocklist.map(cleanDomain).filter(Boolean);
  const rules = [
    ...allow.map((domain, i) => ruleForDomain(domain, i, "allow")),
    ...block.map((domain, i) => ruleForDomain(domain, allow.length + i, "redirect")),
  ];
  if (rules.length) await chrome.declarativeNetRequest.updateSessionRules({ addRules: rules });
}

chrome.runtime.onInstalled.addListener(() => {
  void applyGateRules();
});

chrome.runtime.onStartup.addListener(() => {
  void applyGateRules();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.source !== "wispal-extension" && msg?.source !== "wispal-web") return false;

  void (async () => {
    const state = await readState();
    if (msg.kind === "wispal.session.started") {
      state.activeSession = true;
      state.gate = msg.gate as FocusGateProfile;
    } else if (msg.kind === "wispal.session.ended") {
      state.activeSession = false;
    } else if (msg.kind === "wispal.gate.updated") {
      state.gate = msg.gate as FocusGateProfile;
    } else if (msg.kind === "wispal.gate.bypass") {
      const minutes = Number(msg.minutes) || state.gate?.bypassMinutes || 5;
      if (state.gate) state.gate = { ...state.gate, bypassUntil: Date.now() + minutes * 60000 };
    }
    await writeState(state);
    await applyGateRules();
    sendResponse({ ok: true });
  })();
  return true;
});
