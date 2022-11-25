/* eslint-env mocha */
import { Random } from 'meteor/random'
import {
  clearCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../../tests/testutils/mockCollection'
import { Lesson } from '../Lesson'
import { SchoolClass } from '../../schoolclass/SchoolClass'
import { UserUtils } from '../../../system/accounts/users/UserUtils'
import { LessonStates } from '../LessonStates'
import { stub, restore, restoreAll } from '../../../../../tests/testutils/stub'
import {
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
import { Users } from '../../../system/accounts/users/User'
import { LessonHelpers } from '../LessonHelpers'

// require startup files to initialize Material
import '../../../../startup/server/contexts'
import { mockUnitDoc } from '../../../../../tests/testutils/doc/mockUnitDoc'
import { mockPhaseDoc } from '../../../../../tests/testutils/doc/mockPhaseDoc'
import { mockClassDoc } from '../../../../../tests/testutils/doc/mockClassDoc'
import { Group } from '../../group/Group'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'

const log = () => {
}

describe(Lesson.name, function () {
  let LessonCollection
  let UnitCollection
  let SchoolClassCollection
  let PhaseCollection
  let TaskCollection

  before(function () {
    [LessonCollection, UnitCollection, SchoolClassCollection, PhaseCollection, TaskCollection] = mockCollections(
      [Lesson, { noSchema: false }],
      Unit,
      SchoolClass,
      Phase,
      Task,
      Users,
      Group
    )
  })

  afterEach(function () {
    clearCollections(Users, Lesson, Unit, SchoolClass, Phase, Task)
    restoreAll()
  })

  after(function () {
    restoreAllCollections()
  })

  onServerExec(() => {
    describe('methods', function () {
      // ======================================================================
      // CREATE
      // ======================================================================
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

          const expectError = expect(() => createLesson.call({ userId, log }, lessonCreateDoc))
            .to.throw(DocNotFoundError.name)
          expectError.with.property('reason', 'getDocument.docUndefined')
          expectError.to.have.deep.property('details', { query: unit, name: Unit.name })
        })
        it('throws if the given class does not exists', function () {
          const originalUnit = Random.id()
          const classId = Random.id()
          const lessonCreateDoc = { classId, unit: originalUnit }

          mockUnitDoc({ _id: originalUnit }, UnitCollection)

          const expectError = expect(() => createLesson(lessonCreateDoc)).to.throw(DocNotFoundError.name)
          expectError.with.property('reason', 'getDocument.docUndefined')
          expectError.to.have.deep.property('details', { name: SchoolClass.name, query: classId })
        })
        it('creates a new lesson doc', function () {
          const userId = Random.id()
          const classId = Random.id()
          const originalUnit = Random.id()
          mockUnitDoc({ _id: originalUnit }, UnitCollection)

          stub(SchoolClassCollection, 'findOne', () => ({ _id: classId, createdBy: userId }))
          stub(UserUtils, 'isAdmin', () => false)

          const { lessonId, unitId } = createLesson.call({ userId, log }, { classId, unit: originalUnit })
          expect(unitId).to.not.equal(originalUnit)
          const lessonDoc = LessonCollection.findOne(lessonId)
          expect(lessonDoc.unitOriginal).to.equal(originalUnit)
          expect(lessonDoc.classId).to.equal(classId)
        })

        it('creates a copy of the given master unit', function () {
          const userId = Random.id()
          const phaseDoc = mockPhaseDoc({}, PhaseCollection)
          const unitOriginal = mockUnitDoc({
            createdBy: userId,
            phases: [phaseDoc._id]
          }, UnitCollection)

          const classId = Random.id()
          const lessonCreateDoc = { classId, unit: unitOriginal._id, createdBy: userId }

          stub(UserUtils, 'isAdmin', () => false)
          stub(SchoolClassCollection, 'findOne', () => {
            return Object.assign({}, { _id: classId, createdBy: userId })
          })

          const { lessonId, unitId } = createLesson.call({ userId, log }, lessonCreateDoc)
          restore(UserUtils, 'isAdmin')
          restore(SchoolClassCollection, 'findOne')

          const lessonDoc = LessonCollection.findOne(lessonId)
          expect(lessonDoc.unitOriginal).to.equal(unitOriginal._id)
          expect(lessonDoc.unit).to.not.equal(unitOriginal._id)
          expect(lessonDoc.unit).to.equal(unitId)

          const newUnit = UnitCollection.findOne(lessonDoc.unit)
          expect(newUnit.title).to.equal(unitOriginal.title)
          expect(newUnit.phases.length).to.equal(unitOriginal.phases.length)
        })
        it('creates copies of the given master phases', function () {
          const unitOriginal = mockUnitDoc({
            _id: Random.id(),
            title: Random.id(),
            phases: []
          })

          const originalPhases = []
          for (let i = 0; i < 3; i++) {
            const originalPhaseDoc = mockPhaseDoc({
              _id: Random.id(),
              title: Random.id(),
              unit: unitOriginal._id
            }, PhaseCollection)
            originalPhases.push(originalPhaseDoc)
          }

          unitOriginal.phases = originalPhases.map(e => e._id)
          UnitCollection.insert(unitOriginal)

          const classId = Random.id()
          const userId = Random.id()
          const lessonCreateDoc = { classId, unit: unitOriginal._id, createdBy: userId }
          mockClassDoc({ _id: classId, createdBy: userId }, SchoolClassCollection)

          stub(UserUtils, 'isAdmin', () => false)

          const { lessonId } = createLesson.call({ userId, log }, lessonCreateDoc)
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

      // ======================================================================
      // START
      // ======================================================================
      describe(Lesson.methods.start.name, function () {
        const startLesson = Lesson.methods.start.run

        checkLesson(startLesson, LessonStates.canStart)
        checkClass(startLesson)

        it('updates the lesson state to running', function () {
          const unit = Random.id()
          const { userId, lessonDoc } = stubTeacherDocs({ unit })
          LessonCollection.insert(lessonDoc)

          const started = startLesson.call({ userId, log }, lessonDoc)
          const updatedDoc = LessonCollection.findOne(lessonDoc._id)
          expect(started).to.equal(true)
          expect(LessonStates.isRunning(updatedDoc))
        })
      })

      // ======================================================================
      // TOGGLE
      // ======================================================================
      describe(Lesson.methods.toggle.name, function () {
        const toggleMaterial = Lesson.methods.toggle.run

        checkLesson(toggleMaterial, LessonStates.canToggle)
        checkClass(toggleMaterial, { userId: Random.id() })

        it('throws if the material is not existent', function () {
          const unit = Random.id()
          const name = Random.id(6)
          const { lessonDoc, userId } = stubTeacherDocs({ startedAt: new Date(), unit })
          const thrown = expect(() => toggleMaterial.call({ userId, log }, {
            _id: lessonDoc._id,
            referenceId: Random.id(),
            context: name
          })).to.throw('collectionNotFound')
          thrown.with.property('reason', 'getCollection.notFoundByName')
          thrown.to.have.deep.property('details', { name })
        })

        it('pushes material to the list, if not visible', function () {
          const { lessonDoc, userId } = stubTeacherDocs({ startedAt: new Date() })
          const taskId = Random.id()
          const taskDoc = { _id: Random.id() }

          stubTaskDoc(taskDoc)
          const toggleDoc = { _id: lessonDoc._id, referenceId: taskId, context: Task.name }

          LessonCollection.insert(lessonDoc)
          const toggled = toggleMaterial.call({ userId, log }, toggleDoc)

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
          const toggled = toggleMaterial.call({ userId, log }, toggleDoc)

          expect(toggled).to.equal(true)
          restore(LessonCollection, 'findOne')

          const updatedDoc = LessonCollection.findOne(lessonDoc._id)
          expect(updatedDoc.visibleStudent).to.deep.equal([])
        })
      })

      // ======================================================================
      // COMPLETE
      // ======================================================================
      describe(Lesson.methods.complete.name, function () {
        const completeLesson = Lesson.methods.complete.run

        checkLesson(completeLesson, LessonStates.canComplete)
        checkClass(completeLesson)

        it('updates the lesson state to completed', function () {
          const { userId, lessonDoc } = stubTeacherDocs()
          lessonDoc.startedAt = new Date()
          LessonCollection.insert(lessonDoc)

          const completed = completeLesson.call({ userId, log }, lessonDoc)
          const updatedDoc = LessonCollection.findOne(lessonDoc._id)
          expect(completed).to.equal(true)
          expect(LessonStates.isCompleted(updatedDoc))
        })
      })

      // ======================================================================
      // RESTART
      // ======================================================================
      describe(Lesson.methods.restart.name, function () {
        const restartLesson = Lesson.methods.restart.run

        checkLesson(restartLesson, LessonStates.canRestart)
        checkClass(restartLesson)

        it('restarts the lesson', function () {
          const { userId, lessonDoc } = stubTeacherDocs()
          lessonDoc.startedAt = new Date()
          LessonCollection.insert(lessonDoc)
          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => 0)
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => true)
          const { lessonReset } = restartLesson.call({ userId, log }, lessonDoc)

          const updatedDoc = LessonCollection.findOne(lessonDoc._id)
          expect(lessonReset).to.equal(true)
          expect(LessonStates.isIdle(updatedDoc))
        })

        it('removes all visible references', function () {
          const { userId, lessonDoc } = stubTeacherDocs()
          lessonDoc.startedAt = new Date()
          lessonDoc.visibleStudent = [{ _id: Random.id(), context: Random.id(5) }]
          lessonDoc.visibleBeamer = [Random.id()]
          lessonDoc.phase = Random.id()
          LessonCollection.insert(lessonDoc)

          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => 123)
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => 456)
          const { runtimeDocs, beamerReset, lessonReset, groupDocs } = restartLesson.call({ userId, log }, lessonDoc)

          // otherwise it returns always the stubbed doc
          expect(runtimeDocs).to.equal(123)
          expect(beamerReset).to.equal(456)
          expect(lessonReset).to.equal(true)
          expect(groupDocs).to.equal(0)

          restore(LessonCollection, 'findOne')
          const updatedDoc = LessonCollection.findOne(lessonDoc._id)
          expect(updatedDoc.visibleStudent).to.equal(undefined)
          expect(updatedDoc.visibleStudent).to.equal(undefined)
          expect(updatedDoc.visibleBeamer).to.equal(undefined)
        })
        it('resets all groups, associated with this lesson')
      })

      // ======================================================================
      // REMOVE
      // ======================================================================
      describe(Lesson.methods.remove.name, function () {
        const removeLesson = Lesson.methods.remove.run

        checkLesson(removeLesson)
        checkClass(removeLesson, { userId: Random.id() })

        it('throws if the lesson does not exists', function () {
          const lessonId = Random.id()
          const userId = Random.id()
          const env = { userId, log }
          const args = { _id: lessonId }
          const thrown = expect(() => removeLesson.call(env, args)).to.throw(DocNotFoundError.name)
          thrown.with.property('reason', 'getDocument.docUndefined')
          thrown.to.have.deep.property('details', { name: Lesson.name, query: lessonId })
        })

        it('removes lesson', function () {
          const userId = Random.id()
          const unitDoc = mockUnitDoc({ createdBy: userId }, UnitCollection)
          const unitId = unitDoc._id
          const { lessonDoc } = stubTeacherDocs({}, { userId, unit: unitId })

          LessonCollection.insert(lessonDoc)
          expect(LessonCollection.find(lessonDoc._id).count()).to.equal(1)

          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => 123)
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => 456)
          stub(LessonRuntime, LessonRuntime.removeAllMaterial.name, () => 0)

          const { lessonRemoved, unitRemoved, runtimeDocsRemoved, beamerRemoved } = removeLesson.call({
            userId,
            log
          }, { _id: lessonDoc._id })
          expect(lessonRemoved).to.equal(1)
          expect(unitRemoved).to.equal(1)
          expect(runtimeDocsRemoved).to.equal(123)
          expect(beamerRemoved).to.equal(456)
          expect(LessonCollection.find(lessonDoc._id).count()).to.equal(0)
          expect(UnitCollection.find(unitDoc._id).count()).to.equal(0)
        })

        it('still removes lesson, even in case the linked unit does not exist', function () {
          const userId = Random.id()
          const unitId = Random.id()
          const { lessonDoc } = stubTeacherDocs({}, { userId, unit: unitId })

          LessonCollection.insert(lessonDoc)
          expect(LessonCollection.find(lessonDoc._id).count()).to.equal(1)

          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => 123)
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => 456)
          stub(LessonRuntime, LessonRuntime.removeAllMaterial.name, () => 0)

          const { lessonRemoved, unitRemoved, runtimeDocsRemoved, beamerRemoved } = removeLesson.call({
            userId,
            log
          }, { _id: lessonDoc._id })
          expect(lessonRemoved).to.equal(1)
          expect(unitRemoved).to.equal(0)
          expect(runtimeDocsRemoved).to.equal(123)
          expect(beamerRemoved).to.equal(456)
          expect(LessonCollection.find(lessonDoc._id).count()).to.equal(0)
          expect(UnitCollection.find(unitId).count()).to.equal(0)
        })

        it('does not remove master unit', function () {
          const userId = Random.id()
          const unitDoc = mockUnitDoc({ _master: true, createdBy: userId }, UnitCollection)
          const unitId = unitDoc._id
          const { lessonDoc } = stubTeacherDocs({}, { userId, unit: unitId })

          LessonCollection.insert(lessonDoc)
          expect(LessonCollection.find(lessonDoc._id).count()).to.equal(1)

          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => 1)
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => 1)
          stub(LessonRuntime, LessonRuntime.removeAllMaterial.name, () => 0)

          const { lessonRemoved, unitRemoved } = removeLesson.call({ userId, log }, { _id: lessonDoc._id })
          expect(lessonRemoved).to.equal(1)
          expect(unitRemoved).to.equal(0)
          expect(LessonCollection.find(lessonDoc._id).count()).to.equal(0)
          expect(UnitCollection.find(unitDoc._id).count()).to.equal(1)
        })

        it('removes cloned phases', function () {
          const userId = Random.id()
          const phaseDoc = mockPhaseDoc({ createdBy: userId })
          const unitDoc = mockUnitDoc({ phases: [phaseDoc._id], createdBy: userId }, UnitCollection)
          const unitId = unitDoc._id
          phaseDoc.unit = unitId

          const { lessonDoc } = stubTeacherDocs({}, { unit: unitId, userId })
          const phaseId = PhaseCollection.insert(phaseDoc)
          expect(unitDoc.phases).to.deep.equal([phaseDoc._id])

          LessonCollection.insert(lessonDoc)
          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => 0)
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => 0)
          stub(LessonRuntime, LessonRuntime.removeAllMaterial.name, () => 0)

          const { phasesRemoved } = removeLesson.call({ userId, log }, { _id: lessonDoc._id })
          expect(phasesRemoved).to.equal(1)
          expect(PhaseCollection.find(phaseId).count()).to.equal(0)
        })

        it('does not remove global phases or master phases', function () {
          const userId = Random.id()
          const phaseDoc = mockPhaseDoc({ createdBy: userId })
          let unitDoc = mockUnitDoc({ phases: [phaseDoc._id], createdBy: userId }, UnitCollection)
          const unitId = unitDoc._id
          phaseDoc.unit = unitId

          const { lessonDoc } = stubTeacherDocs({}, { unit: unitId, userId })
          const phaseId = PhaseCollection.insert(phaseDoc)

          const othersPhaseId = mockPhaseDoc({ unit: unitId }, PhaseCollection)._id
          const globalPhaseId = mockPhaseDoc({ createdBy: userId }, PhaseCollection)._id
          const masterPhaseId = mockPhaseDoc({ _master: true }, PhaseCollection)._id
          UnitCollection.update(unitId, { $set: { phases: [phaseId, othersPhaseId, globalPhaseId, masterPhaseId] } })
          unitDoc = UnitCollection.findOne(unitId)
          expect(unitDoc.phases).to.deep.equal([phaseId, othersPhaseId, globalPhaseId, masterPhaseId])

          LessonCollection.insert(lessonDoc)
          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => 0)
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => 0)
          stub(LessonRuntime, LessonRuntime.removeAllMaterial.name, () => 0)

          const { phasesRemoved } = removeLesson.call({ userId, log }, { _id: lessonDoc._id })
          expect(PhaseCollection.find(phaseId).count()).to.equal(0)
          expect(PhaseCollection.find(othersPhaseId).count()).to.equal(1)
          expect(PhaseCollection.find(globalPhaseId).count()).to.equal(1)
          expect(PhaseCollection.find(masterPhaseId).count()).to.equal(1)
          expect(phasesRemoved).to.equal(1)
        })

        it('removes cloned material', function () {
          const userId = Random.id()
          let unitDoc = mockUnitDoc({ createdBy: userId }, UnitCollection)
          const unitId = unitDoc._id
          const { lessonDoc } = stubTeacherDocs({}, { userId, unit: unitId })

          // connect task with unit and with lesson
          const taskId = TaskCollection.insert({ createdBy: userId, title: Random.id() })
          UnitCollection.update(unitId, { $set: { tasks: [taskId] } })
          unitDoc = UnitCollection.findOne(unitId)
          expect(unitDoc.tasks).to.deep.equal([taskId])

          LessonCollection.insert(lessonDoc)
          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => 0)
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => 0)

          const { materialRemoved } = removeLesson.call({ userId, log }, { _id: lessonDoc._id })
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
          const userId = Random.id()
          let unitDoc = mockUnitDoc({ createdBy: userId }, UnitCollection)
          const unitId = unitDoc._id
          const { lessonDoc } = stubTeacherDocs({}, { userId, unit: unitId })

          // connect task with unit and with lesson
          const taskId = TaskCollection.insert({ _master: true, createdBy: userId, title: Random.id() })
          UnitCollection.update(unitId, { $set: { tasks: [taskId] } })
          unitDoc = UnitCollection.findOne(unitId)
          expect(unitDoc.tasks).to.deep.equal([taskId])

          LessonCollection.insert(lessonDoc)
          stub(LessonRuntime, LessonRuntime.removeDocuments.name, () => 0)
          stub(LessonRuntime, LessonRuntime.resetBeamer.name, () => 0)

          const { materialRemoved } = removeLesson.call({ userId, log }, { _id: lessonDoc._id })
          const entries = Object.entries(materialRemoved)
          expect(entries.length).to.equal(8)

          entries.forEach(([context, removeCount]) => {
            expect(removeCount).to.equal(0)
          })

          expect(TaskCollection.find(taskId).count()).to.equal(1)
        })

        it('removes custom material only if it\'s not used by other lessons')
        it('removes groups, associated with this lesson')
      })

      // ======================================================================
      // MATERIAL
      // ======================================================================
      describe(Lesson.methods.material.name, function () {
        const getLessonMaterial = Lesson.methods.material.run

        checkLesson(getLessonMaterial, LessonStates.isRunning)
        checkClass(getLessonMaterial, { isStudent: true, isTeacher: false })

        it('returns undefined if no material is considered visible', function () {
          const { lessonDoc, userId } = stubStudentDocs({ startedAt: new Date() })
          expect(getLessonMaterial.call({ userId, log }, lessonDoc)).to.equal(undefined)
        })

        it('throws if a collection is not found by context, referenced in the material', function () {
          const reference = { _id: Random.id(), context: Random.id() }
          const { lessonDoc, userId } = stubStudentDocs({ startedAt: new Date(), visibleStudent: [reference] })
          expect(() => getLessonMaterial.call({ userId, log }, lessonDoc)).to.throw('collectionNotFound')
        })
        it('returns the material, referenced by a lesson doc', function () {
          const taskId = Random.id()
          const taskDoc = { _id: taskId, title: Random.id() }
          Object.assign(taskDoc, Task.helpers.createData())

          const reference = { _id: taskId, context: Task.name }
          const { lessonDoc, userId } = stubStudentDocs({ startedAt: new Date(), visibleStudent: [reference] })
          TaskCollection.insert(taskDoc)

          const materialDocs = getLessonMaterial.call({ userId, log }, lessonDoc)
          expect(materialDocs).to.deep.equal({ [Task.name]: [taskDoc] })
        })
        it('indicates if there are docs not found, but referenced in the material', function () {
          const taskId = Random.id()
          const reference = { _id: taskId, context: Task.name }
          const { lessonDoc, userId } = stubStudentDocs({ startedAt: new Date(), visibleStudent: [reference] })

          const materialDocs = getLessonMaterial.call({ userId, log }, lessonDoc)
          expect(materialDocs).to.deep.equal({ [Task.name]: [], notFound: [{ context: Task.name, _id: taskId }] })
        })
        it('allows to skip material', function () {
          const taskId = Random.id()
          const taskDoc = { _id: taskId, title: Random.id() }
          const reference = { _id: taskId, context: Task.name }
          const { lessonDoc, userId } = stubStudentDocs({ startedAt: new Date(), visibleStudent: [reference] })
          TaskCollection.insert(taskDoc)

          const materialDocs = getLessonMaterial.call({ userId, log }, { _id: lessonDoc._id, skip: [taskId] })
          expect(materialDocs).to.deep.equal({})
        })
      })

      // ======================================================================
      // UNIT
      // ======================================================================
      describe(Lesson.methods.units.name, function () {
        const getUnits = Lesson.methods.units.run

        it('throws if the user is not member of any of the linked classes', function () {
          const lessonId = Random.id()
          const classId = Random.id()
          const userId = Random.id()
          const classDoc = { _id: classId, title: Random.id(6), createdBy: Random.id() }
          const lessonDoc = { _id: lessonId, classId, createdBy: Random.id(), unit: Random.id() }
          SchoolClassCollection.insert(classDoc)
          LessonCollection.insert(lessonDoc)

          const expectThrown = expect(() => getUnits.call({ userId, log }, { lessonIds: [lessonId] }))
            .to.throw(PermissionDeniedError.name)
          expectThrown.with.property('reason', SchoolClass.errors.notMember)
          expectThrown.to.have.deep.property('details', { userId })
        })
        it('returns all units by given lesson ids', function () {
          const lessonIds = [Random.id(), Random.id()]
          const classId = Random.id()
          const userId = Random.id()
          const unitIds = [Random.id(), Random.id()]
          const unitDocs = unitIds.map(unitId => {
            return { _id: unitId, title: Random.id(), pocket: Random.id(), index: 0, period: 10 }
          })

          const lessonDocs = lessonIds.map((lessonId, index) => ({ _id: lessonId, classId, unit: unitIds[index] }))
          lessonDocs.forEach(doc => LessonCollection.insert(doc))
          unitDocs.forEach(doc => UnitCollection.insert(doc))

          const classDoc = { _id: classId, title: Random.id() }
          SchoolClassCollection.insert(classDoc)

          stub(LessonHelpers, 'isMemberOfClass', () => true)

          const foundUnitDocs = getUnits.call({ userId, log }, { lessonIds })
          expect(foundUnitDocs).to.deep.equal(unitDocs)
        })
        it('skips units that are not found by _id')
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
