/* global $ */
import { Template } from "meteor/templating";
import { Task } from "../../../contexts/curriculum/curriculum/task/Task";
import { Unit } from "../../../contexts/curriculum/curriculum/unit/Unit";
import { Pocket } from "../../../contexts/curriculum/curriculum/pocket/Pocket";
import { Router } from "../../../api/routes/Router";
import { Shared } from "./helpers/shared";
import { Guide } from "../../tools/guide/Guide";
import { TaskEditorViewStates } from "./TaskEditorViewStates";
import { taskEditorSubKey } from "./taskEditorSubKey";
import { CurriculumSession } from "../../curriculum/CurriculumSession";
import { PermissionDeniedError } from "../../../api/errors/types/PermissionDeniedError";
import { dataTarget } from "../../utils/dataTarget";
import { $in } from "../../../api/utils/query/inSelector";
import { getQueryParam } from "../../../api/routes/params/getQueryParam";
import { getCollection } from "../../../api/utils/getCollection";
import { setQueryParams } from "../../../api/routes/params/setQueryParams";
import { callMethod } from "../../controllers/document/callMethod";
import { isCurriculumDoc } from "../../../api/decorators/methods/isCurriculumDoc";
import { userIsCurriculum } from "../../../api/accounts/userIsCurriculum";
import taskEditorLanguage from "./i18n/taskEditorLanguage";
import "../../layout/submenu/submenu";
import "../../generic/templateLoader/TemplateLoader";
import "../../components/documentState/documentState";
import "./taskEditor.scss";
import "./taskEditor.html";

/*******************************************************************************
 * The taskEditor Template is a HoC container template to manage basic data
 * loading of
 * - the current task doc
 * - the current unit doc
 * - the current pocket doc
 *
 * and view-state management.
 * It passes the data down to the respective views to let them handle the
 * current task-content editing.
 ******************************************************************************/

const API = Template.taskEditor.setDependencies({
	contexts: [Task, Unit, Pocket],
	language: taskEditorLanguage,
});

const views = Object.values(TaskEditorViewStates);

Template.taskEditor.onCreated(function () {
	const instance = this;
	instance.state.set("view", "pages");

	// ---------------------------------------------------------------------------
	// 0. Creating guide
	// ---------------------------------------------------------------------------+
	instance.autorun((c) => {
		if (!API.initComplete()) return;
		const createStep = ({ name, element, nextView }) => {
			const step = {
				elements: element
					? [element]
					: [`.te-${name}`, `li[data-key="${name}"]`],
				popover: {
					title: API.translate(`editor.task.guide.${name}.title`),
					description: API.translate(`editor.task.guide.${name}.text`),
				},
			};
			if (nextView) {
				step.popover.onNextClick = (_element, _step, options) => {
					const nextBtn = document.querySelector(".driver-popover-next-btn");
					nextBtn.disabled = true;
					setQueryParams({ task: nextView });
					instance.state.set("currentViewName", nextView);
					setTimeout(() => {
						options.driver.moveNext();
						nextBtn.disabled = false;
					}, 750);
				};
			}
			return step;
		};
		instance.guide = Guide.tour({
			key: "taskEditor",
			showButtons: ["next", "close"],
			steps: [
				{
					popover: {
						title: API.translate("editor.task.guide.welcome.title"),
						description: API.translate("editor.task.guide.welcome.text"),
					},
				},
				createStep({
					name: TaskEditorViewStates.pages.name,
				}),
				{
					element: ".add-content-buttons",
					popover: {
						title: API.translate(`editor.task.guide.elements.title`),
						description: API.translate(`editor.task.guide.elements.text`),
						onNextClick: (_element, _step, options) => {
							const nextBtn = document.querySelector(
								".driver-popover-next-btn",
							);
							nextBtn.disabled = true;
							const contentBtn = document.querySelector(
								'.add-content-entry[data-target="item"]',
							);
							contentBtn.click();
							setTimeout(() => {
								options.driver.moveNext();
								nextBtn.disabled = false;
							}, 750);
						},
					},
				},
				{
					element: "#pageContentAddModal > .modal-dialog",
					popover: {
						title: API.translate(`editor.task.guide.items.title`),
						description: API.translate(`editor.task.guide.items.text`),
						onNextClick: (_element, _step, options) => {
							const nextBtn = document.querySelector(
								".driver-popover-next-btn",
							);
							nextBtn.disabled = true;
							API.hideModal("pageContentAddModal");
							setTimeout(() => {
								options.driver.moveNext();
								nextBtn.disabled = false;
							}, 750);
						},
					},
				},
				createStep({
					element: ".te-entry-list",
					name: "listing",
					nextView: TaskEditorViewStates.summary.name,
				}),
				createStep({
					name: TaskEditorViewStates.summary.name,
					nextView: TaskEditorViewStates.units.name,
				}),
				createStep({
					name: TaskEditorViewStates.units.name,
				}),
				{
					elements: [".uematerial-cancel-edit-button.bottom-btn"],
					popover: {
						title: API.translate(`editor.task.guide.leave.title`),
						description: API.translate(`editor.task.guide.leave.text`),
						onNextClick: (_element, _step, options) => {
							instance.state.set(
								"currentViewName",
								TaskEditorViewStates.pages.name,
							);
							setTimeout(() => {
								options.driver.moveNext();
							}, 750);
						},
					},
				},
			],
		});

		// guide autostart
		instance.guide.autostart(({ hasViewed /*, start, stop */ }) => {
			const instance = Template.instance();
			const user = Meteor.user();
			if (
				instance.state.get("taskComplete") &&
				instance.state.get("unitComplete") &&
				instance.state.get("pocketComplete") &&
				user
			) {
				return hasViewed(user);
			}
		});

		c.stop();
	});

	const onError = (err) => API.fatal(err);

	instance.autorun(() => {
		const tab = getQueryParam("taskTab");
		if (!tab) return;
		const currentView = instance.state.get("view");
		if (currentView !== tab) {
			instance.state.set("view", tab);
		}
	});

	// load unit doc via method, if set by query param
	// since there is no need to track changes for units in this editor

	instance.autorun(() => {
		const unitId = Router.queryParam("unit");

		if (!unitId) {
			instance.state.set("unitDoc", null);
			instance.state.set("unitComplete", true);
			return;
		}

		callMethod({
			name: Unit.methods.get,
			args: { _id: unitId },
			failure: API.notify, // not fatal of unit is not loaded
			success: (unitDoc) => {
				instance.state.set("unitDoc", unitDoc);
				instance.state.set("unitComplete", true);
			},
		});
	});

	// subscribe to the single taskDoc as it changes often

	instance.autorun(() => {
		const currentData = Template.currentData();
		const taskId = currentData.taskId ?? Router.param("taskId");
		if (taskId) {
			instance.state.set("taskId", taskId);
			const taskDocQuery = { _id: $in([taskId]) };
			const taskSubCallback = {
				onReady() {
					const task = getCollection(Task.name).findOne(taskId);

					if (isCurriculumDoc(task)) {
						if (!userIsCurriculum()) {
							return API.fatal(
								new PermissionDeniedError("errors.notCurriculum", { taskId }),
							);
						}

						CurriculumSession.enable();
					}

					instance.state.set("taskDoc", task);
					instance.state.set("taskComplete", true);
				},
				onError,
			};
			API.subscribe({
				key: taskEditorSubKey,
				name: Task.publications.editor.name,
				args: taskDocQuery,
				callbacks: taskSubCallback,
			});
		}
	});

	// load pocket but only if we have a unitDoc linked

	instance.autorun(() => {
		const unitDoc = instance.state.get("unitDoc");
		if (!unitDoc) {
			instance.state.set("pocketDoc", null);
			instance.state.set("pocketComplete", true);
			return;
		}

		if (unitDoc.pocket !== "__custom__") {
			callMethod({
				name: Pocket.methods.get,
				args: { _id: unitDoc.pocket },
				failure: API.notify,
				success: (pocketDoc) => {
					instance.state.set("pocketDoc", pocketDoc);
					instance.state.set("pocketComplete", true);
				},
			});
		}
	});
});

Template.taskEditor.onRendered(function () {
	this.helpListener = () => {
		this.guide.start();
	};
	document
		.querySelector(".te-help-btn")
		.addEventListener("click", this.helpListener);
});

Template.taskEditor.onDestroyed(function () {
	document
		.querySelector(".te-help-btn")
		.removeEventListener("click", this.helpListener);
	API.dispose(taskEditorSubKey);
	this.state.destroy();
});

Template.taskEditor.helpers({
	loadComplete() {
		if (!API.initComplete()) {
			return;
		}

		const instance = Template.instance();
		return (
			instance.state.get("taskComplete") &&
			instance.state.get("unitComplete") &&
			instance.state.get("pocketComplete")
		);
	},
	submenuData() {
		const instance = Template.instance();
		return {
			views: views,
			tabType: "pills",
			queryParam: "taskTab",
			getQueryParam: getQueryParam,
			updateQueryParam: setQueryParams,
			onViewSelected: (currentViewName) =>
				instance.state.set({ currentViewName }),
		};
	},
	currentView() {
		const instance = Template.instance();
		const viewName = instance.state.get("currentViewName");
		const view = TaskEditorViewStates[viewName];
		if (!view) return;

		const taskDoc = Object.assign({}, instance.state.get("taskDoc"));
		const unitDoc = instance.state.get("unitDoc");
		const pocketDoc = instance.state.get("pocketDoc");

		const templateData = {
			unitDoc,
			taskDoc,
			pocketDoc,
		};

		return Object.assign({ templateData }, view);
	},
	currentViewName() {
		return Template.getState("currentViewName");
	},
	getTaskDoc() {
		return Template.getState("taskDoc");
	},
	pocketDoc() {
		return Template.getState("pocketDoc");
	},
	saving() {
		return Shared.cache.get("saving");
	},
	saved() {
		return Shared.cache.get("saved");
	},
	extendedMode() {
		return Template.getState("viewMode") === "extended";
	},
	unitDoc() {
		return Template.getState("unitDoc");
	},
	unitIcon() {
		return Unit.icon;
	},
});

Template.taskEditor.events({
	"change #taskeditor-taskselect"(event, templateInstance) {
		const value = $(event.target).val();
		const task = getCollection(Task.name).findOne(value);
		templateInstance.state.set("taskId", task._id);
	},
	"submit #basicDataForm"(event, _templateInstance) {
		event.preventDefault();
		console.warn("remove this?");
	},
	"click .taskeditor-tab-link"(event, templateInstance) {
		event.preventDefault();
		const viewName = dataTarget(event, templateInstance);
		Router.queryParam({ tab: viewName });
	},
	"change .task-editor-viewmode"(event, templateInstance) {
		const val = $(event.currentTarget).val();
		templateInstance.state.set("viewMode", val);
	},
});
