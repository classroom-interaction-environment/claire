import { Template } from 'meteor/templating'
import { Curriculum } from '../../../../../contexts/curriculum/Curriculum.js'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { Dimension } from '../../../../../contexts/curriculum/curriculum/dimension/Dimension'
import { unitEditorSubscriptionKey } from '../../unitEditorSubscriptionKey'

import { formIsValid } from '../../../../components/forms/formUtils'
import { updateContextDoc } from '../../../../controllers/document/updateContextDoc'
import { toUpdateDoc } from '../../../../utils/toUpdateDoc'
import { firstOption } from '../../../../../contexts/tasks/definitions/common/helpers'
import { dimensionOptions } from '../../../../../contexts/curriculum/curriculum/dimension/dimensionOptions'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'

import './basicInfo.scss'
import './basicInfo.html'
import { callMethod } from '../../../../controllers/document/callMethod'

/*******************************************************************************
 * This view generates a form, that can be utilized to edit basic data, like
 * - title
 * - description
 * - period
 * - dimensions
 ******************************************************************************/

const API = Template.uebasicInfo.setDependencies({
  contexts: [Unit, Dimension]
})

const defaultSchema = Curriculum.getDefaultSchema()
const basicInfoSchema = API.createSchema({
  title: defaultSchema.title,
  description: defaultSchema.description,
  period: Unit.schema.period,
  dimensions: Unit.schema.dimensions,
  'dimensions.$': {
    ...Unit.schema['dimensions.$'],
    autoform: {
      firstOption: firstOption,
      options: dimensionOptions({ collection: getLocalCollection(Dimension.name) })
    }
  }
})

Template.uebasicInfo.onCreated(function () {
  const instance = this

  callMethod({
    name: Dimension.methods.editor,
    args: {},
    failure: API.notify,
    success: (docs = []) => {
      const DimensionCollection = getLocalCollection(Dimension.name)

      docs.forEach(doc => {
        DimensionCollection.upsert({ _id: doc._id }, { $set: doc })
      })

      instance.state.set('loadComplete', true)
    }
  })
})

Template.uebasicInfo.helpers({
  basicInfoSchema () {
    return basicInfoSchema
  },
  loadComplete () {
    return Template.getState('loadComplete')
  },
  submitting () {
    return Template.getState('submitting')
  },
  formType () {
    return Template.getState('submitting') ? 'disabled' : 'normal'
  }
})

Template.uebasicInfo.events({
  'submit #basicInfoForm' (event, templateInstance) {
    event.preventDefault()
    const formDoc = formIsValid(basicInfoSchema, 'basicInfoForm', true)
    if (!formDoc) return

    const unitDoc = templateInstance.data.unitDoc
    const updateDoc = toUpdateDoc(unitDoc, formDoc)

    updateContextDoc({
      context: Unit,
      _id: unitDoc._id,
      doc: updateDoc,
      prepare: () => templateInstance.state.set('submitting', true),
      receive: () => templateInstance.state.set('submitting', false),
      failure: er => API.notify(er),
      success: () => API.notify(true)
    })
  }
})
