import { action, type DidReceiveSettingsEvent, type KeyDownEvent, SingletonAction, type WillAppearEvent } from "@elgato/streamdeck";

import { sendAndReport, sendKeysAndReport } from "./shared.js";

export const SEND_UUID = "com.linus.claude-code-control.send";

type Settings = {
	/** The text or key sequence to send. */
	value?: string;
	/** Optional custom label for the key face. */
	label?: string;
	/** "text" = typed literally (with Enter); "key" = raw tmux keys (Escape, C-c). */
	mode?: "text" | "key";
	/** For text mode: press Enter (default true) or leave in prompt. */
	submit?: boolean;
};

function faceLabel(settings: Settings): string {
	return settings.label?.trim() || settings.value?.trim() || "Send";
}

@action({ UUID: SEND_UUID })
export class SendAction extends SingletonAction<Settings> {
	override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
		if (ev.action.isKey()) {
			await ev.action.setTitle(faceLabel(ev.payload.settings));
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> {
		if (ev.action.isKey()) {
			await ev.action.setTitle(faceLabel(ev.payload.settings));
		}
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		const { value, mode, submit } = ev.payload.settings;
		if (!value?.trim()) {
			await ev.action.showAlert();
			return;
		}
		if (mode === "key") {
			await sendKeysAndReport(ev.action, value);
		} else {
			await sendAndReport(ev.action, value, { submit: submit !== false });
		}
	}
}
