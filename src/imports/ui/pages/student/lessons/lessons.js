import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { SchoolClass } from '../../../../contexts/classroom/schoolclass/SchoolClass'
import { Lesson } from '../../../../contexts/classroom/lessons/Lesson'
import { CurrentClass } from '../../../controllers/student/CurrentClass'
import { Unit } from '../../../../contexts/curriculum/curriculum/unit/Unit'
import { Users } from '../../../../contexts/system/accounts/users/User'

import { cursor } from '../../../../api/utils/cursor'
import { loggedIn } from '../../../../api/accounts/user/loggedIn'
import { insertUpdate } from '../../../../api/utils/insertUpdate'
import { getLocalCollection } from '../../../../infrastructure/collection/getLocalCollection'
import { createLog } from '../../../../api/log/createLog'
import { $nin } from '../../../../api/utils/query/notInSelector'
import { getCollection } from '../../../../api/utils/getCollection'
import lessonStudentLanguage from '../i18n/lessonStudentLanguage'
import '../../../components/lesson/status/lessonStatus'
import './lessons.html'

const warn = createLog({ name: 'Lessons', type: 'warn' })
const API = Template.lessons.setDependencies({
  contexts: [SchoolClass, Lesson, Unit],
  language: lessonStudentLanguage
})

const SchoolClassCollection = getCollection(SchoolClass.name)
const LessonCollection = getCollection(Lesson.name)
const UnitLocalCollection = getLocalCollection(Unit.name)

Template.lessons.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const user = Meteor.user()
    if (!user) return

    const userId = user._id

    // subscribe to all student's classes
    API.subscribe({
      name: SchoolClass.publications.my,
      key: 'lessons',
      callbacks: {
        onError: API.fatal,
        onReady () {
          // get the current class, unless there is no
          // current class set, then set it as current class
          const classId = CurrentClass.get()
          let classDoc = SchoolClassCollection.findOne(classId)

          if (!classDoc) {
            // search for any class doc
            // and set if we have found anything
            classDoc = SchoolClassCollection.findOne({ students: userId })
          }

          if (!classDoc) {
            return API.fatal(new Error('errors.docNotFound'))
          }

          CurrentClass.set(classDoc._id)
          updateClassId({ user, classId })

          const classCount = SchoolClassCollection.find().count()
          instance.state.set('classDoc', classDoc)
          instance.state.set('hasMoreClasses', classCount > 1)
          instance.state.set('hasNoClasses', !classDoc && classCount === 0)
          instance.state.set('schoolClassesReady', true)
        }
      }
    })
  })

  instance.autorun(() => {
    const userId = Meteor.userId()
    if (!userId || !instance.state.get('schoolClassesReady')) {
      return
    }

    const classDoc = instance.state.get('classDoc')
    if (!classDoc) {
      instance.state.set('lessonReady', true)
      return
    }

    API.subscribe({
      name: Lesson.publications.byClassStudent,
      args: { classId: classDoc._id },
      key: 'lessons',
      callbacks: {
        onReady: () => instance.state.set('lessonReady', true),
        onError: API.fatal
      }
    })
  })

  instance.autorun(() => {
    if (!loggedIn()) return
    const lessonReady = instance.state.get('lessonReady')
    if (!lessonReady) return

    const lessonIds = LessonCollection.find().fetch().map(doc => doc._id)
    loadUnits(lessonIds, instance)
  })
})

Template.lessons.onDestroyed(function onLessonsDestroyed () {
  const instance = this
  instance.state.set('schoolClassesReady', false)
  instance.state.set('lessonReady', false)
  instance.state.set('unitsReady', false)
  API.dispose('lessons')
})

Template.lessons.helpers({
  loadComplete () {
    const instance = Template.instance()
    return instance.state.get('schoolClassesReady') &&
      instance.state.get('lessonReady') &&
      instance.state.get('unitsReady')
  },
  runningLessons () {
    const currentClassId = CurrentClass.get()
    return cursor(() => LessonCollection.find({
      classId: currentClassId,
      startedAt: { $exists: true },
      completedAt: { $exists: false }
    }, {
      sort: {
        updatedAt: -1
      }
    }))
  },
  upcomingLessons () {
    const currentClassId = CurrentClass.get()
    return cursor(() => LessonCollection.find({
      classId: currentClassId,
      startedAt: { $exists: false },
      completedAt: { $exists: false }
    }, { sort: { updatedAt: -1 } }))
  },
  completedLessons () {
    const currentClassId = CurrentClass.get()
    return cursor(() => LessonCollection.find({
      classId: currentClassId,
      startedAt: { $exists: true },
      completedAt: { $exists: true }
    }, { sort: { updatedAt: -1 } }))
  },
  currentClass () {
    return Template.getState('classDoc')
  },
  hasMoreClasses () {
    return Template.getState('hasMoreClasses')
  },
  hasNoClasses () {
    return Template.getState('hasNoClasses')
  },
  nonCurrentClasses () {
    const classDoc = Template.getState('classDoc')
    return classDoc && SchoolClassCollection.find({ _id: $nin([classDoc._id]) })
  },
  loadErrors () {
    return Template.getState('loadErrors')
  }
})

Template.lessons.events({
  'change .current-class-select' (event, templateInstance) {
    event.preventDefault()

    const currentClassId = CurrentClass.get()
    const classId = templateInstance.$(event.currentTarget).val()
    CurrentClass.set(classId)
    CurrentClass.set(classId)

    updateClassId({ classId }, (err) => {
      if (err) {
        API.notify(err)
        return CurrentClass.set(currentClassId)
      }
    })
  }
})

Template.lessonListRendererSimple.helpers({
  unit (unitId) {
    return UnitLocalCollection.findOne(unitId)
  }
})

const defaultUpdateClassIdError = err => err && API.notify(err)

function updateClassId ({ user = Meteor.user(), classId }, callback = defaultUpdateClassIdError) {
  if (!user.ui || !user.ui.classId || classId !== user.ui.classId) {
    // update the user profile to point to this class in any way
    Meteor.call(Users.methods.updateUI.name, { classId }, callback)
  }
}

/**
 * Loads units for a given list of lessons. If the server returns an error and the error indicates
 * that a unitDoc has been missing, it removes the unit and reloads with a filtered list.
 *
 * If successfull it resolves material and saves any errors, that occurred
 */
function loadUnits (lessonIds, templateInstance, errors = []) {
  if (lessonIds && lessonIds.length > 0) {
    Meteor.call(Lesson.methods.units.name, { lessonIds }, (err, unitDocs = []) => {
      if (err) {
        // first, API.notify the user in order to make her take actions
        // and inform the teacher about this incident
        errors.push(err)
        templateInstance.state.set('loadErrors', errors)

        if (err.error === 'errors.docNotFound') {
          // err.reason holds the missing unitId so we need to find the lesson(s), that refer to this unit
          const corruptedLessonDocs = LessonCollection.find({ unit: err.reason }).fetch().map(doc => doc._id)
          corruptedLessonDocs.forEach((corruptedLessonId) => {
            const corruptedIndex = lessonIds.indexOf(corruptedLessonId)
            if (corruptedIndex > -1) {
              lessonIds.splice(corruptedIndex, 1)
            }
          })

          warn('there were errors loading units for the following docs', corruptedLessonDocs)

          // reattempt to load units with filtered lessons
          return loadUnits(lessonIds, templateInstance, errors)
        }
        else {
          return loadUnits([], templateInstance, errors)
        }
      }

      templateInstance.state.set('loadErrors', errors)
      templateInstance.state.set('unitsReady', true)
      unitDocs.forEach(doc => insertUpdate(UnitLocalCollection, doc))
    })
  }
  else if (templateInstance.state.get('lessonReady')) {
    templateInstance.state.set('loadErrors', errors)
    templateInstance.state.set('unitsReady', true)
  }
}
