import { Errors } from "../../../contexts/system/errors/Errors";
import { formatError } from "../both/formatError";
import { getCollection } from "../../utils/getCollection";

export const logError = async function logError({
	error,
	createdBy,
	createdAt,
	isServer,
	isClient,
	isMethod,
	isPublication,
	source,
}) {
	try {
		const ErrorCollection = getCollection(Errors);
		const existingError = await ErrorCollection.findOneAsync({
			stack: error.stack,
		});
		if (existingError) {
			// add user and timestamp
			await ErrorCollection.updateAsync(existingError._id, {
				$push: { history: { createdAt, createdBy } },
			});
			return existingError._id;
		} else {
			const formattedError = formatError(error);
			formattedError.isServer = isServer || false;
			formattedError.isClient = isClient || false;
			formattedError.isMethod = isMethod || false;
			formattedError.isPublication = isPublication || false;
			formattedError.history = [{ createdBy, createdAt }];
			formattedError.source = source;

			return ErrorCollection.insert(formattedError);
		}
	} catch (e) {
		console.warn("FATAL: Error while logging Error:");
		console.error(e);
		console.error("details", e.details);
		console.warn("caused by", error);
	}
};
