import { invitationExpired } from "./invitationExpired";
import { invitationComplete } from "./invitationComplete";

/**
 * Validates a given code or codeDoc and returns true if the code is valid to be used, otherwise false
 * @param codeDoc {object} either a codeDoc or code to find a codeDoc
 * @return {boolean}
 */
export const validateInvitation = (codeDoc) => {
	if (!codeDoc) {
		throw new Error("validateInvitation: no codeDoc provided");
	}

	const isExpired = invitationExpired(codeDoc);
	const isComplete = invitationComplete(codeDoc);
	return !isExpired && !isComplete;
};
