import { action, type DidReceiveSettingsEvent, type KeyDownEvent, SingletonAction, type WillAppearEvent } from "@elgato/streamdeck";

import { sendAndReport } from "./shared.js";

export const SKILL_UUID = "com.linus.claude-code-control.skill";

type Settings = {
	/** The slash command to send, e.g. "/prepare" or "/lintfix". */
	command?: string;
	/** Optional custom label for the key face. */
	label?: string;
	/** Whether to press Enter (default true) or leave it in the prompt to edit. */
	submit?: boolean;
};

function faceLabel(settings: Settings): string {
	if (settings.label?.trim()) {
		return settings.label.trim();
	}
	// Derive a short label from the command, e.g. "/lintfix" -> "lintfix".
	return settings.command?.trim().replace(/^\//, "") || "Skill";
}

@action({ UUID: SKILL_UUID })
export class SkillAction extends SingletonAction<Settings> {
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
		const command = ev.payload.settings.command?.trim();
		if (!command) {
			await ev.action.showAlert();
			return;
		}
		await sendAndReport(ev.action, command, { submit: ev.payload.settings.submit !== false });
	}
}
