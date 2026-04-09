import { PermissionDeniedError } from "../../errors/types/PermissionDeniedError";
import { userOwnsDocument } from "../permission/checkOnwership";

/**
 * TODO rename to ensureOwnership
 * @param document
 * @param context
 * @param userId
 * @return {Promise<void>}
 */
export const checkOwnership = async ({ document, context, userId }) => {
	const docId = document._id;

	if (!(await userOwnsDocument(document, userId))) {
		throw new PermissionDeniedError("errors.notOwner", {
			context,
			docId,
			userId,
		});
	}
};
