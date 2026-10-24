# Nexaura Missing Notebook — Session Reference

> Historical note from the session that preceded the current rewrite. The prototype file it refers to
> as `nexura.html` now lives at `docs/nexura-prototype.html`; the playable game is `client/`.

Real root cause: `client/src/` deleted (0 bytes per git diff); `App.jsx`/`main.jsx` missing; `nexura.html` intact (149KB).
Fix applied: `import React` in `.jsx`; ErrorBoundary shows `componentStack`; layout: `html,body,#root{height:100%}`, `clamp()` H1, `@media(max-width:1099px)` collapse, sticky header.
Browser: `goto_url('file:///...nexura.html')` → `success:true`; screenshot evidence captured.
Build/test: ENOENT from deleted `client/package.json` — expected, not a new bug.
Key rule (from user correction): never claim success without screenshot evidence; never assume wrong dir (freight-dashboard/); always verify build/DOM before declaring done.
