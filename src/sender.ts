import { execFile } from "node:child_process";
import { promisify } from "node:util";

import streamDeck from "@elgato/streamdeck";

const run = promisify(execFile);
const OSASCRIPT = "/usr/bin/osascript";

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Bring an app to the front before typing, so keys reach the right window. */
async function activate(app?: string): Promise<void> {
	if (!app?.trim()) {
		return;
	}
	await run(OSASCRIPT, ["-e", `tell application "${app.replace(/"/g, '\\"')}" to activate`]);
	await delay(80);
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
		await delay(50);
	}
	await keystrokeText(text);
	streamDeck.logger.debug(`keystroked: ${text}`);
	if (submit) {
		// Let the slash-command menu settle before submitting.
		await delay(submitDelayMs);
		await keyCode(KEY_CODES.enter);
	}
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

	await keystrokeText(s);
	streamDeck.logger.debug(`keystroked raw: ${s}`);
}
