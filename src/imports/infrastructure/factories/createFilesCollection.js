import { Meteor } from "meteor/meteor";
import { createGridFilesFactory } from "meteor/leaonline:grid-factory";
import { i18n } from "../../api/language/language";
import { onClientExec, onServerExec } from "../../api/utils/archUtils";

let createFilesCollection;

onServerExec(() => {
	const { createBucket } = require("../../api/files/createBucket");
	const { createObjectId } = require("../../api/files/createObjectId");
	const fs = require("node:fs");

	createFilesCollection = createGridFilesFactory({
		i18nFactory: (x) => x,
		bucketFactory: createBucket,
		defaultBucket: Meteor.settings.files.bucketName,
		createObjectId: createObjectId,
		fs: fs,
	});
});

onClientExec(() => {
	createFilesCollection = createGridFilesFactory({
		i18nFactory: (...args) => i18n.get(...args),
	});
});

export { createFilesCollection };
