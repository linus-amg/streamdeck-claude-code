import streamDeck from "@elgato/streamdeck";

export type Model = "opus" | "sonnet" | "haiku" | "fable";
export type Effort = "low" | "medium" | "high" | "xhigh" | "max" | "ultracode";

/** Shared behaviour config, edited once via any Property Inspector (global). */
export type PluginConfig = {
	/**
	 * Optional app to bring to the front before typing (e.g. "Zed", "Ghostty").
	 * Default: unset — type into whatever window is already focused (no focus
	 * stealing). Only set this if you want keys forced to a specific app.
	 */
	activateApp?: string;
	/** Delay between typing the command and pressing Return (ms). Default 300. */
	submitDelayMs?: number;
	/** Send Escape to clear the input line before typing. Default false. */
	clearFirst?: boolean;
};

/** The plugin is the source of truth for the last selection it sent. */
export type ActiveState = {
	activeModel?: Model;
	activeEffort?: Effort;
	fast?: boolean;
};

export type GlobalState = PluginConfig & ActiveState;

const DEFAULT_SUBMIT_DELAY_MS = 300;

export async function getState(): Promise<GlobalState> {
	return (await streamDeck.settings.getGlobalSettings<GlobalState>()) ?? {};
}

/** Read-modify-write a subset of global state without clobbering other keys. */
export async function patchState(patch: Partial<GlobalState>): Promise<GlobalState> {
	const next: GlobalState = { ...(await getState()), ...patch };
	await streamDeck.settings.setGlobalSettings(next);
	return next;
}

export type ResolvedConfig = {
	activateApp?: string;
	submitDelayMs: number;
	clearFirst: boolean;
};

export function resolveConfig(state: GlobalState): ResolvedConfig {
	return {
		// Unset/blank -> no activation: type into whatever window is focused.
		activateApp: state.activateApp?.trim() || undefined,
		submitDelayMs: state.submitDelayMs ?? DEFAULT_SUBMIT_DELAY_MS,
		clearFirst: state.clearFirst ?? false,
	};
}
