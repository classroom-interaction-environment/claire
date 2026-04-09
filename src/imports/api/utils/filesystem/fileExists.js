import { ensureServer } from "../archUtils";
import fs from "node:fs/promises";

ensureServer();

/**
 * Full async version using fs.stat
 * @param path
 * @return {Promise<unknown>}
 */
export const fileExists = function exists(path) {
	return fs.stat(path);
};
