import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Cookies } from 'meteor/ostrio:cookies'
import { H5PMeteor } from 'meteor/claire:h5p'
import { i18n } from '../../../api/language/language'
import { defineElements } from '@lumieducation/h5p-webcomponents'
import './h5pEditor.html'

// This will register the <h5p-editor/> webcomponent (used in the template).
defineElements('h5p-editor')

// eslint-disable-next-line import/first

const cookies = new Cookies()

const API = Template.h5pEditor.setDependencies({
  // TODO language
})

Template.h5pEditor.onCreated(function () {
  // We create the save callback in the data object,
  // so that the parent can call the child.
  this.data.save = async () => {
    const result = await this.$('.editor')[0].save()
    this.data.onSaved(result.contentId, result.metadata)
  }
})

Template.h5pEditor.onRendered(function () {
  // We set the callback on the editor webcomponent. When the contentId is set
  // through the template binding, the editor will render.
  this.$('.editor')[0].loadContentCallback = async (contentId /*, requestBody */) => {
    const language = i18n.currentLocale.get()
    // We set a (session) cookie to be able to find out what language the
    // user is using in connectErrorHandler.js.
    cookies.set('h5p-editor-lang', language)
    return new Promise((resolve, reject) => {
      Meteor.call(H5PMeteor.methods.loadContentForEditing.name, { contentId, language }, (err, result) => {
        if (err) {
          API.notify(err)
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  // We set the callback on the editor webcomponent. It is invoked by the
  // editor webcomponent when the Blaze component is signaled to save. This is
  // done by calling save() on the data bound to the h5pEditor Blaze
  // component.
  this.$('.editor')[0].saveContentCallback = async (contentId, requestBody) =>
    new Promise((resolve, reject) => {
      const args = {
        params: requestBody.params.params,
        metadata: requestBody.params.metadata,
        library: requestBody.library,
        contentId: contentId
      }

      // TODO use callMethod
      Meteor.call(H5PMeteor.methods.saveContent.name, args, (err, result) => {
        if (err) {
          API.notify(err)
          return reject(err)
        }
        API.notify({ message: 'saved' })
        resolve(result)
      })
    })
})
