import { Meteor } from "meteor/meteor";

/**
 * Decompresses and decodes a URL query parameter, created via {createURLQuery}
 * @param queryParams {string} The isolated queryparameter
 * @return {Object} the parses code doc credentials
 */
export const parseInvitationURLQuery = (queryParams) => {
	const decoded = decodeURIComponent(queryParams);
	const decompressed = atob(decoded);
	const parsed = JSON.parse(decompressed);
	if (!parsed || !parsed.code) {
		throw new Meteor.Error("codeInvitation.invalidQueryParams");
	}
	return parsed;
};
