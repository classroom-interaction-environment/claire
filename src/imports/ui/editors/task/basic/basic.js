import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { Curriculum } from '../../../../contexts/curriculum/Curriculum'
import { Schema } from '../../../../api/schema/Schema'
import { Task } from '../../../../contexts/curriculum/curriculum/task/Task'
import { formIsValid } from '../../../components/forms/formUtils'
import { updateContextDoc } from '../../../controllers/document/updateContextDoc'
import { toUpdateDoc } from '../../../utils/toUpdateDoc'
import './basic.html'

const API = Template.teBasicInfo.setDependencies({
  contexts: [Task]
})

const defaultSchema = Curriculum.getDefaultSchema()
const updateBasicInfoSchema = Schema.create({
  status: Object.assign({}, defaultSchema.status, {
    autoform: {
      defaultValue: 0,
      afFieldInput: defaultSchema.status.autoform.afFieldInput
    }
  }),
  title: defaultSchema.title,
  description: defaultSchema.description
}, { tracker: Tracker })

Template.teBasicInfo.helpers({
  updateBasicInfoSchema () {
    return updateBasicInfoSchema
  },
  doc () {
    return Template.instance().data.taskDoc
  },
  submitting () {
    return Template.getState('submitting')
  }
})

Template.teBasicInfo.events({
  'submit #updateBasicDataForm' (event, templateInstance) {
    event.preventDefault()
    const originalTaskDoc = templateInstance.data.taskDoc
    const modifier = formIsValid(updateBasicInfoSchema, 'updateBasicDataForm', true)
    if (!modifier) return

    updateContextDoc({
      context: Task,
      _id: originalTaskDoc._id,
      doc: toUpdateDoc(originalTaskDoc, modifier),
      prepare: () => templateInstance.state.set('submitting', true),
      receive: () => templateInstance.state.set('submitting', false),
      failure: er => API.notify(er),
      success: () => API.notify()
    })
  }
})
