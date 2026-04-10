import { check } from "meteor/check";
import { getFilesCollection } from "../getFilesCollection";
import { getCollection } from "../getCollection";
import { DocNotFoundError } from "../../errors/types/DocNotFoundError";
import { userIsAdmin } from "../../accounts/admin/userIsAdmin";
import { checkOwnership } from "./checkOwnership";
import { count } from "../../../utils/count";
import { noop } from "../../../utils/noop";

/**
 * @param options {object}
 * @param options.name {string}
 * @param options.isFilesCollection {boolean=}
 * @param options.checkOwner {boolean=}
 * @param options.multiple {boolean=}
 * @return {(function(*): Promise<number>)}
 */
export const createDocRemover = (options) => {
	const {
		name,
		isFilesCollection = false,
		checkOwner = true,
		multiple = false,
	} = options;
	check(name, String);

	if (multiple) {
		return async (options) => {
			const userId = options.userId;
			const query = options.query && { ...options.query };
			const debug = options.debug ?? noop;
			const Collection = isFilesCollection
				? getFilesCollection(name)
				: getCollection(name);

			// count documents to be removed and skip early
			// if there are no docs by given query
			const target = isFilesCollection ? Collection.collection : Collection;
			const docCount = await count(target, query);
			if (docCount === 0) {
				debug({ name, query, count: docCount, removed: 0 });
				return 0;
			}

			// if this is sensitive data, we need to check ownership for each document
			const checkRequired = checkOwner && !(await userIsAdmin(userId));
			if (checkRequired) {
				query.createdBy = userId;
			}

			let removed;

			if (isFilesCollection) {
				await Collection.removeAsync(query);
				removed = docCount;
			} else {
				removed = await Collection.removeAsync(query);
			}
			debug({ name, query, count: docCount, removed });
			return removed;
		};
	}

	// single document remover
	return async ({ _id, userId, debug = noop }) => {
		const Collection = isFilesCollection
			? getFilesCollection(name)
			: getCollection(name);

		const document = await Collection.findOneAsync(_id);
		if (!document) throw new DocNotFoundError(_id, name);

		const checkRequired = checkOwner && !(await userIsAdmin(userId));
		if (checkRequired) {
			await checkOwnership({
				doc: document,
				collection: Collection,
				docId: _id,
				userId,
			});
		}

		let removed;
		const query = { _id };
		if (isFilesCollection) {
			Collection.remove(query);
			removed = 1;
		} else {
			removed = Collection.remove(query);
		}
		debug({ name, _id, removed });
		return removed;
	};
};
