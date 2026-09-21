# Crypto961

A financial-literacy-first Bitcoin/crypto publication for a Lebanon/MENA
audience. Static site, no build step, ready for GitHub Pages.

## Files
- `index.html` — homepage
- `style.css` — all styling (editorial/ledger-inspired design system)
- `script.js` — reserved for future interactivity (currently empty)

## Before you launch
1. **Newsletter form**: replace `YOUR_FORM_ID` in `index.html` with your
   own Formspree (or other form service) endpoint.
2. **Images**: add `images/favicon.png` and `images/og-cover.jpg` — the
   HTML already references these paths.
3. **Domain**: the schema and Open Graph tags assume `crypto961.com`.
   Update every occurrence of that URL in `index.html` once you've
   confirmed your actual domain.
4. **Content**: the four "Start here" article links are placeholders
   (`href="#"`) — point them at real article pages once written.

## Hosting on GitHub Pages
1. Push these files to the root of your `Crypto961` repository (or a
   `docs/` folder — adjust Pages settings accordingly).
2. In the repo: Settings → Pages → set source to your branch/folder.
3. If using a custom domain, add a `CNAME` file containing just your
   domain (e.g. `crypto961.com`), same pattern as your photography site.

## Design notes
Palette and type were chosen deliberately to avoid generic "crypto
hype" visual tropes (neon green on black) — instead using an editorial,
ledger/publication feel (deep cedar green, parchment paper tone, brick-red
accent) to reinforce the "literacy over hype" positioning.
