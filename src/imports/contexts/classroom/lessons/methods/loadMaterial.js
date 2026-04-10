import { Group } from "../../group/Group";
import { LessonStates } from "../LessonStates";
import { LessonErrors } from "../LessonErrors";
import { createDocGetter } from "../../../../api/utils/document/createDocGetter";
import { noop } from "bootstrap/js/src/util";
import { getDocsForMember } from "../helpers/getDocsForMember";
import { loadMaterial } from "../../../material/loadMaterial";

const getGroupDoc = createDocGetter({ name: Group.name });

/**
 * Loads material relevant for a lesson.
 * Allows to skip already loaded material
 * @async
 * @param lessonId
 * @param groupId
 * @param userId
 * @param skip
 * @param log
 * @throws Meteor.Error if the lesson does not exists by given _id
 * @throws Meteor.Error if the no class is found for the linked classId
 * @throws Meteor.Error if the user is not member of the linked class
 * @throws Meteor.Error if a collection is not found by context, referenced in the material
 * @throws Meteor.Error if the document is not found by _id, referenced in the material
 * @return {undefined|{}} an Object containing all referenced documents, otherwise undefined
 */
export const loadLessonMaterial = async ({
	lessonId,
	groupId,
	userId,
	skip,
	log = noop,
}) => {
	// first we need the lesson doc for any further steps
	const { lessonDoc } = await getDocsForMember({
		userId,
		lessonId,
		isStudent: true,
	});

	// check if the lesson has an appropriate state
	if (!LessonStates.canToggle(lessonDoc)) {
		throw new Meteor.Error(
			LessonErrors.unexpectedState,
			"lesson.errors.expectedRunningOrComplete",
		);
	}

	const groupDoc = groupId && (await getGroupDoc(groupId));
	const allReferences = (lessonDoc.visibleStudent || []).concat(
		groupDoc?.visible || [],
	);
	log(allReferences);
	// if nothing to display, abort
	if (allReferences.length === 0) {
		return;
	}

	// prepare the material for loading multiple docs
	// the source list will be in the form of
	// { contextName1: [_id1, _id2, ...], ... }
	const materialSourceList = {};

	allReferences.forEach((ref) => {
		if (!materialSourceList[ref.context]) {
			materialSourceList[ref.context] = [];
		}

		if (!skip.includes(ref._id)) {
			materialSourceList[ref.context].push(ref._id);
		}
	});

	// load the material
	const dependencies = {};
	const material = {};

	await loadMaterial({
		source: materialSourceList,
		destination: material,
		dependencies: dependencies,
		skip: skip,
	});

	await loadMaterial({
		source: dependencies,
		destination: material,
		skip: skip,
	});

	return material;
};
