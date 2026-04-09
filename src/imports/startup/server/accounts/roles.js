import { Meteor } from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";
import { UserUtils } from "../../../contexts/system/accounts/users/UserUtils";
import { createLog } from "../../../api/log/createLog";
import { $nin } from "../../../api/utils/query/notInSelector";

const { admin, student, schoolAdmin, teacher, curriculum } = UserUtils.roles;
const log = createLog({ name: "Roles" });

log("setup roles");
const allRoles = [admin, schoolAdmin, teacher, student, curriculum];

for (const role of allRoles) {
	log(`create role [${role}] if not exists`);
	await Roles.createRoleAsync(role, { unlessExists: true });
}
// build internal hierarchy
// to allow inheritance of roles
log("create hierarchy");
Roles.addRolesToParentAsync(schoolAdmin, admin, { unlessExists: true });
Roles.addRolesToParentAsync(curriculum, schoolAdmin, { unlessExists: true });
Roles.addRolesToParentAsync(teacher, curriculum, { unlessExists: true });
Roles.addRolesToParentAsync(student, teacher, { unlessExists: true });

log("remove unused / deprecated roles");
const removedRoles = await Meteor.roles.removeAsync({ _id: $nin(allRoles) });

if (removedRoles) {
	log("removed", removedRoles, "roles");
}

log("setup complete");
