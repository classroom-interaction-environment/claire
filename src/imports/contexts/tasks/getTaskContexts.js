export const getTaskContexts = () => {
	const { Task } = require("../curriculum/curriculum/task/Task");

	// WEB
	const { WebResources } = require("../resources/web/WebResources");
	const { LinkedResource } = require("../resources/web/linked/LinkedResource");
	const {
		EmbeddedResource,
	} = require("../resources/web/embedded/EmbeddedResource");
	const { Literature } = require("../resources/web/literature/Literature");

	// FILES
	const { ImageFiles } = require("../files/image/ImageFiles");
	const { AudioFiles } = require("../files/audio/AudioFiles");
	const { VideoFiles } = require("../files/video/VideoFiles");
	const { DocumentFiles } = require("../files/document/DocumentFiles");

	return [
		Task,
		WebResources,
		EmbeddedResource,
		LinkedResource,
		Literature,
		ImageFiles,
		AudioFiles,
		VideoFiles,
		DocumentFiles,
	];
};
