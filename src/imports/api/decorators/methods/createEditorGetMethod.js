import { onServer } from "../../utils/archUtils";
import { getCollection } from "../../utils/getCollection";
import { Hierarchy } from "../../accounts/roles/Hierarchy";

const filesSchema = {
	meta: {
		type: Object,
		optional: true,
	},
	"meta.taskId": {
		type: String,
		optional: true,
	},
	"meta.unitId": {
		type: String,
		optional: true,
	},
};

export const createEditorGetMethod = ({ name, isFilesCollection }) => {
	const methodName = `${name}.methods.editor`;
	const schema = isFilesCollection ? filesSchema : {};
	return {
		name: methodName,
		schema: schema,
		role: Hierarchy.teacher,
		timeInterval: 500,
		numRequests: 1,
		run: onServer(({ meta }) => {
			const query = {};

			if (isFilesCollection && meta) {
				query.meta = meta;
			}

			return getCollection(name).find(query).fetchAsync();
		}),
	};
};
