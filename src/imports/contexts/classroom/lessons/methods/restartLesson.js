import { LessonStates } from "../LessonStates";
import { Meteor } from "meteor/meteor";
import { getDocsForMember } from "../helpers/getDocsForMember";
import { LessonErrors } from "../LessonErrors";
import { Lesson } from "../Lesson";
import { resetBeamer } from "../runtime/resetBeamer";
import { resetGroups } from "../runtime/resetGroups";
import { removeDocuments } from "../runtime/removeDocuments";
import { getCollection } from "../../../../api/utils/getCollection";

/**
 * Restarts a lesson by _id and removes all data that has been generated during the lesson run
 * TODO also check here if an inversion of control is possible, since we
 * TODO will definitely have to expand the list of contexts that will be used here
 * @throws Meteor.Error if lesson is not in running state and also not in completed state
 * @param _id The _id of the target lesson
 * @return {object} A boolean value, whether the operation has been successful
 */
export const restartLesson = async ({ lessonId, userId }) => {
	const { lessonDoc } = await getDocsForMember({ lessonId, userId });

	if (!LessonStates.canRestart(lessonDoc)) {
		throw new Meteor.Error(
			LessonErrors.unexpectedState,
			"lesson.errors.expectedRestartable",
			{ lessonId, userId },
		);
	}

	const options = { lessonId, userId, unitId: lessonDoc.unit };
	const runtimeDocs = await removeDocuments(options);
	const groupDocs = await resetGroups(options);
	const beamerReset = await resetBeamer(options);
	const lessonReset = await getCollection(Lesson.name).updateAsync(lessonId, {
		$unset: {
			phase: 1,
			startedAt: 1,
			completedAt: 1,
			artifacts: 1,
			uploads: 1,
			visibleStudent: 1,
			visibleBeamer: 1,
		},
	});

	return { runtimeDocs, beamerReset, lessonReset, groupDocs };
};
