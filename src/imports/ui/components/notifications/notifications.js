import { Template } from "meteor/templating";
import { Blaze } from "meteor/blaze";
import { Notify } from "./Notify";
import "./notifications.scss";
import "./notifications.html";

const API = Template.notifications.setDependencies({});
const i18nCodeRegEx = /^[\w\d.]+$/;

Template.notifications.helpers({
	loadComplete() {
		return API.initComplete();
	},
	queue() {
		return Object.values(Notify.getAll());
	},
});

Template.notifications.onRendered(function () {
	// parent node for dynamic rendering
	let parent;

	this.autorun(() => {
		if (!API.initComplete() || Notify.isEmpty()) {
			return;
		}

		if (!parent) {
			parent = this.$("#notification-target").get(0);
		}

		const data = Notify.get();
		Blaze.renderWithData(Template.notification, data, parent);
	});
});

Template.notification.helpers({
	translateMaybe(str) {
		console.debug("translateMaybe", str);
		if (str && i18nCodeRegEx.test(str)) {
			return API.translate(str);
		}
		return str;
	},
});

Template.notification.onRendered(function () {
	this.$(".toast").toast("show");
});

Template.notification.events({
	"hidden.bs.toast"(event) {
		API.debug("hidden", event.currentTarget.getAttribute("id"));
	},
});
