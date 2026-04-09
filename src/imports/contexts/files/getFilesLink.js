import { getFilesCollection } from "../../api/utils/getFilesCollection";

const warn = (name) => console.warn("could not get link for", name);

/**
 * Returns a valid download link for a given file.
 * @param file {object}
 * @param name {string=}
 * @param collection {FilesCollection=}
 * @param version {string=}
 * @return {void|string}
 */
export const getFilesLink = ({
	file,
	name,
	collection,
	version = "original",
}) => {
	if (!file) {
		return warn("undefined file");
	}

	const linkType = typeof file.link;
	let link;

	if (linkType === "string") {
		link = file.link;
	} else if (linkType === "function") {
		link = file.link(version);
	} else {
		const fCollection = collection ?? (name && getFilesCollection(name));
		console.debug("getFilesLink:", version, file);
		link = fCollection?.link(file, version);
	}

	if (!link) {
		return warn(file.name);
	}

	return link;
};
