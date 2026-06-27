document.getElementById("bypass")?.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({
    source: "wispal-extension",
    kind: "wispal.gate.bypass",
    minutes: 5,
  });
  history.back();
});
