import { onClientExec, onServer } from "../utils/archUtils";
import { Meteor } from "meteor/meteor";

export const UserRoles = {
	name: "userRoles",
};

UserRoles.publications = {};

UserRoles.publications.my = {
	name: "userRoles.publications.my",
	schema: {},
	isPublic: true,
	run: onServer(function () {
		const { userId } = this;
		if (userId) {
			return Meteor.roleAssignment.find({ "user._id": userId });
		}
		this.ready();
	}),
};

UserRoles.subscription = onClientExec(() =>
	Meteor.subscribe(UserRoles.publications.my.name),
);
