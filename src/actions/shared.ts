import streamDeck, { type DialAction, type KeyAction } from "@elgato/streamdeck";

import { sendRawKeys, sendToClaude, type SendOptions } from "../sender.js";
import { getState, resolveConfig } from "../state.js";

/**
 * Repaint every visible key of an action (skipping any dial instances),
 * concurrently. Used by the model/effort/fast actions to keep the active
 * selection highlighted across all their keys after a change.
 */
export async function repaintKeys(
	actions: Iterable<DialAction | KeyAction>,
	render: (key: KeyAction) => Promise<void>,
): Promise<void> {
	const tasks: Promise<void>[] = [];
	for (const action of actions) {
		if (action.isKey()) {
			tasks.push(render(action));
		}
	}
	await Promise.all(tasks);
}

/** Type literal text into Claude Code, flashing the key OK (green) or alert (yellow). */
export async function sendAndReport(action: KeyAction, text: string, extra: Partial<SendOptions> = {}): Promise<boolean> {
	const cfg = resolveConfig(await getState());
	try {
		await sendToClaude(text, {
			submitDelayMs: cfg.submitDelayMs,
			clearFirst: cfg.clearFirst,
			activateApp: cfg.activateApp,
			...extra,
		});
		await action.showOk();
		return true;
	} catch (err) {
		streamDeck.logger.error(`send failed: ${(err as Error).message}`);
		await action.showAlert();
		return false;
	}
}

/** Send a raw key/chord (e.g. "Escape", "C-c"), flashing OK/alert. */
export async function sendKeysAndReport(action: KeyAction, keys: string): Promise<boolean> {
	const cfg = resolveConfig(await getState());
	try {
		await sendRawKeys(keys, cfg.activateApp);
		await action.showOk();
		return true;
	} catch (err) {
		streamDeck.logger.error(`send keys failed: ${(err as Error).message}`);
		await action.showAlert();
		return false;
	}
}
