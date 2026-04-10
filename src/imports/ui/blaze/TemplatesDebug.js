import { Meteor } from "meteor/meteor";

export const TemplatesDebug = {};

const internal = { templates: new Set() };

Meteor.startup(async () => {
	if ("sessionStorage" in window) {
		const templates = JSON.parse(
			sessionStorage.getItem("TemplatesDebug") || "[]",
		);
		internal.templates = new Set(templates);
		console.debug(
			"TemplatesDebug loadeded from sessionStorage:",
			templates,
			"=>",
			internal.templates,
		);
	}
});

TemplatesDebug.debug = (name, remove = false) => {
	const fullName = name.startsWith("Template.") ? name : `Template.${name}`;
	const value = remove
		? internal.templates.delete(fullName)
		: internal.templates.add(fullName);
	if ("sessionStorage" in window) {
		sessionStorage.setItem(
			"TemplatesDebug",
			JSON.stringify(Array.from(internal.templates)),
		);
	}
	return value;
};

TemplatesDebug.has = (name) => {
	console.debug("TemplatesDebug.has", name);
	const fullName = name.startsWith("Template.") ? name : `Template.${name}`;
	return internal.templates.has(fullName);
};
