import streamDeck, { action, type KeyAction, type KeyDownEvent, type KeyUpEvent, SingletonAction, type WillAppearEvent } from "@elgato/streamdeck";

import { sendRawKeys } from "../sender.js";
import { getState, resolveConfig } from "../state.js";
import { sendAndReport } from "./shared.js";

export const VOICE_UUID = "com.linus.claude-code-control.voice";

/** The slash command that puts Claude Code into tap dictation mode. */
const ENABLE_COMMAND = "/voice tap";

type Gesture = "hold" | "tap" | "enable";
type Settings = {
	/**
	 * "hold"   = push-to-talk (hold the key while speaking);
	 * "tap"    = press to start, press again to send;
	 * "enable" = send `/voice tap` to turn dictation on.
	 */
	gesture?: Gesture;
	/** The key bound to voice:pushToTalk in Claude Code (default Space). */
	voiceKey?: string;
};

/** Per-key recording flag for the tap-toggle gesture. */
const recording = new Map<string, boolean>();

function gestureOf(settings: Settings): Gesture {
	return settings.gesture ?? "hold";
}

function voiceKeyOf(settings: Settings): string {
	return settings.voiceKey?.trim() || "space";
}

/**
 * Tap the Claude Code voice key once. Both gestures drive `/voice tap` mode:
 * native `hold` mode relies on OS key-repeat to detect a hold, which a
 * synthetic keypress can't produce — so a single injected tap is used to
 * start and to stop recording. `/voice tap` must be enabled in the session.
 */
async function tapVoiceKey(key: KeyAction, voiceKey: string): Promise<void> {
	const cfg = resolveConfig(await getState());
	try {
		await sendRawKeys(voiceKey, cfg.activateApp);
	} catch (err) {
		streamDeck.logger.error(`voice tap failed: ${(err as Error).message}`);
		await key.showAlert();
	}
}

@action({ UUID: VOICE_UUID })
export class VoiceAction extends SingletonAction<Settings> {
	override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
		if (ev.action.isKey()) {
			recording.delete(ev.action.id);
			await ev.action.setState(0);
		}
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		const gesture = gestureOf(ev.payload.settings);
		if (gesture === "enable") {
			// Turn on tap dictation mode (both other gestures rely on it).
			await sendAndReport(ev.action, ENABLE_COMMAND);
			return;
		}
		const voiceKey = voiceKeyOf(ev.payload.settings);
		if (gesture === "tap") {
			// Tap toggle: flip recording state and tap once (start, then send).
			const on = !recording.get(ev.action.id);
			recording.set(ev.action.id, on);
			await ev.action.setState(on ? 1 : 0);
			await tapVoiceKey(ev.action, voiceKey);
		} else {
			// Push-to-talk: pressing the key starts recording.
			await ev.action.setState(1);
			await tapVoiceKey(ev.action, voiceKey);
		}
	}

	override async onKeyUp(ev: KeyUpEvent<Settings>): Promise<void> {
		if (gestureOf(ev.payload.settings) !== "hold") {
			return; // Only push-to-talk acts on release.
		}
		// Push-to-talk: releasing the key stops recording (and auto-sends).
		await tapVoiceKey(ev.action, voiceKeyOf(ev.payload.settings));
		await ev.action.setState(0);
	}
}
