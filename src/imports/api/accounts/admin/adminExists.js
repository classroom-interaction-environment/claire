import { Admin } from '../../../contexts/system/accounts/admin/Admin'
import { getCollection } from '../../utils/getCollection'

export const adminExists = function () {
  return getCollection(Admin.name).find().count() > 0
}
