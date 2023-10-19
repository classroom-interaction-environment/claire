import {Template} from 'meteor/templating'
import './autoform'
import '../../../../../ui/h5p/editor/h5pEditor'
import './h5pEditor.scss'
import './h5pEditor.html'

// This is the h5pEditor wrapper for AutoForm,
// which basically embeds the h5p editor as
// an AutoForm field and saves the result,
// represented by the contentId, in a field.
// It also provides functionality to delete the item
// since the H5P editor has their own endpoints
// that handle saving, deleting etc.

Template.afH5PEditor.onCreated(function () {
  const instance = this
  instance.updateField = async (result) => {
    console.debug(result)
  }
})

Template.afH5PEditor.helpers({
  editorAtts () {
    const instance = Template.instance()
    return {
      contentId: 'new',
      save: instance.save,
      onSaved: instance.updateField
    }
  },
  inputAtts () {
    const { h5p, ...atts } =   Template.currentData().atts
    return atts
  }
})

Template.afH5PEditor.events({
  'click .save-h5p-btn' (e, i) {

  }
})