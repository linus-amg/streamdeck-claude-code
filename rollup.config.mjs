import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import path from "node:path";
import url from "node:url";

const sdPlugin = "com.linus.claude-code-control.sdPlugin";

/** @type {import('rollup').RollupOptions} */
const config = {
	input: "src/plugin.ts",
	output: {
		file: `${sdPlugin}/bin/plugin.js`,
		sourcemap: true,
		sourcemapPathTransform: (relativeSourcePath, sourcemapPath) =>
			url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href,
	},
	plugins: [
		{
			name: "watch-externals",
			buildStart: function () {
				this.addWatchFile(`${sdPlugin}/manifest.json`);
			},
		},
		typescript({ mapRoot: process.env.ROLLUP_WATCH === "true" ? "./" : undefined }),
		nodeResolve({ browser: false, exportConditions: ["node"], preferBuiltins: true }),
		commonjs(),
	],
};

export default config;
