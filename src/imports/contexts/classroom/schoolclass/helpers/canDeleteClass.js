import { userIsAdmin } from '../../../../api/accounts/admin/userIsAdmin'

export const canDeleteClass = async (userId, { createdBy }) => {
  return createdBy === userId || await userIsAdmin(userId);
}
