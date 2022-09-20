import { Template } from 'meteor/templating'
import { Phase } from '../../../../contexts/curriculum/curriculum/phase/Phase'
import { SocialStateType } from '../../../../contexts/curriculum/curriculum/types/SocialStateType'
import { resolveMaterialReference } from '../../../../contexts/material/resolveMaterialReference'
import { getCollection } from '../../../../api/utils/getCollection'
import './phasesFullRenderer.scss'
import './phaseFullRenderer.html'



const API = Template.phaseFullRenderer.setDependencies({
  contexts: [Phase]
})

const PhaseCollection = getCollection(Phase.name)

Template.phaseFullRenderer.helpers({
  overallTime (phases = [], unitDoc) {
    const expected = unitDoc.period
    const actual = phases.reduce((acc, curr) => acc + curr.period, 0)
    return {
      value: actual,
      danger: actual !== expected
    }
  },
  phaseSchema () {
    return Phase.schema
  },
  loadComplete () {
    return Template.getState('loadComplete')
  },
  unitDoc () {
    return Template.getState('unitDoc')
  },
  socialState (value) {
    return SocialStateType.entry(value)
  },
  reference (refObj) {
    return resolveMaterialReference(refObj)
  },
  globalPhases () {
    const unitDoc = Template.getState('unitDoc')
    if (!unitDoc.phases) {
      unitDoc.phases = []
    }
    const cursor = PhaseCollection.find({ unit: { $exists: false } })
    if (cursor.count() > 0) {
      return cursor
    } else {
      return null
    }
  },
  hasUnit (unitId) {
    return !!unitId
  }
})
