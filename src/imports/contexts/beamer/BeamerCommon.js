import { getCollection } from "../../api/utils/getCollection";
import { onServer } from "../../api/utils/archUtils";
import { backgroundColors } from "./backgroundColors";
import { gridLayouts } from "./gridLayouts";
import { Hierarchy } from "../../api/accounts/roles/Hierarchy";
import { PermissionDeniedError } from "../../api/errors/types/PermissionDeniedError";
import { DocNotFoundError } from "../../api/errors/types/DocNotFoundError";

export const Beamer = {
	name: "beamer",
	label: "beamer.title",
	icon: "tv",
	noDefaultSchema: true,
	isSystem: true,
	isClassroom: true,
	defaultBackground: backgroundColors.light.value,
	defaultGridlayout: gridLayouts.rows.value,
	ui: {
		backgroundColors,
		gridLayouts,
	},
	helpers: {},
	inject: {},
};

Beamer.schema = {
	createdBy: {
		type: String,
	},
	invitationCode: {
		type: String,
		optional: true,
	},
	references: {
		type: Array,
		label: "beamer.references",
		optional: true,
	},
	"references.$": {
		type: Object,
		label: "common.entry",
	},
	"references.$.lessonId": {
		type: String,
		label: "lesson.title",
	},
	"references.$.referenceId": {
		type: String,
		label: "beamer.reference",
	},
	"references.$.context": {
		type: String,
		label: "beamer.context",
	},
	"references.$.itemId": {
		type: String,
		optional: true,
	},
	"references.$.responseProcessor": {
		type: String,
		optional: true,
	},
	headline: {
		type: String,
		optional: true,
		label: "beamer.headline",
	},
	instruction: {
		type: String,
		optional: true,
		label: "beamer.instruction",
	},
	countDown: {
		type: Date,
		label: "beamer.countDown",
		optional: true,
	},
	hideOnCountdownEnd: {
		type: Boolean,
		label: "beamer.hideOnCountdownEnd",
		optional: true,
	},
	ui: {
		type: Object,
		optional: true,
	},
	"ui.background": {
		type: String,
		optional: true,
		allowedValues: Object.keys(backgroundColors),
	},
	"ui.grid": {
		type: String,
		optional: true,
		allowedValues: Object.keys(gridLayouts),
	},
	window: {
		type: Object,
		optional: true,
	},
	"window.id": {
		type: String,
		optional: true,
	},
	"window.url": {
		type: String,
		optional: true,
	},
};

Beamer.methods = {};

Beamer.methods.insert = {
	name: "beamer.methods.insert",
	schema: {},
	roles: [Hierarchy.admin, Hierarchy.schoolAdmin, Hierarchy.teacher],
	numRequests: 1,
	timeInterval: 50000,
	run: onServer(async function () {
		const BeamerCollection = getCollection(Beamer.name);

		if (await BeamerCollection.findOneAsync({ createdBy: this.userId })) {
			throw new PermissionDeniedError("errors.docAlreadyExists");
		}

		const ui = {
			background: Beamer.defaultBackground,
			grid: Beamer.defaultGridlayout,
		};

		const docId = await BeamerCollection.insertAsync({
			createdBy: this.userId,
			references: [],
			ui,
		});
		return BeamerCollection.findOneAsync(docId);
	}),
};

Beamer.methods.update = {
	name: "beamer.methods.update",
	schema: (() => {
		const updateSchema = Object.assign({}, { _id: String }, Beamer.schema);
		delete updateSchema.createdBy;
		return updateSchema;
	})(),
	roles: [Hierarchy.admin, Hierarchy.schoolAdmin, Hierarchy.teacher],
	numRequests: 100,
	timeInterval: 5000,
	run: onServer(async function (updateDoc) {
		const { userId } = this;
		const modifier = Object.assign({}, updateDoc);
		const BeamerCollection = getCollection(Beamer.name);
		const { _id } = modifier;
		const beamerDoc = await BeamerCollection.findOneAsync(_id);

		if (!beamerDoc) {
			throw new DocNotFoundError("beamer.noDocument", { _id });
		}
		if (beamerDoc.createdBy !== userId) {
			throw new PermissionDeniedError("beamer.notOwner", { _id, userId });
		}

		delete modifier._id;
		return BeamerCollection.updateAsync(_id, { $set: modifier });
	}),
};

Beamer.publicatins = {};

Beamer.publicatins.my = {
	name: "beamer.publications.my",
	schema: {},
	run: onServer(function () {
		return getCollection(Beamer.name).find(
			{ createdBy: this.userId },
			{ limit: 1 },
		);
	}),
};
