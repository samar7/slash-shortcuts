import type { Shortcut } from "../types";
import { SHORTCUT_PREFIX as P } from "./keys";

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    shortlink: `${P}g`,
    url: 'https://www.google.com',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    shortlink: `${P}meet`,
    url: 'https://meet.google.com',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    shortlink: `${P}mail`,
    url: 'https://mail.google.com',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    shortlink: `${P}linkedin`,
    url: 'https://www.linkedin.com/feed/',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    shortlink: `${P}figma`,
    url: 'https://figma.com/',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]