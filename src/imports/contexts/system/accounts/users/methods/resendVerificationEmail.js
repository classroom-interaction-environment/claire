import { Accounts } from "meteor/accounts-base";
import { getUsersCollection } from "../../../../../api/utils/getUsersCollection";
import { userIsVerified } from "../../../../../api/accounts/user/userIsVerified";

/**
 * Resend verification email to user if not verified yet
 * @param userId
 * @return {Promise<void>}
 */
export const resendVerificationEmail = async ({ userId }) => {
	const user = await getUsersCollection().findOneAsync(userId);

	if (!user) {
		// fails silently to prevent sniffing email addresses
		return;
	}

	if (userIsVerified(user)) {
		// fails silently to prevent sniffing email addresses
		return;
	}

	// send mail
	Accounts.sendVerificationEmail(userId);
};
