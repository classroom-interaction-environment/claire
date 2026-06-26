import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Beamer } from "../../../contexts/beamer/Beamer";
import { SubsManager } from "../../subscriptions/SubsManager";
import { Lesson } from "../../../contexts/classroom/lessons/Lesson";
import { Unit } from "../../../contexts/curriculum/curriculum/unit/Unit";
import { Settings } from "../../../contexts/system/settings/Settings";
import { dataTarget } from "../../utils/dataTarget";
import { getQueryParam } from "../../../api/routes/params/getQueryParam";
import { getCollection } from "../../../api/utils/getCollection";
import { loadIntoCollection } from "../../../infrastructure/loading/loadIntoCollection";
import { getLocalCollection } from "../../../infrastructure/collection/getLocalCollection";
import { callMethod } from "../../controllers/document/callMethod";
import { i18n } from "../../../api/language/language";
import "../../components/color/selector/colorSelector";
import "../../generic/print/print";
import "./navBeamer.css";
import "./navBeamer.html";
/*
 Beamer nav contains a nav menu to trigger global beamer actions.
 */

const colorValues = Object.values(Beamer.ui.backgroundColors);
const gridLayouts = Object.values(Beamer.ui.gridLayouts);

const API = Template.navBeamer.setDependencies({
	contexts: [Lesson, Unit],
});

Template.navBeamer.onCreated(function onCreated() {
	this.state.set("availableLessons", []);

	this.autorun(() => {
		if (!Meteor.userId()) return;
		const beamerSub = SubsManager.subscribe(Beamer.publications.my.name);
		if (beamerSub.ready()) {
			const beamerDoc = Beamer.doc.get();
			this.state.set("beamerDoc", beamerDoc);
		}
	});

	callMethod({
		name: Settings.methods.logo.name,
		success: (link) => {
			if (link) {
				this.state.set("mainLogo", link);
			}
		},
	});
	API.subscribe({
		name: Lesson.publications.myRunning,
		args: {},
		key: "beamerSubKey",
		callbacks: {
			onError: API.notify,
			onReady: () => {
				this.state.set("lessonsSubComplete", true);
			},
		},
	});

	this.autorun(() => {
		if (!this.state.get("lessonsSubComplete")) {
			return;
		}

		const lessonId = getQueryParam("lessonId");
		const availableLessons = this.state.get("availableLessons");

		if (availableLessons.length > 0) {
			const currentLesson = availableLessons.find(
				(entry) => entry.lessonDoc._id === lessonId,
			);
			this.state.set({ currentLesson });
		}
	});

	this.autorun(() => {
		const beamerDoc = Beamer.doc.get();
		if (!beamerDoc || !this.state.get("lessonsSubComplete")) {
			return this.state.set({
				availableLessons: [],
			});
		}

		const query = {
			createdBy: Meteor.userId(),
			startedAt: { $exists: true },
			completedAt: { $exists: false },
		};
		const runningLessons = getCollection(Lesson.name).find(query);

		if (runningLessons.count() === 0) {
			return this.state.set({
				availableLessons: [],
			});
		}

		const unitIds = new Set();
		const classIds = new Set();

		runningLessons.forEach((lessonDoc) => {
			classIds.add(lessonDoc.classId);
			unitIds.add(lessonDoc.unit);
		});

		// load units for running lessons
		loadIntoCollection({
			name: Unit.methods.all,
			args: { ids: [...unitIds] },
			failure: API.fatal,
			collection: getLocalCollection(Unit.name),
			success: () => {
				const beamerRefs = beamerDoc.references ?? [];

				const availableLessons = runningLessons.map((lessonDoc) => {
					const refsCount = beamerRefs.filter(
						(ref) => ref.lessonId === lessonDoc._id,
					).length;
					const unitDoc = getLocalCollection(Unit.name).findOne(lessonDoc.unit);
					return {
						lessonDoc,
						unitDoc,
						refsCount,
					};
				});
				this.state.set({ availableLessons });
			},
		});
	});
	Beamer.doc
		.background()
		.then((background) => this.state.set({ background }))
		.catch(console.error);
});

Template.navBeamer.helpers({
	loadComplete() {
		const instance = Template.instance();
		return (
			i18n.initialized() &&
			API.initComplete() &&
			instance.state.get("beamerDoc") &&
			instance.state.get("lessonsSubComplete")
		);
	},
	active() {},
	beamerColors() {
		return colorValues;
	},
	gridLayouts() {
		return gridLayouts;
	},
	background() {
		return Template.getState("background");
	},
	onModal(type) {
		return Template.instance().state.get("onModal") === type;
	},
	isCurrentLayout(value) {
		const instance = Template.instance();
		const beamerDoc = instance.state.get("beamerDoc");
		return beamerDoc?.ui && beamerDoc.ui.grid === value;
	},
	mainLogo() {
		return Template.getState("mainLogo");
	},
	currentLesson() {
		return Template.getState("currentLesson");
	},
	availableLessons() {
		return Template.getState("availableLessons");
	},
});

Template.navBeamer.events({
	"click .modal-select-button"(event, templateInstance) {
		event.preventDefault();
		const type = dataTarget(event, templateInstance, "type");
		templateInstance.state.set("onModal", type);
		templateInstance.$("#beamer-select-modal").modal("show");
	},
	"click .color-selector-target": async (event, templateInstance) => {
		event.preventDefault();
		const background = dataTarget(event, templateInstance);
		try {
			const newColor = await Beamer.doc.background(background);
			templateInstance.state.set("background", newColor);
		} catch (err) {
			API.notify(err);
		}
	},
	"click .grid-selector-target": async (event, templateInstance) => {
		event.preventDefault();
		const value = dataTarget(event, templateInstance, "value");
		try {
			await Beamer.doc.grid(value);
		} catch (err) {
			API.notify(err);
		}
	},
});
