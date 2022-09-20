/**
 * Creates a combined unique ID for any material.
 * @param lessonId {String} _id of the associated lesson
 * @param referenceId {String} _id of the given reference
 * @param itemId {String} _id (optional) of a given item
 * @return {string} A combined id of type <lessonId>-<referenceId>-<itemId>
 */
export const createMaterialId = (lessonId, referenceId, itemId) => `${lessonId}-${referenceId}-${itemId}`
