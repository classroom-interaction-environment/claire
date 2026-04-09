import { onServerExec } from "../../utils/archUtils";

export const createPreviewMethod = (context) => {
	return {
		name: `${context.name}.methods.preview`,
		schema: {
			_id: String,
			token: String,
		},
		run: onServerExec(() => {
			const { getCollection } = require("../../utils/getCollection");

			return async ({ _id, token }) => {
				const collection = getCollection(context.name);
				// TODO validate token
				return collection.findOneAsync({ _id });
			};
		}),
	};
};
