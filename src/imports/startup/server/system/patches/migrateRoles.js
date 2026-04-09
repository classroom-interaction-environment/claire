import { Meteor } from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";
import { createLog } from "../../../../api/log/createLog";

const shouldMigrate = Meteor.settings.patch?.roles;
const info = createLog({ name: "Roles" });
const migrateRoles = async (count) => {
	info("running database migration, count=", count);
	await Roles._forwardMigrate();
	await Roles._forwardMigrate2();

	// update users roles
	const allUsers = Meteor.users
		.find({}, { fields: { _id: 1, roles: 1 } })
		.fetchAsync();
	for (const user of allUsers) {
		if (!user.roles?.length) {
			const roles = await Roles.getRolesForUserAsync(user._id);
			const updated = await Meteor.users.updateAsync(user._id, {
				$addToSet: { roles },
			});
			info("updated roles for user after migrate:");
			info(">", user._id);
			info(">", roles);
			info(">", updated ? "updated" : "failed");
		}
	}
};

if (shouldMigrate) {
	for (let i = 0; i < 3; i++) {
		try {
			await migrateRoles(i);
		} catch (e) {
			console.error(e);
		}
	}
} else {
	info("skip patch migration script");
}
