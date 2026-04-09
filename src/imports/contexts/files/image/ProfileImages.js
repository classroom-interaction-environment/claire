import { FileTypes } from "../shared/FileTypes";
import { onClient, onServerExec } from "../../../api/utils/archUtils";
import { onServerExecLazy } from "../../../infrastructure/loading/onServerExecLazy";

export const ProfileImages = {
	name: "profileImages",
	label: "files.profileImages",
	isFilesCollection: true,
	icon: "file-image",
	schema: {},
	debug: true,
	publicFields: {},
	dependencies: [],

	// this is not material so renderer is on top level
	renderer: onClient({
		template: "imageFileRenderer",
		load: async () => import("./renderer/main/imageFileRenderer"),
	}),

	files: {
		type: FileTypes.image.value,
		extensions: FileTypes.image.extensions,
		accept: FileTypes.image.accept,
		maxSize: 1024 * 1000 * 6,
		usePartialResponse: false,
		converter: onServerExec(
			() => require("./converter/imageConvert").imageConvert,
		),
	},
};

ProfileImages.methods = {};

ProfileImages.methods.byClass = {
	name: "profileImages.publications.byClass",
	schema: {
		classId: String,
		skip: {
			type: Array,
			optional: true,
		},
		"skip.$": String,
	},
	run: onServerExecLazy(
		() => require("./profileImagesByClass").profileImagesByClass,
	),
};

ProfileImages.publications = {};

ProfileImages.publications.fileList = {
	name: "profileImages.publications.fileList",
	schema: {},
	run: onServerExec(() => {
		const { getCollection } = require("../../../api/utils/getCollection");
		const { userIsAdmin } = require("../../../api/accounts/admin/userIsAdmin");

		return async function () {
			const { userId } = this;
			const isAdmin = await userIsAdmin(userId);
			const query = isAdmin ? {} : { userId };
			return getCollection(ProfileImages.name).find(query);
		};
	}),
};
