import { Template } from "meteor/templating";
import "./docnotfound.html";

export const docnotfoundClassName = "document-not-found";

Template.docnotfound.onCreated(() => {});

Template.docnotfound.helpers({
	className() {
		return docnotfoundClassName;
	},
});
