import { action, type DidReceiveSettingsEvent, type KeyAction, type KeyDownEvent, SingletonAction, type WillAppearEvent } from "@elgato/streamdeck";

import { type Effort, getState, patchState } from "../state.js";
import { repaintKeys, sendAndReport } from "./shared.js";

export const EFFORT_UUID = "com.linus.claude-code-control.effort";

type Settings = { effort?: Effort };

const LABELS: Record<Effort, string> = {
	low: "Low",
	medium: "Medium",
	high: "High",
	xhigh: "X-High",
	max: "Max",
	ultracode: "Ultra",
};

/** Paint a Set Effort key: show the level, highlight (state 1) when active. */
export async function renderEffortKey(key: KeyAction, effort: Effort | undefined, activeEffort: Effort | undefined): Promise<void> {
	await key.setTitle(effort ? LABELS[effort] : "Effort");
	await key.setState(effort !== undefined && effort === activeEffort ? 1 : 0);
}

@action({ UUID: EFFORT_UUID })
export class EffortAction extends SingletonAction<Settings> {
	override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
		if (ev.action.isKey()) {
			await renderEffortKey(ev.action, ev.payload.settings.effort, (await getState()).activeEffort);
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> {
		if (ev.action.isKey()) {
			await renderEffortKey(ev.action, ev.payload.settings.effort, (await getState()).activeEffort);
		}
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		const { effort } = ev.payload.settings;
		if (!effort) {
			await ev.action.showAlert();
			return;
		}
		if (await sendAndReport(ev.action, `/effort ${effort}`)) {
			const state = await patchState({ activeEffort: effort });
			await this.refreshAll(state.activeEffort);
		}
	}

	/** Re-paint every visible Set Effort key so the active one stays highlighted. */
	private async refreshAll(activeEffort: Effort | undefined): Promise<void> {
		await repaintKeys(this.actions, async (key) => {
			await renderEffortKey(key, (await key.getSettings<Settings>()).effort, activeEffort);
		});
	}
}
