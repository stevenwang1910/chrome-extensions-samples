chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: 'OFF'
  });
});

chrome.action.onClicked.addListener(async (tab) => {
  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  const nextState = prevState === 'ON' ? 'OFF' : 'ON';

  await chrome.action.setBadgeText({
    tabId: tab.id,
    text: nextState
  });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: toggleReaderMode,
    args: [nextState === 'ON']
  });
});

function toggleReaderMode(enable) {
  if (typeof window.toggleNetEaseReaderMode === 'function') {
    window.toggleNetEaseReaderMode(enable);
  } else {
    const event = new CustomEvent('toggle-reader-mode', { detail: { enable } });
    document.dispatchEvent(event);
  }
}
