import H5PUser from '../implementations/H5PUser'
import { H5PAjaxEndpoint } from '@lumieducation/h5p-server'
import { H5PFactory } from '../H5PFactory'
import { H5PTranslation } from '../H5PTranslation'

export const listItems = async function () {
  const user = Meteor.users.findOne(this.userId)
  console.debug(user)
  const locale = user?.locale
  const ajaxEndpoint = new H5PAjaxEndpoint(H5PFactory.editor())
  const data = await ajaxEndpoint.getAjax(
    'content-type-cache',
    undefined,
    undefined,
    undefined,
    locale ?? H5PTranslation.getLocale(),
    new H5PUser(user)
  )

  data.libraries = data.libraries.filter(lib => !!lib.installed)
  return data
}
