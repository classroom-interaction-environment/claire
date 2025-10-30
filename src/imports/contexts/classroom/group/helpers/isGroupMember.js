/**
 * Check if user is member of the group
 * @param userId
 * @param groupDoc
 * @return {*}
 */
export const isGroupMember = (userId, groupDoc) => {
  const users = groupDoc?.users
  return users && users.find(u => u && u.userId === userId)
}
