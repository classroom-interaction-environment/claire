/**
 * Checks if a document has been created by a given user, which makes her owner.
 * @param userId
 * @param createdBy
 * @return {*|boolean}
 */
export const isOwner = (userId, { createdBy }) => userId && userId === createdBy
