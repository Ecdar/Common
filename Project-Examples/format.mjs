/**
 * @file
 * This is a simple formatter that ensures consistent formatting of all json files.
 *
 * You can run this file with:
 * `deno run --allow-read=. --allow-write=. format.mjs`
 * or
 * `node format.mjs`
 * or
 * `bun run format.mjs`.
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";

let foundFiles = 0;
let unreadDirs = 0;
let unreadFiles = 0;
let invalidFiles = 0;
let unwrittenFiles = 0;
let unformattedFiles = 0;

await format(".");
async function format(path) {
	let dirents;
	try {
		dirents = await readdir(path, { withFileTypes: true });
	} catch (error) {
		console.warn(`Could not read directory: ${path}: ${error.message}`);
		unreadDirs++;
		return;
	}
	for (const dirent of dirents) {
		if (dirent.isFile() && dirent.name.endsWith(".json")) {
			foundFiles++;
			let json;
			try {
				json = await readFile(fullPath(dirent), "utf8");
			} catch (error) {
				console.warn(`Could not read file: ${fullPath(dirent)}: ${error.message}`);
				unreadFiles++;
				continue;
			}
			let object;
			try {
				object = JSON.parse(json);
			} catch (error) {
				console.warn(`Skipping invalid JSON: ${fullPath(dirent)}: ${error.message}`);
				invalidFiles++;
				continue;
			}
			const formatted = stringify(object);
			if (formatted !== json) {
				console.log(`Formatting ${fullPath(dirent)}`);
				unformattedFiles++;
				try {
					await writeFile(fullPath(dirent), formatted);
				} catch (error) {
					console.warn(`Could not write to file: ${fullPath(dirent)}: ${error.message}`);
					unwrittenFiles++;
					continue;
				}
			}
		} else if (dirent.isDirectory()) {
			await format(fullPath(dirent));
		}
	}
	function fullPath(dirent) {
		return join(path, dirent.name);
	}
}

function stringify(object) {
	return `${JSON.stringify(object, undefined, "\t")}\n`;
}

if (foundFiles === 0) {
	console.warn("Did not find any files to format. Are you sure you are running this in the correct directory?");
} else {
	const foundFormatted = `Found ${foundFiles} files, ${unformattedFiles === 0 ? "all of them were already formatted" : `${unformattedFiles} needed formatting`}.`;
	const warnings = [];
	if (unreadDirs > 0) {
		warnings.push(`Could not read ${unreadDirs === 1 ? "one of the directories" : `${unreadDirs} directories`}`);
	}
	if (unreadFiles > 0) {
		warnings.push(`Could not read ${unreadFiles === 1 ? "one of the files" : `${unreadFiles} files`}`);
	}
	if (invalidFiles > 0) {
		warnings.push(`Had to skip ${invalidFiles === 1 ? "an invalid file because it" : `${invalidFiles} files because they`} contained invalid JSON`);
	}
	if (unwrittenFiles > 0) {
		warnings.push(`Could not write to ${unwrittenFiles === 1 ? "one of the files" : `${unwrittenFiles} files`}`);
	}
	if (warnings.length === 0) {
		console.log(` ✔️ ${foundFormatted}`);
	} else {
		warnings.push(foundFormatted);
		console.warn(warnings.join(". "));
	}
}
