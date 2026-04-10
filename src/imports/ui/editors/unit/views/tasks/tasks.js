import { Template } from "meteor/templating";
import { Task } from "../../../../../contexts/curriculum/curriculum/task/Task";
import { Unit } from "../../../../../contexts/curriculum/curriculum/unit/Unit";
import { Phase } from "../../../../../contexts/curriculum/curriculum/phase/Phase";
import { MaterialSubviews } from "../material/MaterialSubviews";
import { unitEditorSubscriptionKey } from "../../unitEditorSubscriptionKey";
import { loadIntoCollection } from "../../../../../infrastructure/loading/loadIntoCollection";
import { getLocalCollection } from "../../../../../infrastructure/collection/getLocalCollection";
import { unique } from "../../../../../utils/array/unique";
import { $in } from "../../../../../api/utils/query/inSelector";
import { getCollection } from "../../../../../api/utils/getCollection";
import { createMaterialEvents } from "../common/createMaterialEvents";
import { createMaterialHelpers } from "../common/createMaterialHelpers";
import { createMaterialEdit } from "../common/createMaterialEdit";
import "./tasks.html";
import { Schema } from "../../../../../api/schema/Schema";
import { formIsValid } from "../../../../components/forms/formUtils";
import { updateContextDoc } from "../../../../controllers/document/updateContextDoc";

const API = Template.uetasks.setDependencies({
	contexts: [Unit, Phase, Task],
	useForms: true,
});

const TaskEditor = {
	loaded: false,
	load: async () => {
		if (TaskEditor.loaded) return;
		await import("../../../task/taskEditor");
		TaskEditor.loaded = true;
	},
};

Template.uetasks.onCreated(function () {
	// ===========================================================================
	// 1. load subview
	// ===========================================================================
	const subView = MaterialSubviews.create({ name: Task.name });
	this.getViewState = () => subView;

	const { load } = subView;
	load()
		.catch((e) => API.fatal(e))
		.then(() => {
			subView.loaded = true;
			this.state.set("loadComplete", true);
		});

	this.autorun(() => {
		const { unitDoc, originalUnitDoc } = Template.currentData();
		const originalRequired = !!unitDoc?._original;
		const originalProvided = originalRequired ? !!originalUnitDoc : true;
		if (!unitDoc || !originalProvided) return;

		const taskIds = unitDoc[Task.fieldName] ?? [];
		const originalIds = originalUnitDoc?.[Task.fieldName] ?? [];
		const ids = unique([...taskIds, ...originalIds]);
		if (ids.length === 0) return this.state.set("dataComplete", true);
		loadIntoCollection({
			name: Task.methods.all,
			collection: getLocalCollection(Task.name),
			args: { ids },
			failure: API.fatal,
			success: () => {
				this.state.set({
					dataComplete: true,
					hasDocuments:
						getLocalCollection(Task.name)
							.find({ _id: $in(taskIds) })
							.count() > 0,
				});
			},
		});
	});

	// ===========================================================================
	// 2. subscribe phases
	// ===========================================================================

	// if the unit doc changes we need to subscribe to the phases, because
	// we need on every material the option to add / remove it to/from phases
	this.autorun(() => {
		const data = Template.currentData();
		const { unitDoc, originalUnitDoc } = data;
		const phaseQuery = { _id: $in(unitDoc.phases || []) };
		const cb = {
			onReady: () => {
				const phases = (unitDoc.phases || []).map((phaseId) =>
					getCollection(Phase.name).findOne(phaseId),
				);
				this.state.set({
					phases: phases,
					phaseSubComplete: true,
				});
			},
		};

		// get all phases that are currently linked by this unit
		API.subscribe({
			key: unitEditorSubscriptionKey,
			name: Phase.publications.editor.name,
			args: phaseQuery,
			callbacks: cb,
		});

		// note, that data.originalUnitDoc may not be present
		// when editing unit master docs (curriculum docs)
		this.state.set({ unitDoc, originalUnitDoc });
	});

	// ===========================================================================
	// Actions
	// ===========================================================================
	this.edit = createMaterialEdit({
		API,
		templateInstance: this,
		onBefore: ({ materialId }) => this.state.set("selectForEdit", materialId),
		onComplete: async ({ insertDoc }) => {
			await TaskEditor.load();
			this.state.set({ edit: insertDoc, selectForEdit: null });
		},
	});
});

Template.uetasks.helpers({
	loadComplete() {
		const instance = Template.instance();
		return (
			API.initComplete() &&
			instance.state.get("loadComplete") &&
			instance.state.get("phaseSubComplete") &&
			instance.state.get("dataComplete")
		);
	},
	dontShowList() {
		return (
			Template.getState("creating") ||
			Template.getState("edit") ||
			Template.getState("selectForEdit")
		);
	},

	showHeaderButtons(_entries) {
		if (!API.initComplete()) {
			return false;
		}

		const instance = Template.instance();
		if (
			instance.state.get("creating") ||
			instance.state.get("edit") ||
			instance.state.get("selectForEdit")
		) {
			return false;
		}

		return (
			instance.state.get("dataComplete") && instance.state.get("hasDocuments")
		);
	},
	editTitle() {
		return Template.getState("editTitle");
	},
	editTitleSchema() {
		const instance = Template.instance();
		return instance.editTitleSchema;
	},
	showBigButtons() {
		if (!API.initComplete()) {
			return false;
		}

		const instance = Template.instance();
		if (
			instance.state.get("creating") ||
			instance.state.get("edit") ||
			instance.state.get("selectForEdit")
		) {
			return false;
		}

		return (
			instance.state.get("dataComplete") && !instance.state.get("hasDocuments")
		);
	},
	...createMaterialHelpers({ API }),
});

Template.uetasks.events({
	"click .uematerial-cancel-edit-button"(event, templateInstance) {
		event.preventDefault();
		templateInstance.state.set("edit", null);
	},
	"click .edit-title-btn"(event, templateInstance) {
		event.preventDefault();
		if (!templateInstance.editTitleSchema) {
			templateInstance.editTitleSchema = Schema.create({
				title: Task.schema.title,
				description: Task.schema.description,
			});
		}
		templateInstance.state.set("editTitle", true);
		API.showModal("edit-title-modal");
	},
	"hidden.bs.modal #edit-title-modal"(_event, templateInstance) {
		templateInstance.state.set("editTitle", null);
	},
	"submit #editTitleForm"(event, templateInstance) {
		event.preventDefault();
		templateInstance.state.set("processing", true);
		const taskDoc = templateInstance.state.get("edit");
		const updateDoc = formIsValid(
			templateInstance.editTitleSchema,
			"editTitleForm",
		);
		updateContextDoc({
			context: Task,
			_id: taskDoc._id,
			doc: updateDoc,
			receive: () => templateInstance.state.set("processing", null),
			failure: (er) => API.notify(er),
			success: (updated) => {
				const notify = !!updated;
				API.notify(notify);
				API.hideModal("edit-title-modal");
				Object.assign(taskDoc, updateDoc);
				templateInstance.state.set("edit", taskDoc);
				getLocalCollection(Task.name).update(taskDoc._id, { $set: updateDoc });
			},
		});
	},
	...createMaterialEvents({
		API,
		onMaterialCreated: ({ materialId, templateInstance, isMasterMaterial }) =>
			templateInstance.edit({ taskId: materialId, isMasterMaterial }),
	}),
});
