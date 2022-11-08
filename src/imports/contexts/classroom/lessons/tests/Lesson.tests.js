/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { mockCollection } from '../../../../../tests/testutils/mockCollection'
import { Lesson } from '../Lesson'
import { SchoolClass } from '../../schoolclass/SchoolClass'
import { UserUtils } from '../../../system/accounts/users/UserUtils'
import { LessonStates } from '../LessonStates'
import { stub, restore, restoreAll } from '../../../../../tests/testutils/stub'
import {
  stubLessonDoc,
  stubTaskDoc,
  stubUserDoc,
  stubClassDoc,
  stubAdmin,
  checkClass,
  checkLesson,
  stubTeacherDocs,
  stubStudentDocs
} from '../../../../../tests/testutils/doc/stubDocs'
import { onServerExec } from '../../../../api/utils/archUtils'
import { DocNotFoundError } from '../../../../api/errors/types/DocNotFoundError'
import { expect } from 'chai'
import { LessonRuntime } from '../runtime/LessonRuntime'
import { Unit } from '../../../curriculum/curriculum/unit/Unit'
import { Task } from '../../../curriculum/curriculum/task/Task'
import { Phase } from '../../../curriculum/curriculum/phase/Phase'

// require startup files to initialize Material
import '../../../../startup/server/contexts'

const LessonCollection = mockCollection(Lesson, { noSchema: true })
const UnitCollection = mockCollection(Unit, { noSchema: true, override: true })
const SchoolClassCollection = mockCollection(SchoolClass, { noSchema: true })
const PhaseCollection = mockCollection(Phase, { noSchema: true })
const TaskCollection = mockCollection(Task, { noSchema: true })

describe(Lesson.name, function () {
  describe('helpers', function () {
    afterEach(function () {
      restoreAll()
    })

    describe(Lesson.helpers.getClassDocIfStudent.name, function () {
      const get = Lesson.helpers.getClassDocIfStudent

      it('throws if user does not exists', function () {
        const userId = Random.id()
        expect(() => get({ userId })).to.throw('user.notFound')
        expect(() => get({ userId })).to.throw(DocNotFoundError.name)
      })
      it('throws if class does not exists', function () {
        const userId = Random.id()
        const classId = Random.id()
        stub(Meteor.users, 'findOne', () => ({ _id: userId }))
        expect(() => get({ userId, classId })).to.throw(DocNotFoundError.name)
        expect(() => get({ userId, classId })).to.throw(classId)
      })
      it('throws is user is not student', function () {
        const userId = Random.id()
        const classId = Random.id()
        stubUserDoc({ userId })
        stubClassDoc({ _id: classId, students: [] })
        expect(() => get({ userId, classId })).to.throw('errors.permissionDenied')
        expect(() => get({ userId, classId })).to.throw(SchoolClass.errors.notMember)
      })
      it('returns the doc otherwise', function () {
        const userId = Random.id()
        const classId = Random.id()
        const classDoc = { _id: classId, students: [userId] }
        stubUserDoc({ userId })
        stubClassDoc(classDoc)
        const actualClassDoc = get({ userId, classId })
        expect(actualClassDoc).to.deep.equal(classDoc)
      })
    })
    describe(Lesson.helpers.isMemberOfLesson.name, function () {
      const member = Lesson.helpers.isMemberOfLesson
      it('throws if user does not exists', function () {
        const userId = Random.id()
        expect(() => member({ userId })).to.throw(DocNotFoundError.name, 'user.notFound')
      })
      it('throws if lesson does not exists', function () {
        const userId = Random.id()
        const lessonId = Random.id()
        stub(Meteor.users, 'findOne', () => ({ _id: userId }))
        expect(() => member({ userId, lessonId })).to.throw(DocNotFoundError.name)
        expect(() => member({ userId, lessonId })).to.throw(lessonId)
      })
      it('throws class doc does not exists', function () {
        const userId = Random.id()
        const lessonId = Random.id()
        const classId = Random.id()
        stub(Meteor.users, 'findOne', () => ({ _id: userId }))
        stub(LessonCollection, 'findOne', () => ({ _id: lessonId, classId }))
        stub(SchoolClassCollection, 'findOne', () => undefined)
        expect(() => member({ userId, lessonId })).to.throw(DocNotFoundError.name)
        expect(() => member({ userId, lessonId })).to.throw(classId)
      })
      it('returns true if the given user is student of the lesson / class', function () {
        const userId = Random.id()
        const lessonId = Random.id()
        const classdoc = { _id: Random.id(), students: [userId] }
        stub(Meteor.users, 'findOne', () => ({ _id: userId }))
        stub(LessonCollection, 'findOne', () => ({ _id: lessonId }))
        stub(SchoolClassCollection, 'findOne', () => classdoc)
        expect(member({ userId, lessonId })).to.equal(true)
      })
      it('returns true if the given user is teacher of the lesson / class', function () {
        const userId = Random.id()
        const lessonId = Random.id()
        const classdoc = { _id: Random.id(), teachers: [userId] }
        stub(Meteor.users, 'findOne', () => ({ _id: userId }))
        stub(LessonCollection, 'findOne', () => ({ _id: lessonId }))
        stub(SchoolClassCollection, 'findOne', () => classdoc)
        expect(member({ userId, lessonId })).to.equal(true)
      })
      it('returns true if the given user is owner of the class', function () {
        const userId = Random.id()
        const lessonId = Random.id()
        const classdoc = { _id: Random.id(), createdBy: userId }
        stub(Meteor.users, 'findOne', () => ({ _id: userId }))
        stub(LessonCollection, 'findOne', () => ({ _id: lessonId }))
        stub(SchoolClassCollection, 'findOne', () => classdoc)
        expect(member({ userId, lessonId })).to.equal(true)
      })
      it('returns false if the given user is not member of the lesson', function () {
        const userId = Random.id()
        const lessonId = Random.id()
        const classdoc = { _id: Random.id() }
        stub(Meteor.users, 'findOne', () => ({ _id: userId }))
        stub(LessonCollection, 'findOne', () => ({ _id: lessonId }))
        stub(SchoolClassCollection, 'findOne', () => classdoc)
        expect(member({ userId, lessonId })).to.equal(false)
      })
    })
    describe(Lesson.helpers.isTeacher.name, function () {
      const isTeacher = Lesson.helpers.isTeacher
      it('throws if there is no lessonDoc', function () {
        const defDoc = { userId: Random.id(), lessonId: Random.id() }
        expect(() => isTeacher(defDoc)).to.throw(DocNotFoundError.name, defDoc.lessonId, Lesson.name)
      })
      it('throws if there is no linked classDoc', function () {
        const userId = Random.id()
        const classId = Random.id()
        const lessonDocId = LessonCollection.insert({ createdBy: Random.id(), classId })
        const defDoc = { userId, lessonId: lessonDocId }
        expect(() => isTeacher(defDoc)).to.throw(DocNotFoundError.name, classId, SchoolClass.name)
      })
      it('returns true if the user creator of the lesson', function () {
        const userId = Random.id()
        const lessonId = LessonCollection.insert({ createdBy: userId, classId: Random.id() })
        const defDoc = { userId, lessonId }
        expect(isTeacher(defDoc)).to.equal(true)
      })
      it('returns true if the user is in teachers of the class', function () {
        const userId = Random.id()
        const classId = SchoolClassCollection.insert({ createdBy: Random.id(), title: Random.id(), teachers: [userId] })
        const lessonId = LessonCollection.insert({ createdBy: Random.id(), classId })
        const defDoc = { userId, lessonId }
        expect(isTeacher(defDoc)).to.equal(true)
      })
      it('returns true if the user is creator of the class', function () {
        const userId = Random.id()
        const classId = SchoolClassCollection.insert({ createdBy: userId, title: Random.id(), teachers: [Random.id()] })
        const lessonId = LessonCollection.insert({ createdBy: Random.id(), classId })
        const defDoc = { userId, lessonId }
        expect(isTeacher(defDoc)).to.equal(true)
      })
      it('returns false otherwise', function () {
        const userId = Random.id()
        const classId = SchoolClassCollection.insert({
          createdBy: Random.id(),
          title: Random.id(),
          teachers: [Random.id()]
        })
        const lessonId = LessonCollection.insert({ createdBy: Random.id(), classId })
        const defDoc = { userId, lessonId }
        expect(isTeacher(defDoc)).to.equal(false)
      })
    })
  })

  onServerExec(() => {
    describe('methods', function () {
      afterEach(function () {
        LessonCollection.remove({})
        UnitCollection.remove({})
        restoreAll()
      })

      const createLesson = Lesson.methods.create.run

      describe(Lesson.methods.create.name, function () {
        it('throws if the given original unit does not exists', function () {
          const unit = Random.id()
          const classId = Random.id()
          const userId = Random.id()
          const lessonCreateDoc = { classId, unit }

          stubClassDoc({ _id: classId, createdBy: userId })
          stubUserDoc({ userId })
          stubAdmin(false)

          const docNotFound = expect(() => createLesson.call({ userId }, lessonCreateDoc)).to.throw(DocNotFoundError.name)
          docNotFound.with.property('reason', 'createCloneDoc.sourceNotFound')
          docNotFound.to.have.deep.property('details', { docId: unit, name: Unit.name })
        })
        it('throws if the given class does not exists', function () {
          const originalUnit = Random.id()
          const classId = Random.id()
          const lessonCreateDoc = { classId, unit: originalUnit }

          stub(UnitCollection, 'findOne', () => ({ _id: originalUnit }))
          const docNotFound = expect(() => createLesson(lessonCreateDoc)).to.throw(DocNotFoundError.name)
          docNotFound.with.property('reason', 'getDocument.docUndefined')
          docNotFound.to.have.deep.property('details', { name: SchoolClass.name, query: classId })
        })
        it('creates a new lesson doc', function () {
          const userId = Random.id()
          const classId = Random.id()
          const originalUnit = Random.id()
          stub(UnitCollection, 'findOne', (_id) => {
            return { _id, createdBy: userId, title: Random.id() }
          })

          stub(SchoolClassCollection, 'findOne', () => ({ _id: classId, createdBy: userId }))
          stub(UserUtils, 'isAdmin', () => false)

          const { lessonId, unitId } = createLesson.call({ userId }, { classId, unit: originalUnit })
          expect(unitId).to.not.equal(originalUnit)

          const lessonDoc = LessonCollection.findOne(lessonId)
          expect(lessonDoc.unitOriginal).to.equal(originalUnit)
          expect(lessonDoc.classId).to.equal(classId)
        })

        it('creates a copy of the given master unit', function () {
          const unitOriginal = { _id: Random.id(), title: Random.id(), phases: [Random.id()] }
          const classId = Random.id()
          const userId = Random.id()
          const lessonCreateDoc = { classId, unit: unitOriginal._id, createdBy: userId }

          stub(SchoolClassCollection, 'findOne', () => Object.assign({}, { _id: classId, createdBy: userId }))
          stub(PhaseCollection, 'findOne', (_id) => Object.assign({}, { _id, createdBy: userId }))
          stub(UnitCollection, 'findOne', (_id) => {
            return Object.assign({}, {
              _id,
              createdBy: userId,
              title: _id === unitOriginal._id ? unitOriginal.title : Random.id(),
              phases: _id === unitOriginal._id ? unitOriginal.phases : [Random.id()]
            })
          })

          stub(UserUtils, 'isAdmin', () => false)

          const { lessonId, unitId } = createLesson.call({ userId }, lessonCreateDoc)
          restore(UserUtils, 'isAdmin')
          restore(SchoolClassCollection, 'findOne')
          restore(UnitCollection, 'findOne')
          restore(PhaseCollection, 'findOne')

          const lessonDoc = LessonCollection.findOne(lessonId)

          expect(lessonDoc.unitOriginal).to.equal(unitOriginal._id)
          expect(lessonDoc.unit).to.not.equal(unitOriginal._id)
          expect(lessonDoc.unit).to.equal(unitId)

          const newUnit = UnitCollection.findOne(lessonDoc.unit)
          expect(newUnit.title).to.equal(unitOriginal.title)
          expect(newUnit.phases.length).to.equal(unitOriginal.phases.length)
        })
        it('creates copies of the given master phases', function () {
          const unitOriginal = { _id: Random.id(), title: Random.id(), phases: [] }
          const originalPhases = []
          for (let i = 0; i < 3; i++) {
            const originalPhaseDoc = {
              _id: Random.id(),
              title: Random.id(),
              unit: unitOriginal._id
            }
            originalPhases.push(originalPhaseDoc)
          }

          unitOriginal.phases = originalPhases.map(e => e._id)

          const classId = Random.id()
          const userId = Random.id()
          const lessonCreateDoc = { classId, unit: unitOriginal._id, createdBy: userId }

          stub(UserUtils, 'isAdmin', () => false)
          stub(SchoolClassCollection, 'findOne', () => Object.assign({}, { _id: classId, createdBy: userId }))

          stub(UnitCollection, 'findOne', (_id) => {
            return Object.assign({}, {
              _id,
              createdBy: userId,
              title: _id === unitOriginal._id ? unitOriginal.title : Random.id(),
              phases: _id === unitOriginal._id ? unitOriginal.phases : unitOriginal.phases.map(x => Random.id())
            })
          })

          stub(PhaseCollection, 'findOne', phaseId => {
            const phaseDoc = originalPhases.find(entry => entry._id === phaseId)
            if (phaseDoc) {
              return Object.assign({}, phaseDoc)
            }
            else {
              return {
                _id: Random.id(),
                createdBy: userId,
                title: Random.id(),
                unit: Random.id()
              }
            }
          })

          const { lessonId } = createLesson.call({ userId }, lessonCreateDoc)

          restore(SchoolClassCollection, 'findOne')
          restore(UnitCollection, 'findOne')
          restore(PhaseCollection, 'findOne')

          const lessonDoc = LessonCollection.findOne(lessonId)
          const newUnit = UnitCollection.findOne(lessonDoc.unit)
          expect(newUnit.title).to.equal(unitOriginal.title)

          // check that new phase docs are not equal to the master docs
          const newPhases = newUnit.phases
          expect(newPhases).to.have.lengthOf(unitOriginal.phases.length)

          newPhases.forEach((phaseId, index) => {
            const newPhaseDoc = PhaseCollection.findOne(phaseId)
            const oldPhaseDoc = originalPhases[index]
            expect(newPhaseDoc._id).to.not.equal(oldPhaseDoc._id)
            expect(newPhaseDoc.unit).to.not.equal(unitOriginal._id)
          })
        })
      })

      describe(Lesson.methods.start.name, function () {
        const start = Lesson.methods.start.run

        checkLesson(start, LessonStates.canStart)
        checkClass(start)

        it('updates the lesson state to running', function () {
          const { userId, lessonDoc } = stubTeacherDocs()
          LessonCollection.insert(lessonDoc)
          const started = start.call({ userId }, lessonDoc)
          const updatedDoc = LessonCollection.findOne(lessonDoc._id)
          expect(started).to.equal(true)
          expect(LessonStates.isRunning(updatedDoc))
        })
      })

      describe(Lesson.methods.toggle.name, function () {
        const toggle = Lesson.methods.toggle.run

        checkLesson(toggle, LessonStates.canToggle)
        checkClass(toggle, { userId: Random.id() })

        it('throws if the material is not existent', function () {
          const { lessonDoc, userId } = stubTeacherDocs({ startedAt: new Date() })
          expect(() => toggle.call({ userId }, {
            _id: lessonDoc._id,
            context: Random.id()
          })).to.throw('collectionNotFound')
        })

        it('pushes material to the list, if not visible', function () {
          const { lessonDoc, userId } = stubTeacherDocs({ startedAt: new Date() })
          const taskId = Random.id()
          const taskDoc = { _id: Random.id() }
          stubTaskDoc(taskDoc)
          const toggleDoc = { _id: lessonDoc._id, referenceId: taskId, context: Task.name }

          LessonCollection.insert(lessonDoc)
          const toggled = toggle.call({ userId }, toggleDoc)

          expect(toggled).to.equal(true)
          restore(LessonCollection, 'findOne')

          const updatedDoc = LessonCollection.findOne(lessonDoc._id)
          expect(updatedDoc.visibleStudent).to.deep.equal([{ _id: taskId, context: Task.name }])
        })
        it('pulls material from the list, if visible', function () {
          const taskId = Random.id()
          const taskDoc = { _id: Random.id() }
          const { lessonDoc, userId } = stubTeacherDocs({
            startedAt: new Date(),
            visibleStudent: [{ _id: taskId, context: Task.name }]
          })
          stubTaskDoc(taskDoc)
          const toggleDoc = { _id: lessonDoc._id, referenceId: taskId, context: Task.name }

          LessonCollection.insert(lessonDoc)
          const toggled = toggle.call({ userId }, toggleDoc)

          expect(toggled).to.equal(true)
          restore(LessonCollection, 'findOne')

          const updatedDoc = LessonCollection.findOne(lessonDoc._id)
          expect(updatedDoc.visibleStudent).to.deep.equal([])
        })
      })

      describe(Lesson.methods.complete.name, function () {
        const complete = Lesson.methods.complete.run

        checkLesson(complete, LessonStates.canComplete)
        checkClass(complete)

        it('updates the lesson state to completed', function () {
          const { userId, lessonDoc } = stubTeacherDocs()
          lessonDoc.startedAt = new Date()

          LessonCollection.insert(lessonDoc)
          const completed = complete.call({ userId }, lessonDoc)
          const updatedDoc = LessonCollection.findOne(lessonDoc._id)
          expect(completed).to.equal(true)
          expect(LessonStates.isCompleted(updatedDoc))
        })
      })

      describe(Lesson.methods.restart.name, function () {
        const restart = Lesson.methods.restart.run

        checkLesson(restart, LessonStates.canRestart)
        checkClass(restart)

        it('restarts the lesson', function () {
          const { userId, lessonDoc } = stubTeacherDocs()
          lessonDoc.startedAt = new Date()
          LessonCollection.insert(lessonDoc)
          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => {})
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => true)
          const { lessonReset } = restart.call({ userId }, lessonDoc)

          const updatedDoc = LessonCollection.findOne(lessonDoc._id)
          expect(lessonReset).to.equal(true)
          expect(LessonStates.isIdle(updatedDoc))
        })

        it('removes all visible references', function () {
          const { userId, lessonDoc } = stubTeacherDocs()
          lessonDoc.startedAt = new Date()
          lessonDoc.visibleStudent = [Random.id()]
          lessonDoc.visibleBeamer = [Random.id()]
          LessonCollection.insert(lessonDoc)
          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => {})
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => true)
          restart.call({ userId }, lessonDoc)

          // otherwise it returns always the stubbed doc
          restore(LessonCollection, 'findOne')

          const updatedDoc = LessonCollection.findOne(lessonDoc._id)

          expect(updatedDoc.visibleStudent).to.equal(undefined)
          expect(updatedDoc.visibleBeamer).to.equal(undefined)
        })
      })

      describe(Lesson.methods.remove.name, function () {
        const removeLesson = Lesson.methods.remove.run

        checkLesson(removeLesson)
        checkClass(removeLesson, { userId: Random.id() })

        const errorCode = (_id, message) => `${_id} [${message}]`

        beforeEach(function () {
          TaskCollection.remove({})
          LessonCollection.remove({})
          UnitCollection.remove({})
          PhaseCollection.remove({})
        })

        it('throws if the lesson does not exists', function () {
          const _id = Random.id()
          expect(() => removeLesson({ _id })).to.throw(errorCode(_id, DocNotFoundError.name))
        })
        it('throws if the linked unit does not exist', function () {
          const { userId, lessonDoc } = stubTeacherDocs({ unit: Random.id() })
          expect(() => removeLesson.call({ userId }, { _id: lessonDoc._id })).to.throw(errorCode(lessonDoc.unit, DocNotFoundError.name))
        })
        it('removes lesson', function () {
          const { userId, lessonDoc } = stubTeacherDocs()
          lessonDoc.unit = UnitCollection.insert({ createdBy: userId, title: Random.id() })
          LessonCollection.insert(lessonDoc)
          expect(LessonCollection.find(lessonDoc._id).count()).to.equal(1)

          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => {})
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => true)

          const { lessonRemoved } = removeLesson.call({ userId }, { _id: lessonDoc._id })
          expect(lessonRemoved).to.equal(1)
          expect(LessonCollection.find(lessonDoc._id).count()).to.equal(0)
        })
        it('removes cloned unit', function () {
          const { userId, lessonDoc } = stubTeacherDocs()
          const unitId = UnitCollection.insert({ createdBy: userId, title: Random.id() })
          expect(UnitCollection.find(unitId).count()).to.equal(1)

          lessonDoc.unit = unitId
          LessonCollection.insert(lessonDoc)

          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => {})
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => true)

          const { unitRemoved } = removeLesson.call({ userId }, { _id: lessonDoc._id })
          expect(unitRemoved).to.equal(1)
          expect(UnitCollection.find(unitId).count()).to.equal(0)
        })
        it('removes cloned phases', function () {
          const { userId, lessonDoc } = stubTeacherDocs()
          const unitId = UnitCollection.insert({ createdBy: userId, title: Random.id() })
          lessonDoc.unit = unitId

          const phaseId = PhaseCollection.insert({ createdBy: userId, unit: unitId, title: Random.id() })
          UnitCollection.update(unitId, { $set: { phases: [phaseId] } })

          const unitDoc = UnitCollection.findOne(unitId)
          expect(unitDoc.phases).to.deep.equal([phaseId])

          LessonCollection.insert(lessonDoc)

          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => {})
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => true)

          const { phasesRemoved } = removeLesson.call({ userId }, { _id: lessonDoc._id })
          expect(phasesRemoved).to.equal(1)
          expect(PhaseCollection.find(phaseId).count()).to.equal(0)
        })
        it('does not remove global phases or master phases', function () {
          const { userId, lessonDoc } = stubTeacherDocs()
          const unitId = UnitCollection.insert({ createdBy: userId, title: Random.id() })
          lessonDoc.unit = unitId

          const phaseId = PhaseCollection.insert({ createdBy: userId, unit: unitId, title: Random.id() })
          const othersPhaseId = PhaseCollection.insert({ createdBy: Random.id(), unit: unitId, title: Random.id() })
          const globalPhaseId = PhaseCollection.insert({ createdBy: userId, title: Random.id() })
          const masterPhaseId = PhaseCollection.insert({ _master: true, createdBy: userId, title: Random.id() })
          UnitCollection.update(unitId, { $set: { phases: [phaseId, othersPhaseId, globalPhaseId, masterPhaseId] } })

          const unitDoc = UnitCollection.findOne(unitId)
          expect(unitDoc.phases).to.deep.equal([phaseId, othersPhaseId, globalPhaseId, masterPhaseId])

          LessonCollection.insert(lessonDoc)

          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => {})
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => true)

          const { phasesRemoved } = removeLesson.call({ userId }, { _id: lessonDoc._id })
          expect(phasesRemoved).to.equal(1)
          expect(PhaseCollection.find(phaseId).count()).to.equal(0)
          expect(PhaseCollection.find(othersPhaseId).count()).to.equal(1)
          expect(PhaseCollection.find(globalPhaseId).count()).to.equal(1)
          expect(PhaseCollection.find(masterPhaseId).count()).to.equal(1)
        })
        it('removes cloned material', function () {
          const { userId, lessonDoc } = stubTeacherDocs()
          const unitId = UnitCollection.insert({
            createdBy: userId,
            title: Random.id()
          })

          // connect task with unit and with lesson
          const taskId = TaskCollection.insert({ createdBy: userId, title: Random.id() })
          UnitCollection.update(unitId, { $set: { tasks: [taskId] } })
          lessonDoc.unit = unitId

          // check unit integrit
          const unitDoc = UnitCollection.findOne(unitId)
          expect(unitDoc.tasks).to.deep.equal([taskId])

          LessonCollection.insert(lessonDoc)

          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => {})
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => true)

          const { materialRemoved } = removeLesson.call({ userId }, { _id: lessonDoc._id })
          const entries = Object.entries(materialRemoved)
          expect(entries.length).to.equal(8)

          entries.forEach(([context, removeCount]) => {
            if (context === Task.name) {
              expect(removeCount).to.equal(1)
            }
            else {
              expect(removeCount).to.equal(0)
            }
          })

          expect(TaskCollection.find(taskId).count()).to.equal(0)
        })

        it('does not remove master material', function () {
          const { userId, lessonDoc } = stubTeacherDocs()
          const unitId = UnitCollection.insert({ createdBy: userId, title: Random.id() })
          lessonDoc.unit = unitId

          const taskId = TaskCollection.insert({ _master: true, createdBy: userId, title: Random.id() })
          UnitCollection.update(unitId, { $set: { tasks: [taskId] } })

          const unitDoc = UnitCollection.findOne(unitId)
          expect(unitDoc.tasks).to.deep.equal([taskId])

          LessonCollection.insert(lessonDoc)

          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => {})
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => true)

          const result = removeLesson.call({ userId }, { _id: lessonDoc._id })
          const { materialRemoved } = result

          Object.entries(materialRemoved).forEach(([context, removeCount]) => {
            expect(removeCount).to.equal(0)
          })

          expect(TaskCollection.find(taskId).count()).to.equal(1)
        })
      })

      describe(Lesson.methods.material.name, function () {
        const listLessonMaterial = Lesson.methods.material.run

        checkLesson(listLessonMaterial, LessonStates.isRunning)
        checkClass(listLessonMaterial, { isStudent: true, isTeacher: false })

        it('returns undefined if no material is considered visible', function () {
          const { lessonDoc, userId } = stubStudentDocs({ startedAt: new Date() })
          expect(listLessonMaterial.call({ userId }, lessonDoc)).to.equal(undefined)
        })

        it('throws if a collection is not found by context, referenced in the material', function () {
          const reference = { _id: Random.id(), context: Random.id() }
          const { lessonDoc, userId } = stubStudentDocs({ startedAt: new Date(), visibleStudent: [reference] })
          expect(() => listLessonMaterial.call({ userId }, lessonDoc)).to.throw('collectionNotFound')
        })
        it('returns the material, referenced by a lesson doc', function () {
          const taskId = Random.id()
          const taskDoc = { _id: taskId, title: Random.id() }
          Object.assign(taskDoc, Task.helpers.createData())

          const reference = { _id: taskId, context: Task.name }
          const { lessonDoc, userId } = stubStudentDocs({ startedAt: new Date(), visibleStudent: [reference] })
          TaskCollection.insert(taskDoc)

          const materialDocs = listLessonMaterial.call({ userId }, lessonDoc)
          expect(materialDocs).to.deep.equal({ [Task.name]: [taskDoc] })
        })
        it('indicates if there are docs not found, but referenced in the material', function () {
          const taskId = Random.id()
          const reference = { _id: taskId, context: Task.name }
          const { lessonDoc, userId } = stubStudentDocs({ startedAt: new Date(), visibleStudent: [reference] })

          const materialDocs = listLessonMaterial.call({ userId }, lessonDoc)
          expect(materialDocs).to.deep.equal({ [Task.name]: [], notFound: [{ context: Task.name, _id: taskId }] })
        })
        it('allows to skip material', function () {
          const taskId = Random.id()
          const taskDoc = { _id: taskId, title: Random.id() }
          const reference = { _id: taskId, context: Task.name }
          const { lessonDoc, userId } = stubStudentDocs({ startedAt: new Date(), visibleStudent: [reference] })
          TaskCollection.insert(taskDoc)

          const materialDocs = listLessonMaterial.call({ userId }, { _id: lessonDoc._id, skip: [taskId] })
          expect(materialDocs).to.deep.equal({})
        })
      })

      describe(Lesson.methods.units.name, function () {
        const getUnits = Lesson.methods.units.run

        it('throws if any of the given lessons is not found by _id', function () {
          const lessonId = Random.id()
          const userId = Random.id()
          stubUserDoc({ userId })
          expect(() => getUnits.call({ userId }, { lessonIds: [lessonId] })).to.throw(DocNotFoundError.name)
          expect(() => getUnits.call({ userId }, { lessonIds: [lessonId] })).to.throw(lessonId)
        })
        it('throws if any of the linked class docs is not found by _id', function () {
          const lessonId = Random.id()
          const classId = Random.id()
          const userId = Random.id()
          const lessonDoc = { _id: lessonId, classId }
          stubLessonDoc(lessonDoc)
          stubUserDoc({ userId })
          expect(() => getUnits.call({ userId }, { lessonIds: [lessonId] })).to.throw(DocNotFoundError.name)
          expect(() => getUnits.call({ userId }, { lessonIds: [lessonId] })).to.throw(classId)
        })
        it('throws if the user is not member of any of the linked classes', function () {
          const lessonId = Random.id()
          const classId = Random.id()
          const userId = Random.id()
          const lessonDoc = { _id: lessonId, classId }
          const classDoc = { _id: classId }
          stubLessonDoc(lessonDoc)
          stubUserDoc({ userId })
          stubClassDoc(classDoc)
          expect(() => getUnits.call({ userId }, { lessonIds: [lessonId] })).to.throw('permissionDenied')
          expect(() => getUnits.call({ userId }, { lessonIds: [lessonId] })).to.throw(SchoolClass.errors.notMember)
        })
        it('throws if any of the linked units does not exists', function () {
          const lessonId = Random.id()
          const classId = Random.id()
          const userId = Random.id()
          const unitId = Random.id()
          const lessonDoc = { _id: lessonId, classId, unit: unitId }
          const classDoc = { _id: classId }
          stub(Lesson.helpers, 'isMemberOfLesson', () => ({ lessonDoc, classDoc }))

          const thrown = expect(() => getUnits.call({ userId }, { lessonIds: [lessonId] })).to.throw(DocNotFoundError.name)
          thrown.with.property('reason', 'getDocument.docUndefined')
          thrown.to.have.deep.property('details', { name: Unit.name, query: unitId })
        })
        it('returns all units by given lesson ids', function () {
          const lessonIds = [Random.id(), Random.id()]
          const classId = Random.id()
          const userId = Random.id()
          const unitIds = [Random.id(), Random.id()]
          const unitDocs = unitIds.map(unitId => {
            return { _id: unitId, title: Random.id() }
          })

          stub(UnitCollection, 'findOne', id => unitDocs.find(doc => doc._id === id))

          const lessonDocs = lessonIds.map((lessonId, index) => ({ _id: lessonId, classId, unit: unitIds[index] }))
          const classDoc = { _id: classId }

          stub(Lesson.helpers, 'isMemberOfLesson', ({ lessonId }) => {
            return {
              lessonDoc: lessonDocs.find(doc => doc._id === lessonId),
              classDoc
            }
          })

          const foundUnitDocs = getUnits.call({ userId }, { lessonIds })
          expect(foundUnitDocs).to.deep.equal(unitDocs)
        })
      })
    })

    describe('publications', function () {
      describe(Lesson.publications.editor.name, function () {
        it('is not implemented')
      })
      describe(Lesson.publications.my.name, function () {
        it('is not implemented')
      })
      describe(Lesson.publications.byClassStudent.name, function () {
        it('is not implemented')
      })
      describe(Lesson.publications.single.name, function () {
        it('is not implemented')
      })
    })
  })
})
