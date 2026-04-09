/* global AutoForm */
import { Template } from "meteor/templating";
import { dataTarget } from "../../utils/dataTarget";
import { ReactiveSet } from "../../../api/utils/reactive/ReactiveSet";
import "./treeSelect.html";

AutoForm.addInputType("treeSelect", {
	template: "afTreeSelect",
	valueOut() {
		const value = this.val() ?? this.value;
		return value.split(",");
	},
	valueIn(initialValue) {
		return initialValue;
	},
});

Template.afTreeSelect.onCreated(function () {
	const { documents = [], renderer, ...inputAtts } = this.data.atts;
	const initialValue = Array.isArray(this.data.value) ? this.data.value : [];
	this.ids = new ReactiveSet();
	initialValue.forEach((v) => {
		this.ids.add(v);
	});
	this.state.set({ documents, renderer, inputAtts });
});

Template.afTreeSelect.onRendered(function () {
	const dataSchemaKey = this.data.atts["data-schema-key"];
	this.autorun(() => {
		const ids = this.ids.all();
		this.$(`input[data-schema-key="${dataSchemaKey}"]`).val(ids.join(","));
	});
});

Template.afTreeSelect.helpers({
	ids() {
		return Template.instance().ids;
	},
	documents() {
		return Template.getState("documents");
	},
	renderer() {
		return Template.getState("renderer");
	},
	nodeData(doc) {
		return {
			renderer: Template.getState("renderer"),
			doc,
		};
	},
	inputAtts() {
		return {
			type: "hidden",
			...Template.getState("inputAtts"),
		};
	},
});

Template.afTreeSelectNode.helpers({
	isAdded(id) {
		return Template.instance().data.ids.has(id);
	},
});

Template.afTreeSelectNode.events({
	"click .af-treeselect-button"(event) {
		event.preventDefault();
		const type = dataTarget(event, "action");
		const docId = dataTarget(event, "id");
		const ids = Template.instance().data.ids;
		if (type === "add") {
			ids.add(docId);
		} else {
			ids.delete(docId);
		}
	},
});
