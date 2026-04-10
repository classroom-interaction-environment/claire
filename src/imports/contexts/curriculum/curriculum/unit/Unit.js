import { FormFactory } from "../../utils/formfactory";
import { i18n } from "../../../../api/language/language";
import { Hierarchy } from "../../../../api/accounts/roles/Hierarchy";
import { getCollection } from "../../../../api/utils/getCollection";
import { onServer, onServerExec } from "../../../../api/utils/archUtils";
import { firstOption } from "../../../tasks/definitions/common/helpers";
import { onServerExecLazy } from "../../../../infrastructure/loading/onServerExecLazy";

import { Pocket } from "../pocket/Pocket";
import { Objective } from "../objective/Objective";
import { Task } from "../task/Task";

import { ImageFiles } from "../../../files/image/ImageFiles";
import { AudioFiles } from "../../../files/audio/AudioFiles";
import { DocumentFiles } from "../../../files/document/DocumentFiles";
import { VideoFiles } from "../../../files/video/VideoFiles";
import { LinkedResource } from "../../../resources/web/linked/LinkedResource";
import { EmbeddedResource } from "../../../resources/web/embedded/EmbeddedResource";
import { Literature } from "../../../resources/web/literature/Literature";

const byName = (a, b) => a.label.localeCompare(b.label);

const short = (url) => (url.length < 100 ? url : `${url.substring(0, 97)}...`);

export const Unit = {
	name: "unit",
	order: 1,
	label: "curriculum.unit",
	icon: "th-large",
	isCurriculum: true,
	isClassroom: true,
	material: {},
	schema: {
		pocket: {
			type: String,
			label: i18n.reactive(Pocket.label),
			autoform: {
				firstOption: firstOption,
				options() {
					return getCollection(Pocket.name)
						.find()
						.map((element) => ({
							value: element._id,
							label: element.title,
						}));
				},
			},
		},
		index: {
			type: Number,
			label: i18n.reactive("common.index"),
			min: 0,
			autoform: {
				defaultValue: 0,
				type: "hidden",
			},
		},
		dimensions: {
			label: i18n.reactive("curriculum.dimension"),
			type: Array,
			optional: true,
		},
		"dimensions.$": {
			type: String,
			label: i18n.reactive("common.entry"),
			autoform: {
				firstOption: firstOption,
			},
		},
		period: {
			type: Number,
			min: 0,
			label: i18n.reactive("curriculum.period"),
		},
		objectives: {
			type: Array,
			label: i18n.reactive("curriculum.objectives"),
			optional: true,
		},
		"objectives.$": {
			type: String,
			label: i18n.reactive("common.entry"),
			autoform: {
				afFieldInput: {
					firstOption: firstOption,
					options: FormFactory.getSelectOptions(
						Objective.name,
						{},
						{
							value: "_id",
							label: "title",
						},
						"pocket",
						(value) => {
							if (typeof value === "object") {
								return i18n.reactive("common.notAssociated");
							}
							const pocketCollection = getCollection(Pocket.name);
							const pocketDoc = pocketCollection.findOne(value);
							return pocketDoc ? pocketDoc.title : value;
						},
					),
				},
			},
		},
		requirements: {
			label: i18n.reactive("common.requirements"),
			type: String,
			optional: true,
			autoform: {
				afFieldInput: {
					type: "textarea",
					rows: 4,
					class: "requirements",
				},
			},
		},

		links: {
			type: Array,
			label: i18n.reactive(LinkedResource.label),
			optional: true,
		},
		"links.$": {
			type: String,
			label: i18n.reactive("common.entry"),
			autoform: {
				firstOption: firstOption,
				options() {
					const LinkedResourceCollection = getCollection(LinkedResource.name);
					return LinkedResourceCollection.find()
						.fetch()
						.map((res) => ({
							value: res._id,
							label: `${res.title} - ${short(res.url)}`,
						}))
						.sort(byName);
				},
			},
		},

		embeds: {
			type: Array,
			label: i18n.reactive(EmbeddedResource.label),
			optional: true,
		},
		"embeds.$": {
			type: String,
			label: i18n.reactive("common.entry"),
			autoform: {
				firstOption: firstOption,
				options() {
					const EmbeddedResourceCollection = getCollection(
						EmbeddedResource.name,
					);
					return EmbeddedResourceCollection.find()
						.fetch()
						.map((res) => ({
							value: res._id,
							label: res.title,
						}))
						.sort(byName);
				},
			},
		},

		// //////////////////////////////////////////////////////////////////////////////////
		//
		// UPLOADS / FILES
		//
		// //////////////////////////////////////////////////////////////////////////////////

		images: {
			label: i18n.reactive("files.images"),
			type: Array,
			optional: true,
		},
		"images.$": {
			label: i18n.reactive("common.entry"),
			type: String,
			autoform: {
				options() {
					const ImageFilesFilesCollection = getCollection(ImageFiles.name);
					return ImageFilesFilesCollection.find({})
						.fetch()
						.map((res) => ({
							value: res._id,
							label: res.title,
						}))
						.sort(byName);
				},
			},
		},

		audio: {
			label: i18n.reactive("files.audio"),
			type: Array,
			optional: true,
		},
		"audio.$": {
			label: i18n.reactive("common.entry"),
			type: String,
			autoform: {
				options() {
					const AudioFilesCollection = getCollection(AudioFiles.name);
					return AudioFilesCollection.find({})
						.fetch()
						.map((res) => ({
							value: res._id,
							label: res.title,
						}))
						.sort(byName);
				},
			},
		},

		documents: {
			label: i18n.reactive("files.documents"),
			type: Array,
			optional: true,
		},
		"documents.$": {
			label: i18n.reactive("common.entry"),
			type: String,
			autoform: {
				options() {
					const DocFilesCollection = getCollection(DocumentFiles.name);
					return DocFilesCollection.find({})
						.fetch()
						.map((res) => ({
							value: res._id,
							label: res.title,
						}))
						.sort(byName);
				},
			},
		},

		videos: {
			label: i18n.reactive("files.videos"),
			type: Array,
			optional: true,
		},
		"videos.$": {
			label: i18n.reactive("common.entry"),
			type: String,
			autoform: {
				options() {
					const VideoFilesCollection = getCollection(VideoFiles.name);
					return VideoFilesCollection.find({})
						.fetch()
						.map((res) => ({
							value: res._id,
							label: res.title,
						}))
						.sort(byName);
				},
			},
		},

		// //////////////////////////////////////////////////////////////////////////////////
		//
		// TASKS
		//
		// //////////////////////////////////////////////////////////////////////////////////

		tasks: {
			type: Array,
			label: i18n.reactive(Task.label),
			optional: true,
			defaultValue: [],
		},
		"tasks.$": {
			type: String,
			label: i18n.reactive("common.entry"),
			autoform: {
				firstOption: firstOption,
				options: FormFactory.getSelectOptions(
					Task.name,
					{},
					{
						value: "_id",
						label: "title",
					},
					"task",
					(value) => {
						if (typeof value === "object") {
							return i18n.reactive("common.notAssociated");
						}
						const TaskCollection = getCollection(Task.name);
						const taskDoc = TaskCollection.findOne(value);
						return taskDoc ? taskDoc.title : value;
					},
				),
			},
		},

		// //////////////////////////////////////////////////////////////////////////////////
		//
		// READINGS
		//
		// //////////////////////////////////////////////////////////////////////////////////

		literature: {
			label: i18n.reactive(Literature.label),
			type: Array,
			optional: true,
		},
		"literature.$": {
			type: String,
			label: i18n.reactive("common.entry"),
			autoform: {
				firstOption: firstOption,
				options() {
					const LiteratureCollection = getCollection(Literature.name);
					return LiteratureCollection.find()
						.fetch()
						.map((res) => ({
							value: res._id,
							label: `${res.authors} (${res.year}) - ${res.title}`,
						}))
						.sort(byName);
				},
			},
		},

		// //////////////////////////////////////////////////////////////////////////////////
		//
		// PHASES
		//
		// //////////////////////////////////////////////////////////////////////////////////

		phases: {
			label: i18n.reactive("unit.phases"),
			type: Array,
			optional: true,
			autoform: {
				type: "hidden",
			},
		},
		"phases.$": {
			type: String,
			label: i18n.reactive("common.phase"),
			autoform: {
				firstOption: firstOption,
				options() {
					const PhaseCollection = getCollection("phase");
					return PhaseCollection.find()
						.fetch()
						.map((res) => ({
							value: res._id,
							label: `${res.authors} (${res.year}) - ${res.title}`,
						}))
						.sort(byName);
				},
			},
		},
	},
	publicFields: {
		pocket: 1,
		index: 1,
		period: 1,
		objectives: 1,
		dimensions: 1,
		tasks: 1,
		links: 1,
		embeds: 1,
		literature: 1,
		images: 1,
		audio: 1,
		documents: 1,
		videos: 1,
		phases: 1,
	},
	methods: {},
	filter: {
		schema: {
			pocket: {
				type: Array,
				optional: true,
			},
			"pocket.$": String,
			type: {
				type: Array,
				optional: true,
			},
			"type.$": Number,
		},
		transform(client = {}, server = {}) {
			const query = {};
			Object.keys(client).forEach((key) => {
				query[key] = { $in: client[key] };
			});
			return Object.assign({}, query, server);
		},
	},
};

// /////////////////////////////////////////////////////////////////////////////
//
//  METHODS
//
// /////////////////////////////////////////////////////////////////////////////

/**
 * Returns all unit docs that have a task referenced.
 * If the user is not curriculum user this is only limit to the docs she owns.
 */

Unit.methods.byTaskId = {
	name: "unit.methods.byTaskid",
	schema: {
		taskId: String,
	},
	roles: Hierarchy.teacher,
	run: onServerExec(() => {
		const { getUnitsByTaskId } = require("./methods/getUnitsByTaskId");

		return async function ({ taskId }) {
			const { userId } = this;
			return getUnitsByTaskId({ taskId, userId });
		};
	}),
};

Unit.methods.unlinkTask = {
	name: "unit.methods.unlinkTask",
	schema: { taskId: String },
	role: Hierarchy.teacher,
	run: onServerExec(() => {
		const { unlinkUnitTask } = require("./methods/unlinkUnitTask");
		return async function ({ taskId }) {
			const { userId } = this;
			return unlinkUnitTask({ userId, taskId });
		};
	}),
};

/**
 * Returns all relate documents for a given unitId, mostly
 * required in editors.
 */
Unit.methods.getEditorDocs = {
	name: "unit.methods.getEditorDocs",
	schema: { unitId: String },
	role: Hierarchy.teacher,
	run: onServerExecLazy(() => require("./methods/getEditorDocs").getEditorDocs),
};

Unit.methods.remove = {
	name: "unit.methods.remove",
	schema: { _id: String },
	role: Hierarchy.curriculum,
	run: onServerExec(() => {
		const { deleteUnit } = require("./methods/deleteUnit");

		return async function ({ _id }) {
			const { userId } = this;
			return deleteUnit({ unitId: _id, userId });
		};
	}),
};

Unit.methods.loadMaterial = {
	name: "unit.methods.loadMaterial",
	schema: { _id: String },
	role: Hierarchy.teacher,
	run: onServerExec(() => {
		const { loadMaterial } = require("./methods/loadMaterial");

		return async function ({ _id }) {
			const { userId } = this;
			return loadMaterial({ unitId: _id, userId });
		};
	}),
};

Unit.publications = {};

Unit.publications.editor = {
	name: "unit.publications.editor",
	schema: {
		unitId: String,
	},
	role: Hierarchy.teacher,
	run: onServer(({ unitId }) => getCollection(Unit.name).find({ _id: unitId })),
};
