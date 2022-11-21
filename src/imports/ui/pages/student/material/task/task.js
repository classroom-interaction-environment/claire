import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { Lesson } from '../../../../../contexts/classroom/lessons/Lesson'
import { Task } from '../../../../../contexts/curriculum/curriculum/task/Task'
import { TaskResults } from '../../../../../contexts/tasks/results/TaskResults'
import { TaskWorkingState } from '../../../../../contexts/tasks/state/TaskWorkingState'
import { TaskDefinitions } from '../../../../../contexts/tasks/definitions/TaskDefinitions'
import { Group } from '../../../../../contexts/classroom/group/Group'
import { Files } from '../../../../../contexts/files/Files'
import { lessonSubKeyStudent } from '../../lesson/lessonSubKeyStudent'
import { ItemHandlers } from './ItemHandlers'
import { loadStudentMaterial } from '../../../../utils/loadStudentMaterial'
import { insertUpdate } from '../../../../../api/utils/insertUpdate'
import { isMaterial } from '../../../../../contexts/material/isMaterial'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { getCollection } from '../../../../../api/utils/getCollection'
import { callMethod } from '../../../../controllers/document/callMethod'
import { loadIntoCollection } from '../../../../../infrastructure/loading/loadIntoCollection'
import taskLanguage from './i18n/taskLanguage'
import { LessonStates } from '../../../../../contexts/classroom/lessons/LessonStates'
import '../../../../../contexts/curriculum/curriculum/task/renderer/main/taskRenderer'
import '../../../../components/lesson/status/lessonStatus'
import './task.html'

/* This is the student task template where students will work on the task
 * Material.
 */

const API = Template.task.setDependencies({
  contexts: [Lesson, TaskResults, TaskWorkingState, Unit, Group],
  language: taskLanguage
})

const TaskCollection = getLocalCollection(Task.name)
const LessonCollection = getCollection(Lesson.name)
const TaskResultCollection = getCollection(TaskResults.name)
const TaskWorkingStateCollection = getCollection(TaskWorkingState.name)
const UnitCollection = getLocalCollection(Unit.name)
const taskDefsInitialized = TaskDefinitions.initialize()
const taskSubKey = 'taskSubKey'

Template.task.onCreated(function () {
  const instance = this
  instance.state.set('page', 0)
  instance.state.set('complete', false)

  instance.onLoadError = loadError => {
    console.error(instance.viewName || instance.view?.name, 'load error', loadError)
    instance.state.set({ loadError })
  }

  // most important is to load the lesson doc first
  // because from here we determine the publication for
  // taskworking states that are bound to lessonId
  instance.autorun(() => {
    if (!Meteor.userId()) return
    const data = Template.currentData()
    const { params } = data
    const { lessonId, groupId } = params

    API.subscribe({
      key: lessonSubKeyStudent,
      name: Lesson.publications.single,
      args: { _id: lessonId },
      callbacks: {
        onReady () {
          const lessonDoc = LessonCollection.findOne(lessonId)
          instance.state.set('lessonDoc', lessonDoc)
        },
        onError: instance.onLoadError
      }
    })

    // if we have a group we need to sub it
    if (groupId && groupId !== 'none') {
      API.subscribe({
        name: Group.publications.single,
        args: { groupId },
        key: 'studentGroupSub',
        callbacks: {
          onError: API.fatal,
          onReady () {
            setTimeout(() => {
              const groupDoc = getCollection(Group.name).findOne(groupId)
              const userId = Meteor.userId()
              const me = groupDoc.users.find(user => user.userId === userId)

              loadIntoCollection({
                name: Group.methods.users,
                args: { groupId },
                failure: API.notify,
                collection: getLocalCollection(Meteor.users)
              })

              if (me.role) {
                instance.state.set('currentRole', me.role)
              }

              instance.state.set({ groupDoc, groupSubReady: true })
            }, 150)
          }
        }
      })
    }
    else {
      instance.state.set('groupSubReady', true)
    }
  })

  // since tasks may involve to upload files we need to have students to
  // subscribe to their uploaded files in order to allow them to view the upload
  const filter = ctx => isMaterial(ctx)
  Files.getMaterialContexts({ filter }).forEach(context => {
    instance.autorun(() => {
      const lessonDoc = instance.state.get('lessonDoc')
      if (!lessonDoc) {
        return
      }

      API.subscribe({
        name: context.publications.my,
        args: { 'meta.lessonId': lessonDoc._id },
        key: lessonSubKeyStudent,
        callbacks: {
          onError: instance.onLoadError,
          onReady: () => {
            instance.state.set(context.publications.my.name, true)
          }
        }
      })
    })
  })

  // Second, load the task doc on which we are working on
  // because this determines the the current state of
  // page and completeness for task results and items
  instance.autorun(() => {
    const lessonDoc = instance.state.get('lessonDoc')
    const groupSubReady = instance.state.get('groupSubReady')
    if (!lessonDoc && !groupSubReady) {
      return
    }

    const data = Template.currentData()
    const { params } = data
    const { taskId, groupId } = params
    const groupDoc = getCollection(Group.name).findOne(groupId)
    const docByTaskId = x => x._id === taskId

    // check if taskId is still within visible fields
    const isVisible = taskId &&
      lessonDoc &&
      lessonDoc.visibleStudent &&
      lessonDoc.visibleStudent.find(docByTaskId)

    const isGroupVisible = groupDoc &&
      groupDoc.visible &&
      groupDoc.visible.find(docByTaskId)

    if (!isVisible && !isGroupVisible) {
      instance.state.set('taskDoc', null)
      instance.state.set('taskNotVisible', true)
      return
    }

    else {
      instance.state.set('taskNotVisible', false)
    }

    const taskDoc = TaskCollection.findOne(taskId)

    if (taskDoc) {
      instance.state.set('taskDoc', taskDoc)
    }

    else {
      const allVisible = (lessonDoc.visibleStudent || []).concat(groupDoc?.visible || [])
      loadStudentMaterial({
        _id: lessonDoc._id,
        visibleStudent: allVisible,
        groupId: groupDoc ? groupDoc._id : undefined,
        prepare: () => instance.state.set('loadingMaterials', true),
        receive: () => instance.state.set('loadingMaterials', false),
        failure: instance.onLoadError,
        success: () => {
          const taskDoc = TaskCollection.findOne(taskId)
          if (taskDoc) {
            instance.state.set('taskDoc', taskDoc)
          }
          else {
            instance.state.set('taskDoc', null)
            instance.state.set('taskNotVisible', true)
          }
        }
      })
    }
  })

  // get the working state, to know the current page
  // and if we have already completed this task
  instance.autorun(() => {
    const invalidate = instance.state.get('invalidateTaskWorkingState')
    const taskDoc = instance.state.get('taskDoc')
    const groupSubReady = instance.state.get('groupSubReady')
    const lessonDoc = instance.state.get('lessonDoc')
    const groupDoc = instance.state.get('groupDoc')

    if (!taskDoc || !lessonDoc || !groupSubReady) {
      return
    }

    const taskId = taskDoc._id
    const lessonId = lessonDoc._id
    const args = { lessonId, taskId }

    // group is always optional
    if (groupDoc) {
      args.groupId = groupDoc._id
    }

    API.subscribe({
      name: TaskWorkingState.publications.myTask,
      key: lessonSubKeyStudent,
      args: args,
      callbacks: {
        onError: API.notify,
        onReady: async () => {
          const query = { lessonId, taskId }
          if (groupDoc) {
            query.groupId = groupDoc._id
          }

          // let's check if for this specific task
          // as already a working state doc been created
          const taskWorkingStateDoc = TaskWorkingStateCollection.findOne(query)

          // if we have an existing state, we set the template to it
          if (taskWorkingStateDoc) {
            instance.state.set('taskWorkingDoc', taskWorkingStateDoc)
            instance.state.set('taskWorkingReady', true)
            return
          }

          // Otherwise, we immediately create a new one so the teacher
          // is aware, that working has begun for this student.
          // This is only invoked when the lesson is running.
          if (LessonStates.isRunning(lessonDoc)) {
            const complete = false
            const page = 0
            const progress = 0
            const taskWorkingStateInsertDoc = { lessonId, taskId, complete, page, progress }
            if (groupDoc) {
              taskWorkingStateInsertDoc.groupId = groupDoc._id
            }

            const doc = await callMethod({
              name: TaskWorkingState.methods.saveState,
              args: taskWorkingStateInsertDoc,
              failure: instance.onLoadError
            })

            instance.state.set('taskWorkingDoc', doc)
            instance.state.set('taskWorkingReady', true)
          }

          if (invalidate) {
            instance.state.set('invalidateTaskWorkingState', false)
          }
        }
      }
    })
  })

  instance.autorun(() => {
    const lessonDoc = instance.state.get('lessonDoc')
    if (!lessonDoc || instance.state.get('unitDoc')) return

    const existingUnitDoc = UnitCollection.findOne(lessonDoc.unit)
    if (existingUnitDoc) {
      instance.state.set('unitDoc', existingUnitDoc)
      return
    }
    Meteor.call(Lesson.methods.units.name, { lessonIds: [lessonDoc._id] }, (loadError, unitDocs) => {
      if (loadError) {
        return instance.onLoadError(loadError)
      }
      unitDocs.forEach(doc => insertUpdate(UnitCollection, doc))
      const unitDoc = UnitCollection.findOne(lessonDoc.unit)
      instance.state.set('unitDoc', unitDoc)
    })
  })

  // finally load any existing result documents
  // that matches the current lesson and the current task
  // so we can load them into the items when reloading
  // or coming back to a previous page within a task
  instance.autorun(() => {
    const taskDoc = instance.state.get('taskDoc')
    const lessonDoc = instance.state.get('lessonDoc')
    if (!taskDoc || !lessonDoc) return

    const lessonId = lessonDoc._id
    const taskId = taskDoc._id

    API.subscribe({
      name: TaskResults.publications.byTask,
      args: { lessonId, taskId },
      key: taskSubKey,
      callbacks: {
        onReady () {
          instance.state.set('taskSubscribed', true)
          instance.state.set('taskResultsReady', true)
        },
        onError (loadingError) {
          API.fatal(loadingError)
          instance.state.set({ loadingError })
        }
      }
    })
  })
})

Template.task.helpers({
  loadError () {
    return API.initComplete() && Template.instance().state.get('loadError')
  },
  loadComplete () {
    return API.initComplete() && taskDefsInitialized.get()
  },
  lessonId () {
    const lessonDoc = Template.instance().state.get('lessonDoc')
    return lessonDoc && lessonDoc._id
  },
  taskNotVisible () {
    return Template.instance().state.get('taskNotVisible')
  },
  taskData () {
    const instance = Template.instance()
    const taskDoc = instance.state.get('taskDoc')
    const groupDoc = instance.state.get('groupDoc')
    const lessonDoc = instance.state.get('lessonDoc')
    const taskWorkingStateReady = instance.state.get('taskWorkingReady')
    const taskResultsReady = instance.state.get('taskResultsReady')
    const taskWorkingDoc = instance.state.get('taskWorkingDoc')
    const lessonIsRunning = LessonStates.isRunning(lessonDoc)

    if (!lessonDoc || !taskDoc || !taskWorkingDoc || !taskWorkingStateReady || !taskResultsReady) {
      return
    }

    const complete = lessonIsRunning
      ? taskWorkingDoc.complete ?? false
      : false
    const page = lessonIsRunning
      ? taskWorkingDoc.page ?? 0
      : 0
    const onError = API.notify
    const itemHandlers = {
      onItemLoad: ItemHandlers.onItemLoad({ instance, TaskResultCollection, onError }),
      onItemSubmit: lessonIsRunning && ItemHandlers.onItemSubmit({ instance, onError }),
      onTaskPageNext: lessonIsRunning && ItemHandlers.onTaskPageNext({ instance, onError }),
      onTaskPagePrev: lessonIsRunning && ItemHandlers.onTaskPagePrev({ instance, onError }),
      onTaskFinished: lessonIsRunning && ItemHandlers.onTaskFinished({ instance, onError })
    }

    return {
      title: taskDoc.title,
      page: page,
      data: Object.assign({ preview: false, print: false, student: true }, taskDoc, itemHandlers),
      lessonId: lessonDoc._id,
      groupId: groupDoc?._id,
      preview: false,
      print: false,
      student: true,
      readMode: !lessonIsRunning,
      isComplete: complete
    }
  },
  lessonTitle () {
    const unitDoc = Template.getState('unitDoc')
    return unitDoc && unitDoc.title
  },
  lessonStatusData () {
    const instance = Template.instance()
    return {
      lessonDoc: instance.state.get('lessonDoc'),
      unitDoc: instance.state.get('unitDoc'),
      showLabel: true
    }
  }
})

Template.task.onDestroyed(function () {
  const instance = this
  if (instance.state.get('taskSubscribed')) {
    API.dispose(taskSubKey)
  }
})
