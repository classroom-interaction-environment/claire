/**
 * Creates a compressed version of URL query containing invitation credentials.
 * @arch client
 * @param code required - The invitation code
 * @param firstName optional - The first name of the user
 * @param lastName optional - The last name of the user
 * @param email optional - Email of the user
 * @param institution optional - The institution the users are related to
 * @return {string} A compressed encoded URI component
 */
export const createInvitationURLQuery = ({
	code,
	firstName,
	lastName,
	email,
	institution,
}) => {
	const params = { code };

	if (firstName) params.firstName = firstName;
	if (lastName) params.lastName = lastName;
	if (email) params.email = email;
	if (institution) params.institution = institution;

	const jsonData = JSON.stringify(params);
	return encodeURIComponent(btoa(jsonData));
};
