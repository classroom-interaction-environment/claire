import { Accounts } from "meteor/accounts-base";
import { getUserByEmail } from "../../../../../api/accounts/user/getUserByEmail";

export const sendResetPasswordEmail = async ({ email }) => {
	const user = await getUserByEmail(email);

	if (user) {
		return Accounts.sendResetPasswordEmail(user._id);
	}
	// fails silently to prevent sniffing email addresses
};
