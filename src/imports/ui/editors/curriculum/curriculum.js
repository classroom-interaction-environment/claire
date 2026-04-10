import { Template } from "meteor/templating";
import { curriculumViewStates } from "./curriculumViewStates";
import { curriculumEditorSubKey } from "./curriculumEditorSubKey";
import { getQueryParam } from "../../../api/routes/params/getQueryParam";
import { setQueryParams } from "../../../api/routes/params/setQueryParams";
import curriculumLanguage from "./i18n/curriculumLanguage";
import "../../layout/submenu/submenu";
import "../../generic/templateLoader/TemplateLoader";
import "./curriculum.html";

const viewStates = Object.values(curriculumViewStates);

const API = Template.curriculum.setDependencies({
	language: curriculumLanguage,
});

Template.curriculum.onCreated(function () {
	this.templateData = Object.assign({}, this.data, {
		insertDoc() {},
		updateDoc() {},
		deleteDoc() {},
	});

	this.autorun(() => {
		const view = getQueryParam("view");
		const currentView =
			curriculumViewStates[view] || curriculumViewStates.heuristics;

		this.state.set("currentView", currentView.name);
	});
});

Template.curriculum.onDestroyed(() => {
	API.dispose(curriculumEditorSubKey);
});

Template.curriculum.helpers({
	submenuData() {
		return {
			views: viewStates,
			queryParam: "view",
			getQueryParam: getQueryParam,
			updateQueryParam: setQueryParams,
		};
	},
	templateAtts() {
		const currentView = Template.getState("currentView");
		const viewState = curriculumViewStates[currentView];
		viewState.templateData = Template.instance().templateData;
		return viewState;
	},
});
