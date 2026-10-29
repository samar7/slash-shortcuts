'use strict';

import { DEFAULT_SHORTCUTS } from "./lib/constants/defaultShortcuts";
import { SHORTCUTS_STORAGE_KEY } from "./lib/constants/keys";
import { constructShortcutRules } from "./lib/utils/constructShortcutRules";
import { getSavedShortcuts } from "./lib/utils/getSavedShortcuts";
import Fuse from 'fuse.js'
import { SHORTCUT_PREFIX } from "./lib/constants/keys";

const defaultShortcuts = DEFAULT_SHORTCUTS
const fuseOptions = {
  includeScore: true,
  keys: ['shortlink']
}
let fuse = new Fuse(defaultShortcuts, fuseOptions)

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== "install" && details.reason !== "update") return;

  // persist default Shortcuts to local storage
  chrome.storage.local.set({ [SHORTCUTS_STORAGE_KEY]: JSON.stringify(defaultShortcuts) })
  // construct new rules on every installation
  const newRules = constructShortcutRules(defaultShortcuts)
  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  const oldRuleIds = oldRules.map(rule => rule.id);
  // add the new rules as declarativeNetRequest Dynamic rules, and remove old rules if there are any
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldRuleIds,
    addRules: newRules
  });
});

chrome.omnibox.onInputStarted.addListener(async function () {
  // on each input session, get all shortcuts and create a new fuse object with them
  const savedShortcuts = await getSavedShortcuts()
  fuse = new Fuse(savedShortcuts, fuseOptions)
});

chrome.omnibox.onInputChanged.addListener(async function (text, suggest) {
  // get fuse suggestions
  const suggestedShortcuts = fuse.search(text)

  // map fuse suggestions to omnibox suggestions
  const suggestions: chrome.omnibox.SuggestResult[] = suggestedShortcuts.map((shortcut) => {
    return {
      content: shortcut.item.shortlink, description: `${shortcut.item.shortlink} - <url>${shortcut.item.url}</url>`
    }
  })
  suggest(suggestions);
});

chrome.omnibox.onInputEntered.addListener(function (text, disposition) {
  // redirect to url in new tab
  const url = `http://${text}`
  switch (disposition) {
    case "currentTab":
      chrome.tabs.update({ url });
      break;
    case "newForegroundTab":
      chrome.tabs.create({ url });
      break;
    case "newBackgroundTab":
      chrome.tabs.create({ url, active: false });
      break;
  }
});

// If o/ is prefix and no shortcut with given name is saved then redirect to options page 
chrome.webRequest.onBeforeRequest.addListener((param) => {
  getSavedShortcuts().then((shortcuts) => {
    const savedShortcutNamesSet = new Set(shortcuts.map((shortcut) => shortcut.shortlink))
    const requestUrl = new URL(param.url)
    if (requestUrl.searchParams.has('q')) {
      const queryValue = requestUrl.searchParams.get('q') ?? ''
      if (queryValue.startsWith(SHORTCUT_PREFIX)) {
        // unknown names fall through to the normal search
        if (savedShortcutNamesSet.has(queryValue)) {
          const url = shortcuts.find((shortcut) => shortcut.shortlink === queryValue)?.url ?? ''
          chrome.tabs.update({ url })
        }
      }
    }
    else if (!SHORTCUT_PREFIX.startsWith('/') && param.url.startsWith(`http://${SHORTCUT_PREFIX}`)) {
      const requestShortcutName = param.url.replace('http://', '')
      if (!savedShortcutNamesSet.has(requestShortcutName)) {
        chrome.tabs.update({ url: '/option.html' })
      }
    }
  })
}, { urls: SHORTCUT_PREFIX.startsWith('/') ? ["*://*/search*"] : ["*://*/search*", `*://${SHORTCUT_PREFIX.split('/')[0]}/*`] })


// Address-bar searches (e.g. typing "/g" + Enter) arrive as a search navigation with q=/g.
// webNavigation fires reliably for these, so handle the "/" prefix here.
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return
  let url: URL
  try { url = new URL(details.url) } catch { return }
  // Chrome turns a bare "/g" into file:///g, so treat that path as the typed shortcut too
  const isFile = url.protocol === 'file:'
  const isSearchPage = url.pathname === '/search' || url.pathname === '/'
  const query = isFile
    ? decodeURIComponent(url.pathname)
    : (url.searchParams.get('q') ?? url.searchParams.get('p') ?? '')
  if (!(isFile || isSearchPage) || !query.startsWith(SHORTCUT_PREFIX)) return

  const shortcuts = await getSavedShortcuts()
  const match = shortcuts.find((shortcut) => shortcut.shortlink === query.trim().toLowerCase())
  if (match) chrome.tabs.update(details.tabId, { url: match.url })
})

// Make sure shortcuts exist even if the install event was missed (e.g. storage cleared)
getSavedShortcuts().then(async (saved) => {
  if (saved.length === 0) {
    await chrome.storage.local.set({ [SHORTCUTS_STORAGE_KEY]: JSON.stringify(defaultShortcuts) })
  }
}).catch(async () => {
  await chrome.storage.local.set({ [SHORTCUTS_STORAGE_KEY]: JSON.stringify(defaultShortcuts) })
})
