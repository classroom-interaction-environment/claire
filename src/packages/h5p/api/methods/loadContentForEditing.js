import { H5PFactory } from '../H5PFactory'
import H5PUser from '../implementations/H5PUser'

const languageOverride = 'auto'

/**
 * Gets the data needed to render the editor with
 * @lumieducation/h5p-webcomponents. Call this Meteor method from
 * H5PEditorComponent.loadContentCallback.
 * @param {string} contentId the content id to load
 * @param {string} language the language code the user is using (e.g. 'de'
 * or 'de-DE')
 * @returns the data that must be passed to the editor webcomponent
 */
export const loadContentForEditing = async function ({ contentId, language }) {
  const user = this.user
  const renderUser = new H5PUser(user)
  const renderLanguage = languageOverride === 'auto'
    ? language || 'en'
    : languageOverride
  const editorModel = await H5PFactory.editor().render(contentId, renderLanguage, renderUser)

  if (!contentId || contentId === 'undefined') {
    return editorModel
  }

  const content = await H5PFactory.editor().getContent(contentId)
  return {
    ...editorModel,
    library: content.library,
    metadata: content.params.metadata,
    params: content.params.params
  }
}
