# Slash Shortcuts

A personal Chrome extension that turns short names into links: type `go/g` in the address bar, press Enter, and land on google.com.

This is a fork of [getoslash/oslash](https://github.com/getoslash/oslash) (MIT, © 2023 OSlash), which is no longer maintained. Credit for the original extension goes to the OSlash team. This version changes the shortcut prefix from `o/` to `/` and is developed for personal use.

## Install (developer mode)

```bash
npm install
npm run build
```

1. Open `chrome://extensions` and turn on Developer mode.
2. Click **Load unpacked** and select the `oslash-chrome-extension` folder.
3. Pin the extension, click it to add shortcuts (names start with `go/`).

## Changing the prefix

Chrome treats a bare `/` as a file path (`file:///`), so the prefix is `go/`. It lives in `src/lib/constants/keys.ts` (`SHORTCUT_PREFIX`); change it to any host-style prefix such as `g/` and rebuild.

## License

MIT. See [LICENSE](LICENSE). The original copyright notice is retained.
