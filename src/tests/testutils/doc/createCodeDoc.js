import { Random } from "meteor/random";
import { Hierarchy } from "../../../imports/api/accounts/roles/Hierarchy";

export const createCodeDoc = ({
	maxUsers = 1,
	registeredUsers = [],
	institution = "Super School",
	expires = 1,
	role = Hierarchy.student,
	firstName = "John",
	lastName = "Doe",
	email = `${Random.id()}@example.com`,
	classId = Random.id(),
	invalid = false,
	createdBy = undefined,
} = {}) => ({
	_id: Random.id(),
	createdAt: new Date(),
	createdBy: createdBy,
	code: Random.id(4),
	expires: expires,
	role: role,
	firstName: firstName,
	lastName: lastName,
	email: email,
	institution: institution,
	registeredUsers: registeredUsers,
	maxUsers: maxUsers,
	classId: classId,
	invalid: invalid,
});
