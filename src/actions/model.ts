import { action, type DidReceiveSettingsEvent, type KeyAction, type KeyDownEvent, SingletonAction, type WillAppearEvent } from "@elgato/streamdeck";

import { getState, type Model, patchState } from "../state.js";
import { repaintKeys, sendAndReport } from "./shared.js";

export const MODEL_UUID = "com.linus.claude-code-control.model";

type Settings = { model?: Model };

const LABELS: Record<Model, string> = { opus: "Opus", sonnet: "Sonnet", haiku: "Haiku", fable: "Fable" };

/** Paint a Set Model key: show the model name, highlight (state 1) when active. */
export async function renderModelKey(key: KeyAction, model: Model | undefined, activeModel: Model | undefined): Promise<void> {
	await key.setTitle(model ? LABELS[model] : "Model");
	await key.setState(model !== undefined && model === activeModel ? 1 : 0);
}

@action({ UUID: MODEL_UUID })
export class ModelAction extends SingletonAction<Settings> {
	override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
		if (ev.action.isKey()) {
			await renderModelKey(ev.action, ev.payload.settings.model, (await getState()).activeModel);
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> {
		if (ev.action.isKey()) {
			await renderModelKey(ev.action, ev.payload.settings.model, (await getState()).activeModel);
		}
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		const { model } = ev.payload.settings;
		if (!model) {
			await ev.action.showAlert();
			return;
		}
		if (await sendAndReport(ev.action, `/model ${model}`)) {
			const state = await patchState({ activeModel: model });
			await this.refreshAll(state.activeModel);
		}
	}

	/** Re-paint every visible Set Model key so the active one stays highlighted. */
	private async refreshAll(activeModel: Model | undefined): Promise<void> {
		await repaintKeys(this.actions, async (key) => {
			await renderModelKey(key, (await key.getSettings<Settings>()).model, activeModel);
		});
	}
}
