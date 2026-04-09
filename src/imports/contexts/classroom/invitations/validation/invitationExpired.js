import { check, Match } from "meteor/check";
import { getInvitationOffset } from "./getInvitationOffset";
/**
 * Checks, whether a code doc is expired. Checks for validity and expiration date.
 * @param codeDoc {object}
 * @param codeDoc.invalid {boolean=} - the invalid flag for force-expired docs
 * @param codeDoc.createdAt {Date} - the creation date of the doc
 * @param codeDoc.expires {Number} - the number of days until expiration
 * @return {boolean} true if
 */
export const invitationExpired = (codeDoc) => {
	check(
		codeDoc,
		Match.ObjectIncluding({
			createdAt: Date,
			expires: Number,
		}),
	);

	const { invalid, createdAt, expires } = codeDoc;

	if (invalid) {
		return true;
	}

	const now = Date.now();
	const expirationDate = getInvitationOffset(new Date(createdAt), expires);
	return now - expirationDate >= 0;
};
