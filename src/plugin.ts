import streamDeck from "@elgato/streamdeck";

import { EffortAction } from "./actions/effort.js";
import { FastAction } from "./actions/fast.js";
import { ModelAction } from "./actions/model.js";
import { SendAction } from "./actions/send.js";
import { SkillAction } from "./actions/skill.js";
import { VoiceAction } from "./actions/voice.js";

streamDeck.logger.setLevel("debug");

streamDeck.actions.registerAction(new ModelAction());
streamDeck.actions.registerAction(new EffortAction());
streamDeck.actions.registerAction(new FastAction());
streamDeck.actions.registerAction(new SkillAction());
streamDeck.actions.registerAction(new SendAction());
streamDeck.actions.registerAction(new VoiceAction());

await streamDeck.connect();

// Only deliver did-receive settings events for genuine Property Inspector
// changes — NOT for our own programmatic getGlobalSettings()/getSettings()
// reads. Without this, every read re-fires the event; a handler that reads
// settings then loops forever and floods the Stream Deck connection.
// (Stream Deck 7.1+; harmless no-op guard on older versions.)
try {
	streamDeck.settings.useExperimentalMessageIdentifiers = true;
} catch (err) {
	streamDeck.logger.warn(`message identifiers unavailable: ${(err as Error).message}`);
}
