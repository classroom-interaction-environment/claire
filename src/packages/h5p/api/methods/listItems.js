import { Meteor } from 'meteor/meteor'
import H5PUser from '../implementations/H5PUser'
import { H5PAjaxEndpoint } from '@lumieducation/h5p-server'
import { H5PFactory } from '../H5PFactory'
import { H5PTranslation } from '../H5PTranslation'

let ajaxEndpoint
const getEndpoint = () => {
  if (!ajaxEndpoint) {
    ajaxEndpoint = new H5PAjaxEndpoint(H5PFactory.editor())
  }
  return ajaxEndpoint
}

/**
 * Lists installed H5P content types
 * @returns {{ libraries: Array.<Object> }}
 */
export const listItems = async function () {
  const user = Meteor.users.findOne(this.userId)
  const locale = user?.locale
  const data = await getEndpoint().getAjax(
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
