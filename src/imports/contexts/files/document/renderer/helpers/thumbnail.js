import { DocumentFiles } from "../../DocumentFiles";
import { getFilesLink } from "../../../getFilesLink";

export const hasThumbnail = (fileObj) => fileObj?.versions?.thumbnail;

export const getThumbnail = (fileObj) =>
	getFilesLink({
		file: fileObj,
		name: DocumentFiles.name,
		version: "thumbnail",
	});
