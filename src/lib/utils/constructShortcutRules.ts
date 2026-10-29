import type { Shortcut } from "../types"
import { SHORTCUT_PREFIX } from "../constants/keys"

/** 
 * Construct DeclarativeNetRequestRules from Shortcuts array 
 * @param {Shortcut[]} shortcuts shortcuts array 
 * @returns {chrome.declarativeNetRequest.Rule[]} declarativeNetRequest rules 
 */
export function constructShortcutRules(shortcuts: Shortcut[]) {
  // a '/' prefix is handled in the service worker (Chrome searches for it); http://<prefix>name rules only make sense for host-style prefixes like 'g/'
  if (SHORTCUT_PREFIX.startsWith('/')) return []
  const newRules = shortcuts.map((shortcut, index) => {
    const newRule: chrome.declarativeNetRequest.Rule = {
      "id": index + 1,
      "priority": 1,
      "action": {
        "type": chrome.declarativeNetRequest.RuleActionType['REDIRECT'],
        "redirect": {
          "url": shortcut.url
        }
      },
      "condition": {
        "urlFilter": `http://${shortcut.shortlink}`,
        "resourceTypes": [chrome.declarativeNetRequest.ResourceType['MAIN_FRAME']]
      }
    }
    return newRule
  })
  return newRules
}