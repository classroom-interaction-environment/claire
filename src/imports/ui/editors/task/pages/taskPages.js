import { Template } from "meteor/templating";
import { Shared } from "../helpers/shared";
import { Task } from "../../../../contexts/curriculum/curriculum/task/Task";
import "../pagecontent/pageContent";
import "./taskPages.html";

/*******************************************************************************
 * UPDATE DECEMBER 2025
 * This Template now acts only as a simple wrapper, beforehand there were pages
 * to be edited.
 * - pages are kept for backwards compatibility but will be handled as "single page"
 * - there is no more page navigation
 *******************************************************************************/

Template.taskPages.setDependencies({
	contexts: [Task],
});

Template.taskPages.onCreated(function () {
	this.state.set("currentIndex", 0);

	// bind fct
	Shared.updatePage = (index, page) => {
		this.state.set("currentIndex", index);
		this.state.set("currentPage", page);
	};

	this.autorun(() => {
		const data = Template.currentData();
		const { taskDoc } = data;

		if (!this.state.get("currentPage")) {
			this.state.set(
				"currentPage",
				taskDoc.pages?.[0] || {
					title: "",
					content: [],
				},
			);
		}

		this.state.set("taskDoc", taskDoc);
		this.state.set("pages", taskDoc.pages);
	});
});

Template.taskPages.helpers({
	currentPage() {
		return Template.getState("currentPage");
	},
	currentIndex() {
		return Template.getState("currentIndex");
	},
	task() {
		return Template.getState("taskDoc");
	},
});
