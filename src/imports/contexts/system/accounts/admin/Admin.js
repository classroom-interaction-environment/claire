import { Meteor } from "meteor/meteor";
import {
	onClient,
	onServer,
	onServerExec,
} from "../../../../api/utils/archUtils";
import { AdminErrors } from "./AdminErrors";
import { Hierarchy } from "../../../../api/accounts/roles/Hierarchy";

export const Admin = {
	name: "admin",
	label: "admins.title",
	icon: "user",
	publicFields: {
		_id: 1,
		userId: 1,
	},
};

Admin.schema = {
	userId: {
		type: String,
	},
};

/**
 * @deprecated
 */
Admin.errors = AdminErrors;

Admin.methods = {};

Admin.methods.reinvite = {
	name: "admin.methods.reinvite",
	schema: {
		userId: String,
	},
	roles: [Hierarchy.admin, Hierarchy.schoolAdmin],
	run: onServerExec(() => {
		const { Accounts } = require("meteor/accounts-base");
		const { userExists } = require("../../../../api/accounts/user/userExists");

		return async ({ userId }) => {
			if (!(await userExists({ userId }))) {
				throw new Meteor.Error("errors.docNotFound", "errors.userNotExists", {
					userId,
				});
			}

			return Accounts.sendEnrollmentEmail(userId);
		};
	}),
};

Admin.methods.createUser = {
	name: "admin.methods.createUser",
	roles: [Hierarchy.admin, Hierarchy.schoolAdmin],
	schema: (() => {
		const {
			emailSchema,
			firstNameSchema,
			roleSchema,
			institutionSchema,
			lastNameSchema,
		} = require("../../../../api/accounts/registration/registerUserSchema");

		return {
			role: roleSchema(),
			firstName: firstNameSchema(),
			lastName: lastNameSchema(),
			email: emailSchema({ label: true }),
			institution: institutionSchema(),
		};
	})(),
	run: onServerExec(() => {
		const { Accounts } = require("meteor/accounts-base");
		const {
			UserFactory,
		} = require("../../../../api/accounts/registration/UserFactory");
		const {
			createAdmin,
		} = require("../../../../api/accounts/admin/createAdmin");
		const {
			userIsAdmin,
		} = require("../../../../api/accounts/admin/userIsAdmin");
		const {
			PermissionDeniedError,
		} = require("../../../../api/errors/types/PermissionDeniedError");
		const { correctName } = require("../../../../api/utils/correctName");

		return async function ({ role, firstName, lastName, email, institution }) {
			const willBeAdmin = role === Hierarchy.admin;

			// deny any attempt to create a new admin from a non-admin account
			if (willBeAdmin && !(await userIsAdmin(this.userId))) {
				throw new PermissionDeniedError("roles.notAdmin", {
					userId: this.userId,
					firstName,
					lastName,
					email,
					role,
					institution,
				});
			}

			const options = { trim: true, upperCase: true };
			const newUserId = await UserFactory.create({
				firstName: correctName(firstName, options),
				lastName: correctName(lastName, options),
				institution: correctName(institution, options),
				email,
				role,
			});

			if (willBeAdmin) {
				await createAdmin(newUserId);
			}

			// send email but return new user's id
			await Accounts.sendEnrollmentEmail(newUserId);
			return newUserId;
		};
	}),
};

Admin.methods.removeUser = {
	name: "admin.methods.removeUser",
	roles: [Hierarchy.admin, Hierarchy.schoolAdmin],
	schema: {
		_id: String, // TODO change to userId
	},
	run: onServerExec(() => {
		const {
			rollbackAccount,
		} = require("../../../../api/accounts/registration/rollbackAccount");
		const { userExists } = require("../../../../api/accounts/user/userExists");
		const {
			userIsAdmin,
		} = require("../../../../api/accounts/admin/userIsAdmin");
		const {
			PermissionDeniedError,
		} = require("../../../../api/errors/types/PermissionDeniedError");
		const {
			DocNotFoundError,
		} = require("../../../../api/errors/types/DocNotFoundError");

		return async function ({ _id }) {
			if (!(await userExists({ userId: _id }))) {
				throw new DocNotFoundError("user.notExist", { _id });
			}

			// can't self delete in any case
			if (_id === this.userId) {
				throw new PermissionDeniedError("user.noSelfDelete", {
					userId: this.userId,
					_id,
				});
			}

			// only admin can remove admins
			if ((await userIsAdmin(_id)) && !(await userIsAdmin(this.userId))) {
				throw new PermissionDeniedError("roles.notAdmin", {
					userId: this.userId,
					_id,
				});
			}

			return rollbackAccount(_id);
		};
	}),
};

Admin.methods.updateRole = {
	name: "admin.methods.updateRole",
	roles: [Hierarchy.admin, Hierarchy.schoolAdmin],
	schema: (() => {
		const {
			roleSchema,
		} = require("../../../../api/accounts/registration/registerUserSchema");

		return {
			userId: {
				type: String,
				autoform: onClient({ type: "hidden" }),
			},
			role: roleSchema(),
			group: {
				type: String,
				autoform: onClient({ type: "hidden" }),
			},
		};
	})(),
	run: onServerExec(() => {
		const { Roles } = require("meteor/alanning:roles");
		const {
			createAdmin,
		} = require("../../../../api/accounts/admin/createAdmin");
		const {
			removeAdmin,
		} = require("../../../../api/accounts/admin/removeAdmin");
		const { userExists } = require("../../../../api/accounts/user/userExists");
		const {
			userIsAdmin,
		} = require("../../../../api/accounts/admin/userIsAdmin");
		const { getCollection } = require("../../../../api/utils/getCollection");
		const { roleExists } = require("../../../../api/accounts/roles/roleExists");
		const { Users } = require("../users/User");

		return async function ({ userId, role, group }) {
			const adminId = this.userId;
			if (adminId === userId) {
				throw new Meteor.Error(
					"admin.updateRoleFailed",
					"admin.noOwnRolesChangeAllowed",
					{ adminId, userId },
				);
			}

			if (!(await userExists({ userId }))) {
				throw new Meteor.Error(
					"admin.updateRoleFailed",
					Admin.errors.USER_NOT_FOUND,
					{ adminId, userId },
				);
			}

			if (!roleExists(role)) {
				throw new Meteor.Error("admin.updateRoleFailed", "roles.unknownRole", {
					adminId,
					userId,
					role,
					group,
				});
			}

			await Roles.setUserRolesAsync(userId, [role], group);

			const willBeAdmin = role === Hierarchy.admin;
			const isAdmin = await userIsAdmin(userId);

			if (willBeAdmin && !isAdmin) {
				await createAdmin(userId);
			}

			if (isAdmin && !willBeAdmin) {
				await removeAdmin(userId);
			}

			if (!(await Roles.userIsInRoleAsync(userId, role, group))) {
				throw new Meteor.Error("admin.updateRoleFailed", "roles.notAssigned", {
					adminId,
					userId,
					role,
					group,
				});
			}

			return getCollection(Users.name).updateAsync(userId, { $set: { role } });
		};
	}),
};

Admin.methods.users = {
	name: "admin.methods.users",
	roles: [Hierarchy.admin, Hierarchy.schoolAdmin],
	schema: {
		ids: {
			type: Array,
			optional: true,
		},
		"ids.$": String,
	},
	run: onServerExec(() => {
		const { Users } = require("../users/User");
		const { getCollection } = require("../../../../api/utils/getCollection");

		return async ({ ids }) => {
			const query = {};
			if (ids?.length) {
				query._id = { $in: ids };
			}
			return getCollection(Users.name)
				.find(query, { fields: { services: 0 } })
				.fetchAsync();
		};
	}),
};

Admin.methods.getInstitutions = {
	name: "admin.methods.getInstitutions",
	roles: [Hierarchy.schoolAdmin],
	schema: {},
	run: onServerExec(() => {
		const { getAllInstitutions } = require("./getAllInstitutions");
		return function () {
			const { userId } = this;

			return getAllInstitutions({ userId });
		};
	}),
};

Admin.methods.updateTheme = {
	name: "admin.methods.updateTheme",
	roles: [Hierarchy.schoolAdmin],
	schema: {
		theme: {
			type: String,
			optional: true,
		},
		reset: {
			type: Boolean,
			optional: true,
		},
	},
	run: onServerExec(() => {
		const { updateTheme } = require("./methods/updateTheme");
		return async function ({ theme, reset = false }) {
			const { userId } = this;
			return updateTheme({ userId, theme, reset });
		};
	}),
};

Admin.publications = {};

Admin.publications.usersByInstitution = {
	name: "admin.publications.usersByInstitution",
	schema: {
		institution: String,
	},
	roles: [Hierarchy.schoolAdmin],
	run: onServer(({ institution }) =>
		Meteor.users.find(
			{ institution },
			{
				fields: {
					username: 1,
					emails: 1,
					firstName: 1,
					lastName: 1,
					roles: 1,
					role: 1,
					presence: 1,
					institution: 1,
				},
			},
		),
	),
};
