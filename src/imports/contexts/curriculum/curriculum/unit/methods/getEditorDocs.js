import { getCollection } from "../../../../../api/utils/getCollection";

export const getEditorDocs = () => {
	const { Pocket } = require("../../pocket/Pocket");
	const { Lesson } = require("../../../../classroom/lessons/Lesson");
	const {
		SchoolClass,
	} = require("../../../../classroom/schoolclass/SchoolClass");
	const { Unit } = require("../Unit");

	const UnitCollection = getCollection(Unit.name);
	const PocketCollection = getCollection(Pocket.name);
	const SchoolClassCollection = getCollection(SchoolClass.name);
	const LessonCollection = getCollection(Lesson.name);

	return async function ({ unitId }) {
		const { checkDoc, checkOwner, userId } = this;
		const unitDoc = await UnitCollection.findOneAsync(unitId);
		checkDoc(unitDoc);
		checkOwner(unitDoc);

		const lessonDoc = await LessonCollection.findOneAsync({
			unit: unitId,
			createdBy: userId,
		});
		const originalUnitDoc = await UnitCollection.findOneAsync({
			_id: lessonDoc?.unitOriginal,
		});
		const pocketDoc = await PocketCollection.findOneAsync({
			_id: unitDoc.pocket,
		});
		const classDoc = await SchoolClassCollection.findOneAsync({
			_id: lessonDoc?.classId,
		});
		return {
			lessonDoc,
			originalUnitDoc,
			pocketDoc,
			classDoc,
		};
	};
};
