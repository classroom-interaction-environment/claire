import H5PUser from '../implementations/H5PUser'
import {H5PAjaxEndpoint} from '@lumieducation/h5p-server'
import {H5PFactory} from '../H5PFactory'

export const listItems = async function () {
  const user = Meteor.users.findOne(this.userId)
  const ajaxEndpoint = new H5PAjaxEndpoint(H5PFactory.editor())
  return await ajaxEndpoint.getAjax(
    'content-type-cache',
    undefined,
    undefined,
    undefined,
    'de',
    new H5PUser(user)
  )
}
