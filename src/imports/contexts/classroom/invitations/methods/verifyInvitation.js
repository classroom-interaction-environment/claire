import { createDocGetter } from "../../../../api/utils/document/createDocGetter";
import { SchoolClass } from "../../schoolclass/SchoolClass";
import { CodeInvitation } from "../CodeInvitations";
import { Meteor } from "meteor/meteor";
import { invitationExpired } from "../validation/invitationExpired";
import { invitationComplete } from "../validation/invitationComplete";

export const verifyInvitation = async ({ code }) => {
	const getCodeDoc = createDocGetter({
		name: CodeInvitation.name,
		optional: true,
	});
	const getClassDoc = createDocGetter({ name: SchoolClass.name });
	const codeDoc = await getCodeDoc({ code });

	if (!codeDoc || invitationExpired(codeDoc) || invitationComplete(codeDoc)) {
		throw new Meteor.Error(
			CodeInvitation.errors.invalidLink,
			CodeInvitation.errors.invalidLinkReason,
			{ code },
		);
	}

	let classDoc;

	if (codeDoc.classId) {
		classDoc = await getClassDoc(codeDoc.classId);
	}

	return {
		firstName: codeDoc.firstName,
		lastName: codeDoc.lastName,
		role: codeDoc.role,
		institution: codeDoc.institution,
		email: codeDoc.email,
		classId: codeDoc.classId,
		className: classDoc?.title,
	};
};
