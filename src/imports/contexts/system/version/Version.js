import { Meteor } from "meteor/meteor";

export const Version = {
	name: "version",
	label: "version.title",
	icon: "star",
	schema: {
		tag: String,
		commit: String,
	},
	methods: {
		get: {
			name: "version.methods.get",
			schema: {},
			isPublic: true,
		},
	},
};

if (Meteor.isServer) {
	const { VersionStore } = require("./server/store");
	Version.methods.get.run = () => VersionStore;
	Version.methods.get.validate = (...args) => {
		if (args.filter((val) => !!val).length > 0) {
			throw new Error();
		}
	};
}
