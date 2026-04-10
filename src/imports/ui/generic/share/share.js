import { Template } from "meteor/templating";
import "./share.html";

Template.share.onCreated(() => {});

Template.share.helpers({
	getLink() {
		return window.location;
	},
});
