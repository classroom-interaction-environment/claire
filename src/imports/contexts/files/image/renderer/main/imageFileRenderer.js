import { Template } from "meteor/templating";
import { ImageFiles } from "../../ImageFiles";
import { createDeleteFile } from "../../../shared/createDeleteFile";
import { getFilesLink } from "../../../getFilesLink";
import "../../../shared/templates/helpers";
import "./imageFileRenderer.html";

const API = Template.imageFileRenderer.setDependencies({
	contexts: [ImageFiles],
});

Template.imageFileRenderer.onCreated(function () {
	API.log("on created");
	this.state.setDefault("version", "original");
	this.deleteFile = createDeleteFile({
		context: ImageFiles,
		onSuccess: () => API.notify(true),
		onError: API.notify,
	});

	this.autorun(() => {
		const data = Template.currentData();
		if (!data) return API.log("no data!");
		API.log("on data", data);
		const { imageType, version } = data;
		if (imageType || version) {
			this.state.set({ version: imageType || version });
		}
	});
});

Template.imageFileRenderer.helpers({
	loadComplete() {
		return API.initComplete();
	},
	getLink(image) {
		const version = Template.getState("version");
		return (
			image &&
			getFilesLink({
				file: image,
				name: ImageFiles.name,
				version,
			})
		);
	},
});
