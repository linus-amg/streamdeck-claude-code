# Marketplace listing — Controls for Claude Code

Everything needed to submit at **[maker.elgato.com](https://maker.elgato.com)**
(Home → Create product → Stream Deck plugin). Fields marked **immutable** can't
be changed after submission.

## Details

- **Name** (immutable): `Controls for Claude Code`
- **Category:** Productivity / Utilities (pick the closest at submission)
- **Pricing** (immutable): **Free**
- **Support / additional link:** https://github.com/linus-amg/streamdeck-claude-code
- **Tags:** `claude`, `claude code`, `ai`, `coding`, `terminal`, `voice`, `developer`, `productivity`

## Description

> Control a live Claude Code session straight from your Stream Deck.
>
> Press a key to switch model (Opus, Sonnet, Haiku), set reasoning effort
> (low → max, ultracode), toggle fast mode, run any skill or slash command, or
> trigger Claude Code's native voice dictation — all typed directly into your
> terminal. Model and effort keys light up to show the active selection.
>
> **Actions**
> • Set Model — /model opus · sonnet · haiku · fable
> • Set Effort — /effort low · medium · high · xhigh · max · ultracode
> • Fast Mode — toggle /fast on/off
> • Run Skill — one key per /command (e.g. /prepare, /lintfix)
> • Voice — push-to-talk, tap-toggle, or enable native /voice dictation
> • Send Text / Key — any text, or keys like Escape and Ctrl-C
>
> Works with your normal `claude` session — no tmux, no wrapper. macOS only;
> needs Accessibility permission (to type) and, for voice, microphone permission.
>
> Unofficial. Not affiliated with or endorsed by Anthropic. "Claude" and
> "Claude Code" are trademarks of Anthropic.

## Release notes (v0.3.0)

> First Marketplace release.
> • Set Model, Set Effort, Fast Mode, Run Skill, Send Text/Key actions
> • Voice action driving Claude Code's native /voice dictation (push-to-talk,
>   tap-toggle, enable)
> • Active model/effort highlighted on the keys

## Media (upload separately in Maker Console)

- **Thumbnail (required, 1920×960 PNG):** `thumbnail.png`
- **Gallery (≥3, 1920×960 PNG or 1920×1080 MP4):**
  - `gallery-1-device.png` — the plugin on a Stream Deck Neo
  - `gallery-2-features.png` — action overview
  - `gallery-3-voice.png` — voice dictation
  - _(optional)_ a short screen-recording MP4 of a key press changing the model

## Pre-submission checklist

- [x] `streamdeck validate` passes
- [x] Plugin icon 256×256 + 512×512 PNG
- [x] Action-list icons monochrome white on transparent
- [x] `URL` set, description accurate, debug flag removed
- [ ] Packaged `.streamDeckPlugin` (`npm run package`)
- [ ] Elgato Maker organization created + Maker Agreement signed
- [ ] Uploaded, details + media filled, submitted (review ~4–10 working days)
