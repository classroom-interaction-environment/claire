import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Cluster } from "../Cluster";
import { addQuadrant } from "../../../../../../ui/interact/quadrantUtils";

import "./cluster.scss";
import "./cluster.html";
import { Beamer } from "../../../../../beamer/Beamer";
import { debounce } from "../../../../../../api/utils/debounce";
import { rgbToHex } from "../../../../../../ui/utils/color/rgbToHex";

const API = Template.rpCluster.setDependencies({
	contexts: [Cluster],
	debug: true,
});

Template.rpCluster.onCreated(function () {
	this.state.set("values", []);
	this.state.set("quadrants", []);
	this.state.set("quadrantEdit", -1);
	this.state.set("fontSize", 24);
	this.state.set("bgColor", "white");

	this.initialized = false;

	// add the displayable values from the result data
	this.autorun(() => {
		const data = Template.currentData();
		const results = [];

		data.results.forEach((resultDoc) => {
			if (!resultDoc.response || resultDoc.response.length === 0) return;
			const docId = resultDoc._id;
			const { createdBy, createdAt } = resultDoc;
			resultDoc.response.forEach((response, index) => {
				const responseId = `${docId}-${index}`;
				results.push({
					responseId,
					docId,
					createdBy,
					createdAt,
					response,
				});
			});
		});

		this.state.set("values", results);
	});

	this.autorun(() => {
		const beamerDoc = Beamer.doc.get();
		if (!beamerDoc) return;
		const bgColor = beamerDoc.ui?.background;
		if (bgColor) {
			this.state.set({ bgColor });
		}
	});

	this.autorun(() => {
		const data = Template.currentData();
		const rpApi = data.api;

		if (!rpApi.subscriptions.ready()) {
			return;
		}

		const { itemId, taskId, lessonId } = data;
		const loadedClusterDoc = rpApi.getCollection(Cluster.name).findOne({
			lessonId,
			taskId,
			itemId,
		});

		this.state.set({
			clusterDoc: loadedClusterDoc,
			loadComplete: true,
		});
	});
});

Template.rpCluster.onDestroyed(function () {
	const { Interact } = this.data.api;
	Interact.dispose({ target: "#cluster-parent", templateInstance: this });
	this.state.clear();
	this.data.api.dispose();
	this.initialized = false;
});

Template.rpCluster.onRendered(function () {
	const { api } = this.data;
	const { Interact } = api;

	// register edit action button to response-processor-api
	api.registerAction({
		id: "edit",
		type: "outline-primary",
		icon: "edit",
		label: "actions.edit",
		handler: (event) => {
			event.preventDefault();
			const edit = this.state.get("edit");
			this.state.set("edit", !edit);
		},
	});

	// on window resize we need to re-calculate the positions of the elements
	api.onResize((/* event */) => {
		API.debug("on resize");
		const edit = this.state.get("edit");
		const currentContainer = this.$(
			edit ? "#cluster-parent" : "#preview-parent",
		);
		const currentWidth = currentContainer.width();
		const currentHeight = currentContainer.height();
		this.state.set("currentWidth", currentWidth);
		this.state.set("currentHeight", currentHeight);

		updateLayout(this);
	});

	const onEnd = (/* event */) => {
		saveCluster({ templateInstance: this });
	};

	// Initialize the interaction handler for dragging the elements

	Interact.init({
		restrictTarget: "#cluster-parent",
		templateInstance: this,
		onEnd,
	});

	// instance.autorun(() => {
	//   const values = instance.state.get('values')
	//   const edit = instance.state.get('edit')
	//   if (!edit || !values?.length) {
	//     return
	//   }
	//
	//   setTimeout(() => {
	//     values.forEach(value => {
	//       const { responseId } = value
	//       API.debug('resize element text', responseId)
	//       const container = instance.$(`.text-container[data-id="${responseId}"]`).get(0)
	//       const text = container.firstElementChild.firstElementChild
	//       resizeText({ element: text, step: 1 })
	//     })
	//   }, 300)
	// })

	this.autorun(() => {
		const edit = this.state.get("edit");
		setTimeout(() => {
			const currentContainer = this.$(
				edit ? "#cluster-parent" : "#preview-parent",
			);
			const currentWidth = currentContainer.width();
			const currentHeight = currentContainer.height();
			API.debug("update container dimensions", { currentWidth, currentHeight });
			this.state.set("currentWidth", currentWidth);
			this.state.set("currentHeight", currentHeight);
		}, 100);
	});

	this.autorun(() => {
		this.state.get("edit"); // activate tracker
		updateLayout(this);
	});
});

const isOverflown = ({ clientHeight, scrollHeight }) =>
	scrollHeight > clientHeight;
const _resizeText = ({
	element,
	elements,
	minSize = 10,
	maxSize = 512,
	step = 0.5,
	unit = "px",
}) => {
	(elements || [element]).forEach((el) => {
		let i = minSize;
		let overflow = false;

		const parent = el.parentNode;

		while (!overflow && i < maxSize) {
			el.style.fontSize = `${i}${unit}`;
			overflow = isOverflown(parent);
			if (!overflow) i += step;
		}

		// revert to last state where no overflow happened
		el.style.fontSize = `${i - step}${unit}`;
	});
};

const defaultBg = "#fff";

Template.rpCluster.helpers({
	defaultBg() {
		return defaultBg;
	},
	bg() {
		return Template.getState("bgColor");
	},
	fontSize() {
		return Template.getState("fontSize");
	},
	itemTitle() {
		return Template.instance().data.title;
	},
	loadComplete() {
		return API.initComplete() && Template.getState("loadComplete");
	},
	values() {
		return Template.instance().state.get("values");
	},
	username(id) {
		const user = Meteor.users.findOne(id);
		return user?.username;
	},
	showVisibilityButton() {
		return (
			Template.instance().state.get("isTeacher") &&
			Template.instance().state.get("showVisibilityButton")
		);
	},
	templateInstance() {
		return Template.instance();
	},
	edit() {
		return Template.getState("edit");
	},
	spawnPos(index) {
		return index * 2;
	},
	saving() {
		return Template.getState("saving");
	},
	isCurrentDraggable(id) {
		console.debug("isCurrentDraggable", id, Template.getState("draggableId"));
		return Template.getState("draggableId") === id;
	},
	isTargetElement(id) {
		return id && Template.getState("targetElement") === id;
	},
	isOptionTarget(id) {
		return id && Template.getState("optionTarget") === id;
	},
	color() {
		return Template.getState("options").c;
	},
});

Template.rpCluster.events({
	"click #add-cluster-category-button"(event, templateInstance) {
		event.preventDefault();

		addQuadrant(templateInstance);
	},
	"keydown #add-cluster-category-input"(event, templateInstance) {
		if (event.key !== "Enter") return;
		event.preventDefault();

		addQuadrant(templateInstance);
	},

	// ///////// EDIT /////////////////////////////////////////////////

	"click .quadrant-settings-button"(event, templateInstance) {
		event.preventDefault();
		const indexStr = templateInstance.$(event.currentTarget).attr("data-index");
		const index = parseInt(indexStr, 10);
		templateInstance.state.set("quadrantEdit", index);
	},
	"click .quadrant-apply-edit-button"(event, templateInstance) {
		event.preventDefault();

		const quadrants = templateInstance.state.get("quadrants");
		const index = templateInstance.state.get("quadrantEdit");

		quadrants[index].name = templateInstance.$("#quadrant-edit-title").val();
		templateInstance.state.set("quadrants", quadrants);
		templateInstance.state.set("quadrantEdit", -1);
	},
	"click .quadrant-cancel-edit-button"(event, templateInstance) {
		event.preventDefault();
		templateInstance.state.set("quadrantEdit", -1);
	},
	"click .quadrant-delete-edit-button"(event, templateInstance) {
		event.preventDefault();
		const quadrants = templateInstance.state.get("quadrants");
		const index = templateInstance.state.get("quadrantEdit");

		quadrants.splice(index, 1);
		templateInstance.state.set("quadrants", quadrants);
		templateInstance.state.set("quadrantEdit", -1);
	},
	"keydown #quadrant-edit-title"(event, templateInstance) {
		if (event.key === "Enter") {
			event.preventDefault();

			const quadrants = templateInstance.state.get("quadrants");
			const index = templateInstance.state.get("quadrantEdit");

			quadrants[index].name = templateInstance.$("#quadrant-edit-title").val();
			templateInstance.state.set("quadrants", quadrants);
			templateInstance.state.set("quadrantEdit", -1);
		}

		if (event.key === "Escape") {
			event.preventDefault();
			templateInstance.state.set("quadrantEdit", -1);
		}
	},
	"click #reset-artifacts-button"(event, templateInstance) {
		event.preventDefault();
		const { Interact } = templateInstance.data.api;
		const elements = templateInstance.$(".draggable");
		elements.each((_index, element) => {
			Interact.transform(element, 0, 0, 0, 0);
			templateInstance.$(element).css("background-color", defaultBg);
		});
	},
	"click .edit-mode-button"(event, templateInstance) {
		event.preventDefault();
		const edit = templateInstance.state.get("edit");
		templateInstance.state.set("edit", !edit);
	},
	//= ===============================================================
	// DRAGGABLES
	//= ===============================================================
	"mouseenter .draggable"(event, templateInstance) {
		if (event.buttons) return; // skip if we currently drag another element
		const draggableId = templateInstance.data.api.dataTarget(
			event,
			templateInstance,
			"id",
		);
		templateInstance.state.set({ draggableId });
	},
	"mouseleave .draggable"(event, templateInstance) {
		const draggableId = templateInstance.data.api.dataTarget(
			event,
			templateInstance,
			"id",
		);
		const currentDraggableId = templateInstance.state.get("draggableId");
		if (currentDraggableId === draggableId) {
			templateInstance.state.set({ draggableId: null });
		}
	},
	"mousedown .draggable"(event, templateInstance) {
		const draggableId = templateInstance.data.api.dataTarget(
			event,
			templateInstance,
			"id",
		);
		const currentDraggableId = templateInstance.state.get("draggableId");
		if (draggableId !== currentDraggableId) {
			templateInstance.state.set({ draggableId });
		}

		const draggables = Array.from(document.querySelectorAll(".draggable"));
		const mapped = draggables.map((element) => {
			const zIndex = element.style.zIndex;
			return parseInt(zIndex, 10) || 1;
		});

		const maxZ = Math.max.apply(null, mapped);
		event.currentTarget.style.zIndex = maxZ + 1;
	},
	"click .preview-root"(event, templateInstance) {
		event.preventDefault();
		templateInstance.state.set("edit", true);
	},
	"dblclick .text-container"(event, templateInstance) {
		const id =
			event.currentTarget.getAttribute("id") ||
			event.currentTarget.getAttribute("data-id");
		const optionTarget = templateInstance.state.get("optionTarget");
		const isTarget = id === optionTarget;
		templateInstance.state.set({
			optionTarget: isTarget ? null : id,
		});
		if (isTarget) {
			setTimeout(() => {
				updateLayout(templateInstance);
			}, 100);
		} else {
			// load current data doc
			const clusterDoc = templateInstance.state.get("clusterDoc");
			const options = clusterDoc.elements.find((el) => el.id === id) || {};
			console.debug(options.c);
			if (options.c?.startsWith("rgb(")) {
				options.c = rgbToHex(...options.c.match(/\d+/g).map(Number));
			}
			templateInstance.state.set({ options });
		}
	},
	"input #font-size-range": debounce((event, templateInstance) => {
		const fontSize = Number.parseInt(event.target.value, 10);
		templateInstance.state.set({ fontSize });
	}, 10),
	"input #color-input": debounce((event, templateInstance) => {
		const elementId = event.target.getAttribute("data-element");
		const element = templateInstance.$(document.getElementById(elementId));
		element.data("c", event.target.value);
		element.css("background-color", event.target.value);
	}, 30),
	"blur .entry-options"(_event, templateInstance) {
		templateInstance.state.set("optionTarget", null);
		templateInstance.state.set("options", null);
		saveCluster({ templateInstance });
		updateLayout(templateInstance);
	},
});

function saveCluster({ templateInstance }) {
	API.debug("save cluster");
	const $draggables = templateInstance.$(".draggable");
	const container = templateInstance.$("#cluster-parent");
	const width = container.width() || 0;
	const height = container.height() || 0;
	const quadrants = templateInstance.state.get("quadrants") || [];
	const elements = [];

	let x;
	let y;
	let c;
	let id;

	$draggables.each((_index, element) => {
		id = element.getAttribute("id");
		x = parseFloat(element.getAttribute("data-x"));
		y = parseFloat(element.getAttribute("data-y"));
		if (Number.isNaN(x)) x = undefined;
		if (Number.isNaN(y)) y = undefined;
		c = element.getAttribute("data-c") || element.style.backgroundColor;
		elements.push({ x, y, c, id });
	});

	templateInstance.data.api.save({
		doc: { width, height, quadrants, elements },
		prepare: () => templateInstance.state.set("saving", true),
		receive: () =>
			setTimeout(() => templateInstance.state.set("saving", false), 300),
		failure: API.notify,
	});
}

function updateLayout(templateInstance) {
	API.debug("update layout");
	const { Interact } = templateInstance.data.api;
	const loadedClusterDoc = templateInstance.state.get("clusterDoc");
	const currentHeight = templateInstance.state.get("currentHeight");
	const currentWidth = templateInstance.state.get("currentWidth");

	if (
		!loadedClusterDoc ||
		typeof currentWidth === "undefined" ||
		typeof currentHeight === "undefined"
	) {
		return;
	}

	const { width } = loadedClusterDoc;
	const { height } = loadedClusterDoc;
	const { elements } = loadedClusterDoc;
	const _elements = {};
	elements.forEach((element) => {
		_elements[element.id] = element;
	});

	let tmp;
	const dx = currentWidth - width;
	const dy = currentHeight - height;
	let newx = 0;
	let newy = 0;

	const draggables = templateInstance.$(".draggable");
	draggables.each((_index, element) => {
		tmp = _elements[element.id];

		if (!tmp) {
			return console.warn(`found no element for id ${element.id}`, _elements);
		}

		// let's skip those elements, that
		// have not been moved at all, so they position
		// in the original stack position
		if (!tmp.x && !tmp.y) return;

		const $element = templateInstance.$(element);
		newx = Interact.getOffset(tmp.x, dx, width);
		newy = Interact.getOffset(tmp.y, dy, height);
		Interact.transform(element, newx, newy, tmp.x, tmp.y);
		if (tmp.c) {
			$element.css("background-color", tmp.c);
		} else {
			$element.css("background-color", defaultBg);
		}
	});

	// if (templateInstance.state.get('edit')) {
	//   setTimeout(() => {
	//     templateInstance.$('.text-container').each((index, element) => {
	//       const text = element.firstElementChild.firstElementChild
	//       resizeText({ element: text, step: 1 })
	//     })
	//   }, 500)
	// }
}
