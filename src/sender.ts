import { execFile } from "node:child_process";
import { promisify } from "node:util";

import streamDeck from "@elgato/streamdeck";

const run = promisify(execFile);
const OSASCRIPT = "/usr/bin/osascript";

/** Time for a newly-activated app to come to the front before we type into it. */
const ACTIVATE_SETTLE_MS = 80;
/** Time for the input line to clear after an Escape before we type. */
const CLEAR_SETTLE_MS = 50;

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Bring an app to the front before typing, so keys reach the right window. */
async function activate(app?: string): Promise<void> {
	if (!app?.trim()) {
		return;
	}
	// Pass the app name as an argv item so no string escaping is needed.
	await run(OSASCRIPT, ["-e", "on run argv", "-e", "tell application (item 1 of argv) to activate", "-e", "end run", app.trim()]);
	await delay(ACTIVATE_SETTLE_MS);
}

/**
 * Type a literal string via System Events. The text is passed as an argv item
 * (not embedded in the script) so no AppleScript-string escaping is needed and
 * arbitrary characters are safe.
 */
async function keystrokeText(text: string, modifiers: string[] = []): Promise<void> {
	const using = modifiers.length ? ` using {${modifiers.join(", ")}}` : "";
	await run(OSASCRIPT, [
		"-e",
		"on run argv",
		"-e",
		`tell application "System Events" to keystroke (item 1 of argv)${using}`,
		"-e",
		"end run",
		text,
	]);
}

async function keyCode(code: number): Promise<void> {
	await run(OSASCRIPT, ["-e", `tell application "System Events" to key code ${code}`]);
}

/**
 * Type text, wait, then press Return — all in a single osascript invocation to
 * avoid a second process spawn. The delay lives inside the script (AppleScript
 * `delay` is in seconds) so timing is identical to typing then submitting
 * separately, but the slash-command menu still gets time to settle.
 */
async function keystrokeAndSubmit(text: string, submitDelayMs: number): Promise<void> {
	// The delay is a numeric literal derived from a number (no escaping needed);
	// only the arbitrary text goes through argv to stay escaping-free.
	const seconds = submitDelayMs / 1000;
	await run(OSASCRIPT, [
		"-e",
		"on run argv",
		"-e",
		'tell application "System Events"',
		"-e",
		"keystroke (item 1 of argv)",
		"-e",
		`delay ${seconds}`,
		"-e",
		"key code 36",
		"-e",
		"end tell",
		"-e",
		"end run",
		text,
	]);
}

/** macOS virtual key codes for the named keys we support. */
const KEY_CODES: Record<string, number> = {
	escape: 53,
	esc: 53,
	enter: 36,
	return: 36,
	tab: 48,
	space: 49,
	delete: 51,
	up: 126,
	down: 125,
	left: 123,
	right: 124,
};

export type SendOptions = {
	/** Delay between typing the command and pressing Return (ms). */
	submitDelayMs?: number;
	/** Send Escape first to clear the Claude Code input line. */
	clearFirst?: boolean;
	/** When false, leave the text in the prompt instead of pressing Return. */
	submit?: boolean;
	/** App to bring to the front before typing (e.g. "Ghostty"). */
	activateApp?: string;
};

/**
 * Type a line of text into the focused terminal and (optionally) submit it.
 * Throws if osascript fails (e.g. Accessibility permission not granted) so the
 * caller can surface a visible error rather than failing silently.
 */
export async function sendToClaude(text: string, opts: SendOptions = {}): Promise<void> {
	const { submitDelayMs = 300, clearFirst = false, submit = true, activateApp } = opts;

	await activate(activateApp);
	if (clearFirst) {
		await keyCode(KEY_CODES.escape);
		await delay(CLEAR_SETTLE_MS);
	}
	if (submit) {
		await keystrokeAndSubmit(text, submitDelayMs);
	} else {
		await keystrokeText(text);
	}
	streamDeck.logger.debug(`keystroked: ${text}`);
}

/**
 * Send a single key or chord to the focused terminal. Supports:
 *  - control chords: "C-c", "C-d"
 *  - named keys: "Escape", "Enter", "Up", "Tab", …
 *  - anything else is typed literally.
 */
export async function sendRawKeys(spec: string, activateApp?: string): Promise<void> {
	await activate(activateApp);
	const s = spec.trim();

	const chord = s.match(/^C-([a-zA-Z])$/);
	if (chord) {
		await keystrokeText(chord[1].toLowerCase(), ["control down"]);
		return;
	}

	const named = KEY_CODES[s.toLowerCase()];
	if (named !== undefined) {
		await keyCode(named);
		return;
	}

	// Not a recognised chord or named key — type it literally, but make the
	// fallback visible so a typo (e.g. "Retrun") isn't silently sent as text.
	streamDeck.logger.warn(`unrecognised key "${s}" — typing it literally`);
	await keystrokeText(s);
}
