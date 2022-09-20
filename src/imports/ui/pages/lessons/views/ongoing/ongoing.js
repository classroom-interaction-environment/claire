import { Template } from 'meteor/templating'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'

import { Lesson } from '../../../../../contexts/classroom/lessons/Lesson'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'

import '../.././../../components/documentState/documentState'
import '../../../../renderer/lesson/list/lessonListRenderer'
import './ongoing.html'

const getRunningLessons = ({ sort, limit }) => getLocalCollection(Lesson.name).find({
  startedAt: { $exists: true },
  completedAt: { $exists: false }
}, { sort, limit })

const getUpcomingLessons = ({ sort, limit }) => getLocalCollection(Lesson.name).find({
  startedAt: { $exists: false },
  completedAt: { $exists: false }
}, { sort, limit })

Template.ongoingLessons.onCreated(function () {
  const instance = this
  const runningSort = { startedAt: -1 }
  const upcomingSort = { updatedAt: -1 }

  const maxRunning = getRunningLessons({}).count()
  const maxUpcoming = getUpcomingLessons({}).count()
  instance.state.set({
    initComplete: true,
    runningSort,
    upcomingSort,
    limitRunning: 1,
    limitUpcoming: 5,
    maxRunning,
    maxUpcoming
  })
})

Template.ongoingLessons.helpers({
  loadComplete () {
    return Template.getState('initComplete')
  },
  runningLessons () {
    const sort = Template.getState('runningSort')
    const limit = Template.getState('limitRunning')
    return getRunningLessons({ sort, limit })
  },
  hasMoreRunning () {
    return Template.getState('limitRunning') < Template.getState('maxRunning')
  },
  upcomingLessons () {
    const sort = Template.getState('upcomingSort')
    const limit = Template.getState('limitUpcoming')
    return getUpcomingLessons({ sort, limit })
  },
  hasMoreUpcoming () {
    return Template.getState('limitUpcoming') < Template.getState('maxUpcoming')
  },
  unit (unitId) {
    return getLocalCollection(Unit.name).findOne(unitId)
  },
  maxRunning () {
    return Template.getState('maxRunning')
  },
  maxUpcoming () {
    return Template.getState('maxUpcoming')
  }
})

Template.ongoingLessons.events({
  'click .show-more-upcoming-btn' (event, templateInstance) {
    event.preventDefault()
    let limitUpcoming = templateInstance.state.get('limitUpcoming')
    limitUpcoming += 5
    templateInstance.state.set({ limitUpcoming })
  },
  'click .show-more-running-btn' (event, templateInstance) {
    event.preventDefault()
    let limitRunning = templateInstance.state.get('limitRunning')
    limitRunning += 5
    templateInstance.state.set({ limitRunning })
  }
})
