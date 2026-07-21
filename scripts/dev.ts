// Watch + rebuild + hot-restart the plugin. Run with: bun run watch
import { watch } from "node:fs";

import { $ } from "bun";

const ENTRY = "src/plugin.ts";
const OUTDIR = "com.linus.claude-code-control.sdPlugin/bin";
const MANIFEST = "com.linus.claude-code-control.sdPlugin/manifest.json";
const UUID = "com.linus.claude-code-control";

async function build(): Promise<void> {
	const result = await Bun.build({
		entrypoints: [ENTRY],
		outdir: OUTDIR,
		target: "node",
		format: "esm",
		sourcemap: "linked",
	});
	if (!result.success) {
		for (const log of result.logs) {
			console.error(log);
		}
		return;
	}
	// Reload the running plugin so changes take effect immediately.
	await $`streamdeck restart ${UUID}`.nothrow().quiet();
	console.log(`built + restarted @ ${new Date().toLocaleTimeString()}`);
}

await build();

let timer: ReturnType<typeof setTimeout> | undefined;
const rebuild = (): void => {
	clearTimeout(timer);
	timer = setTimeout(() => void build(), 100);
};

watch("src", { recursive: true }, rebuild);
watch(MANIFEST, rebuild);
console.log("watching src/ and manifest.json … (Ctrl-C to stop)");
