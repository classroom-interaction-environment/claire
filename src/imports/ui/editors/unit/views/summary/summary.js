import { Template } from 'meteor/templating'
import { Dimension } from '../../../../../contexts/curriculum/curriculum/dimension/Dimension'
import { Objective } from '../../../../../contexts/curriculum/curriculum/objective/Objective'
import { Pocket } from '../../../../../contexts/curriculum/curriculum/pocket/Pocket'
import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'
import { SchoolClass } from '../../../../../contexts/classroom/schoolclass/SchoolClass'
import { LessonMaterial } from '../../../../controllers/LessonMaterial'
import { DocNotFoundError } from '../../../../../api/errors/types/DocNotFoundError'

import { getMaterialContexts } from '../../../../../contexts/material/initMaterial'
import { dataTarget } from '../../../../utils/dataTarget'
import { findUnassociatedMaterial } from '../../../../../api/utils/findUnassociatedMaterial'
import { callMethod } from '../../../../controllers/document/callMethod'
import { setQueryParams } from '../../../../../api/routes/params/setQueryParams'

import '../../../../renderer/phase/compact/compactPhases'
import '../../../../renderer/phase/nonphaseMaterial/nonPhaseMaterial'
import '../../../../renderer/objective/objective'
import './summary.html'

/*******************************************************************************
 * The summary view contains a full overview of the unit's content.
 * It's purpose is to give the teacher a direct insight about the unit
 * and whether action is required to edit and improve the unit.
 *
 * Therefore it
 * - loads all the associated and unassociated material docs
 * -
 ******************************************************************************/

const API = Template.uesummary.setDependencies({
  contexts: [...(new Set([Dimension, Objective, Pocket, Phase].concat(getMaterialContexts()))).values()]
})

Template.uesummary.onCreated(function () {
  const instance = this
  const { data } = instance
  const { unitDoc, classDoc, pocketDoc, preview } = data

  // first, make a sanity check for all required docs. It's job of the parent
  // component to provide these, so we can safely fail here with fatal

  if (!unitDoc) {
    return API.fatal(new DocNotFoundError(undefined, { unitDoc }))
  }

  // detect all material, that is linked to the unit but not to any phase of it
  instance.state.set('preview', preview)

  // create on overview list of any basic information

  const baseData = []

  // add classDoc data only if we are working on a copy; not on a master
  if (classDoc) {
    baseData.push({
      icon: SchoolClass.icon,
      label: SchoolClass.label,
      value: classDoc.title
    })
  }

  // add pocketDoc data only if we are not working on a custom unit
  if (pocketDoc) {
    baseData.push({
      icon: Pocket.icon,
      label: Pocket.label,
      value: pocketDoc.title
    })
  }

  // always add period and description
  baseData.push({
    icon: 'clock',
    label: 'curriculum.period',
    value: `${unitDoc.period} ${API.translate('time.minutes')}`
  }, {
    icon: 'align-justify',
    label: 'common.description',
    value: unitDoc.description || API.translate('common.noDescription')
  })

  instance.state.set({ baseData })

  // since we don't update any data on this page we can safely load all content
  // that is linked to the unit via methods and display a loading indicator for
  // each type of data / material that we currently load.
  // The procedure is always the same, so we reuse a single function for it:
  const onFailure = er => API.notify(er)
  const loadBaseContent = ({ context }) => {
    const fieldName = context.fieldName
    const stateName = `${context.name}s`
    const completeName = `${stateName}Complete`
    const entries = unitDoc[fieldName]

    if (entries?.length > 0) {
      callMethod({
        name: context.methods.all.name,
        args: { ids: entries },
        failure: onFailure,
        success: (documents = []) => {
          API.log('loaded', context.name, { documents })
          const map = new Map()
          documents.forEach(doc => map.set(doc._id, doc))
          const sortedDocuments = entries.map(docId => map.get(docId))
          instance.state.set({
            [stateName]: sortedDocuments,
            [completeName]: true
          })
        }
      })
    }

    // if there are no entries on this field we simply set this state as loaded
    else {
      API.log('no entries found for', context.name)
      instance.state.set({ [completeName]: true })
    }
  }

  loadBaseContent({ context: Dimension })
  loadBaseContent({ context: Objective })
  loadBaseContent({ context: Phase })

  // the lesson material is separately loaded, once the material has all been
  // initialized and is ready
  LessonMaterial.load(unitDoc, (err) => {
    instance.state.set('materialComplete', true)
    if (err) {
      API.notify(err)
    }
  })

  instance.autorun(() => {
    const materialComplete = instance.state.get('materialComplete')
    if (!materialComplete) return

    const unassociatedMaterial = findUnassociatedMaterial(unitDoc)
    instance.state.set('unassociatedMaterial', unassociatedMaterial)
  })
})

Template.uesummary.helpers({
  baseData () {
    return Template.getState('baseData')
  },
  loadComplete () {
    const instance = Template.instance()
    return API.initComplete()  &&
      instance.state.get('dimensionsComplete') &&
      instance.state.get('objectivesComplete') &&
      instance.state.get('phasesComplete') &&
      instance.state.get('materialComplete')
  },
  dimensions () {
    return Template.getState('dimensions')
  },
  phases () {
    return Template.getState('phases')
  },
  objectives () {
    return Template.getState('objectives')
  },
  isPreview () {
    return Template.getState('preview')
  },
  unassociatedMaterial () {
    return Template.getState('unassociatedMaterial')
  }
})

Template.uesummarySection.events({
  'click .uesummary-edit-button' (event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    setQueryParams({ tab: target })
  },
  'click .uesummary-fix-button' (event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    setQueryParams({ tab: target })
  }
})
