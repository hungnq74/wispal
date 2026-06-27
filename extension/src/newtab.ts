/**
 * New-tab page script. Embeds the webapp and bridges the extension's chrome.idle
 * presence into the iframe via postMessage. The webapp's presence monitor consumes
 * these messages; without the extension it falls back to the Page Visibility API, so
 * the webapp also works standalone (spec §2 / §5).
 */

const APP_URL = __APP_URL__;
const frame = document.getElementById("app") as HTMLIFrameElement;
frame.src = APP_URL;

type PresenceState = "active" | "idle" | "locked";

function forward(state: PresenceState) {
  frame.contentWindow?.postMessage(
    { source: "wispal-extension", kind: "presence", state },
    APP_URL,
  );
}

// Relay live changes from the background worker.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.source === "wispal-extension" && msg.kind === "presence") {
    forward(msg.state as PresenceState);
  }
});

window.addEventListener("message", (event) => {
  if (event.origin !== new URL(APP_URL).origin) return;
  const msg = event.data;
  if (msg?.source !== "wispal-web") return;
  chrome.runtime.sendMessage(msg).catch(() => {
    /* Background worker may be waking; the web app remains local-first. */
  });
});

// Push the current state once the iframe has loaded (so the buddy starts in sync).
frame.addEventListener("load", () => {
  chrome.idle.queryState(60, (state) => forward(state));
});
