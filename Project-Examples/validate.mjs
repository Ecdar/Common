/**
 * @file
 * This is a simple validator to check that the examples directory is somewhat standardized.
 * This does not do any advanced validation of the structure of the projects.
 *
 * You can run this file with:
 * `deno run --allow-read=. validate.mjs`
 * or
 * `node validate.mjs`
 * or
 * `bun run validate.mjs`.
 */

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const dirPath = "./examples";

let directoryExamples;
try {
	directoryExamples = await readdir(dirPath, { withFileTypes: true });
} catch (error) {
	throw new Error(`Could not find the examples directory. It should be located at "${dirPath}". Are you sure you are running this script in the correct directory?`);
}

log("Validating structure of examples directory");
for (const example of directoryExamples) {
	if (!example.isDirectory()) fail(`Found a non-directory in the examples directory: ${example.name}. Please remove it.`);
}

log("Validating file formatting in examples directory");
await validateFileFormatting(dirPath);
async function validateFileFormatting(path) {
	let dirents;
	try {
		dirents = await readdir(path, { withFileTypes: true });
	} catch (error) {
		throw new Error(`Could not read directory: ${path}: ${error.message}`);
	}
	for (const dirent of dirents) {
		if (dirent.isFile()) {
			if (!dirent.name.endsWith(".json")) fail(`${fullPath(dirent)} should use the .json file extension. All project files must be json encoded.`);
			let json;
			try {
				json = await readFile(fullPath(dirent), "utf8");
			} catch (error) {
				throw new Error(`Could not read ${fullPath(dirent)}: ${error.message}`);
			}
			let object;
			try {
				object = JSON.parse(json);
			} catch (error) {
				fail(`${fullPath(dirent)} does not contain valid JSON`, error);
			}
			if (stringify(object) !== json) {
				fail(`${fullPath(dirent)} is not formatted. Please run the formatter and try again.`);
			}
		} else if (dirent.isDirectory()) {
			await validateFileFormatting(fullPath(dirent));
		}
	}
	function fullPath(dirent) {
		return join(path, dirent.name);
	}
}

function stringify(object) {
	return `${JSON.stringify(object, undefined, "\t")}\n`;
}

function log(message) {
	console.log(` - ${message}`);
}
function fail(message, error) {
	console.error(`\n ❌ ${message}\n`);
	if (error) {
		throw error;
	} else {
		throw new TypeError(message);
	}
}

console.log(" ✔️ Yay, everything is valid!");
