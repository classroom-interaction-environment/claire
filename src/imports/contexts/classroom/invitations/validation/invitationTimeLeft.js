import { getInvitationOffset } from "./getInvitationOffset";

/**
 * Returns the time left in ms between now and the expiration date
 * @param createdAt - the creation date of the doc
 * @param expires - the number of days until expiration
 * @return {number} a unix timestamp as integer
 */
export const invitationTimeLeft = (createdAt, expires) => {
	const now = Date.now();
	const expirationDate = getInvitationOffset(new Date(createdAt), expires);
	return expirationDate - now;
};
