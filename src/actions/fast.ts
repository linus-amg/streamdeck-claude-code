import { action, type KeyAction, type KeyDownEvent, SingletonAction, type WillAppearEvent } from "@elgato/streamdeck";

import { getState, patchState } from "../state.js";
import { repaintKeys, sendAndReport } from "./shared.js";

export const FAST_UUID = "com.linus.claude-code-control.fast";

/** Paint the Fast toggle: state 1 = on, state 0 = off. */
export async function renderFastKey(key: KeyAction, fast: boolean | undefined): Promise<void> {
	await key.setState(fast ? 1 : 0);
}

@action({ UUID: FAST_UUID })
export class FastAction extends SingletonAction {
	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		if (ev.action.isKey()) {
			await renderFastKey(ev.action, (await getState()).fast);
		}
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const next = !(await getState()).fast;
		if (await sendAndReport(ev.action, `/fast ${next ? "on" : "off"}`)) {
			await patchState({ fast: next });
			await this.refreshAll(next);
		}
	}

	/** Re-paint every visible Fast key so they all reflect on/off together. */
	private async refreshAll(fast: boolean): Promise<void> {
		await repaintKeys(this.actions, (key) => renderFastKey(key, fast));
	}
}
