/* eslint-env mocha */
import { Random } from 'meteor/random'
import {
  clearCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../../tests/testutils/mockCollection'
import { Lesson } from '../Lesson'
import { SchoolClass } from '../../schoolclass/SchoolClass'
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
import { DocNotFoundError } from '../../../../api/errors/types/DocNotFoundError'
import { expect } from 'chai'
import { Unit } from '../../../curriculum/curriculum/unit/Unit'
import { Task } from '../../../curriculum/curriculum/task/Task'
import { Phase } from '../../../curriculum/curriculum/phase/Phase'
import { Users } from '../../../system/accounts/users/User'

// require startup files to initialize Material
import '../../../../startup/server/contexts'
import { mockUnitDoc } from '../../../../../tests/testutils/doc/mockUnitDoc'
import { mockPhaseDoc } from '../../../../../tests/testutils/doc/mockPhaseDoc'
import { mockClassDoc } from '../../../../../tests/testutils/doc/mockClassDoc'
import { Group } from '../../group/Group'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
import { createGroupDoc } from '../../../../../tests/testutils/doc/createGroupDoc'
import { getCollection } from '../../../../api/utils/getCollection'
import { Admin } from '../../../system/accounts/admin/Admin'
import { expectThrow } from '../../../../../tests/testutils/expectThrow'
import { count } from '../../../../utils/count'
import { Beamer } from '../../../beamer/Beamer'
import { TaskResults } from '../../../tasks/results/TaskResults'
import { TaskWorkingState } from '../../../tasks/state/TaskWorkingState'
import { ImageFiles } from '../../../files/image/ImageFiles'
import { AudioFiles } from '../../../files/audio/AudioFiles'
import { VideoFiles } from '../../../files/video/VideoFiles'
import { DocumentFiles } from '../../../files/document/DocumentFiles'
import { EmbeddedResource } from '../../../resources/web/embedded/EmbeddedResource'
import { Literature } from '../../../resources/web/literature/Literature'
import { LinkedResource } from '../../../resources/web/linked/LinkedResource'
import { Dimension } from '../../../curriculum/curriculum/dimension/Dimension'
import { Objective } from '../../../curriculum/curriculum/objective/Objective'
import { Pocket } from '../../../curriculum/curriculum/pocket/Pocket'
import { WebResources } from '../../../resources/web/WebResources'

const log = () => {
}

describe(Lesson.name, () => {
  let LessonCollection
  let UnitCollection
  let SchoolClassCollection
  let PhaseCollection
  let TaskCollection

  before(() => {
    [LessonCollection, UnitCollection, SchoolClassCollection, PhaseCollection, TaskCollection] = mockCollections(
      Lesson,
      Unit,
      SchoolClass,
      Phase,
      Task,
      Users,
      Group,
      Admin,
      TaskResults,
      TaskWorkingState,
      ImageFiles,
      AudioFiles,
      VideoFiles,
      DocumentFiles,
      Beamer,
      EmbeddedResource,
      Literature,
      LinkedResource,
      Dimension,
      Objective,
      Pocket,
      WebResources
    )
  })

  afterEach(async () => {
    await clearCollections(Lesson, Unit, SchoolClass, Phase, Task, Users)
    restoreAll()
  })

  after(async () => {
    await restoreAllCollections()
  })

  describe('methods', () => {
    // ======================================================================
    // CREATE
    // ======================================================================
    const createLesson = Lesson.methods.create.run

    describe(Lesson.methods.create.name, () => {
      it('throws if the given original unit does not exists', async () => {
        const unitId = Random.id()
        const classId = Random.id()
        const userId = Random.id()
        const lessonCreateDoc = { classId, unitId }

        stubClassDoc({ _id: classId, createdBy: userId })
        stubUserDoc({ userId })
        stubAdmin(false)

        await expectThrow({
          fn: () => createLesson.call({ userId, log }, lessonCreateDoc),
          error: DocNotFoundError.name,
          reason: 'getDocument.docUndefined',
          details: { query: unitId, name: Unit.name }
        })
      })
      it('throws if the given class does not exists', async () => {
        const originalUnit = Random.id()
        const classId = Random.id()
        const lessonCreateDoc = { classId, unitId: originalUnit }

        await mockUnitDoc({ _id: originalUnit }, UnitCollection)
        await expectThrow({
          fn: () => createLesson.call({}, lessonCreateDoc),
          error: DocNotFoundError.name,
          reason: 'getDocument.docUndefined',
          details: { name: SchoolClass.name, query: classId }
        })
      })
      it('creates a new lesson doc', async () => {
        const userId = Random.id()
        const classId = Random.id()
        const originalUnit = Random.id()
        await mockUnitDoc({ _id: originalUnit }, UnitCollection)

        stub(SchoolClassCollection, 'findOneAsync', async () => ({ _id: classId, createdBy: userId }))

        const { lessonId, unitId } = await createLesson.call({ userId, log }, { classId, unitId: originalUnit })
        expect(unitId).to.not.equal(originalUnit)
        const lessonDoc = await LessonCollection.findOneAsync(lessonId)
        expect(lessonDoc.unitOriginal).to.equal(originalUnit)
        expect(lessonDoc.classId).to.equal(classId)
      })

      it('creates a copy of the given master unit', async () => {
        const userId = Random.id()
        const phaseDoc = await mockPhaseDoc({}, PhaseCollection)
        const unitOriginal = await mockUnitDoc({
          createdBy: userId,
          phases: [phaseDoc._id]
        }, UnitCollection)

        const classId = Random.id()
        const lessonCreateDoc = { classId, unitId: unitOriginal._id, createdBy: userId }

        // stub(UserUtils, 'isAdmin', () => false)
        stub(SchoolClassCollection, 'findOneAsync', async () => {
          return Object.assign({}, { _id: classId, createdBy: userId })
        })

        const { lessonId, unitId } = await createLesson.call({ userId, log }, lessonCreateDoc)
        // restore(UserUtils, 'isAdmin')
        restore(SchoolClassCollection, 'findOne')

        const lessonDoc = await LessonCollection.findOneAsync(lessonId)
        expect(lessonDoc.unitOriginal).to.equal(unitOriginal._id)
        expect(lessonDoc.unit).to.not.equal(unitOriginal._id)
        expect(lessonDoc.unit).to.equal(unitId)

        const newUnit = await UnitCollection.findOneAsync(lessonDoc.unit)
        expect(newUnit.title).to.equal(unitOriginal.title)
        expect(newUnit.phases.length).to.equal(unitOriginal.phases.length)
      })
      it('creates copies of the given master phases', async () => {
        const unitOriginal = await mockUnitDoc({
          _id: Random.id(),
          title: Random.id(),
          phases: []
        })

        const originalPhases = []
        for (let i = 0; i < 3; i++) {
          const originalPhaseDoc = await mockPhaseDoc({
            _id: Random.id(),
            title: Random.id(),
            unit: unitOriginal._id
          }, PhaseCollection)
          originalPhases.push(originalPhaseDoc)
        }

        unitOriginal.phases = originalPhases.map(e => e._id)
        await UnitCollection.insertAsync(unitOriginal)

        const classId = Random.id()
        const userId = Random.id()
        const lessonCreateDoc = { classId, unitId: unitOriginal._id, createdBy: userId }
        await mockClassDoc({ _id: classId, createdBy: userId }, SchoolClassCollection)

        const { lessonId } = await createLesson.call({ userId, log }, lessonCreateDoc)
        const lessonDoc = await LessonCollection.findOneAsync(lessonId)
        const newUnit = await UnitCollection.findOneAsync(lessonDoc.unit)
        expect(newUnit.title).to.equal(unitOriginal.title)

        // check that new phase docs are not equal to the master docs
        const newPhases = newUnit.phases
        expect(newPhases).to.have.lengthOf(unitOriginal.phases.length)

        for (let i = 0; i < newPhases.length; i++) {
          const phaseId = newPhases[i]
          const newPhaseDoc = await PhaseCollection.findOneAsync(phaseId)
          const oldPhaseDoc = originalPhases[i]
          expect(newPhaseDoc._id).to.not.equal(oldPhaseDoc._id)
          expect(newPhaseDoc.unit).to.not.equal(unitOriginal._id)
        }
      })
    })

    // ======================================================================
    // START
    // ======================================================================
    describe(Lesson.methods.start.name, () => {
      const startLesson = Lesson.methods.start.run

      checkLesson(startLesson, LessonStates.canStart)
      checkClass(startLesson)

      it('updates the lesson state to running', async () => {
        const unit = Random.id()
        const { userId, lessonDoc } = await stubTeacherDocs({ unit })
        await LessonCollection.insertAsync(lessonDoc)

        const started = await startLesson.call({ userId, log }, lessonDoc)
        const updatedDoc = await LessonCollection.findOneAsync(lessonDoc._id)
        expect(started).to.equal(true)
        expect(LessonStates.isRunning(updatedDoc))
      })
    })

    // ======================================================================
    // TOGGLE
    // ======================================================================
    describe(Lesson.methods.toggle.name, () => {
      const toggleMaterial = Lesson.methods.toggle.run

      checkLesson(toggleMaterial, LessonStates.canToggle)
      checkClass(toggleMaterial, { userId: Random.id() })

      it('throws if the material is not existent', async () => {
        const unit = Random.id()
        const name = Random.id(6)
        const { lessonDoc, userId } = await stubTeacherDocs({ lessonProps: { startedAt: new Date(), unit } })
        await expectThrow({
          fn: () => toggleMaterial.call({ userId, log }, {
            _id: lessonDoc._id,
            referenceId: Random.id(),
            context: name
          }),
          error: 'collectionNotFound',
          reason: 'getCollection.notFoundByName',
          details: { name }
        })
      })

      it('pushes material to the list, if not visible', async () => {
        const { lessonDoc, userId } = await stubTeacherDocs({ lessonProps: { startedAt: new Date() } })
        const taskId = Random.id()
        const taskDoc = { _id: Random.id() }

        stubTaskDoc(taskDoc)
        const toggleDoc = { _id: lessonDoc._id, referenceId: taskId, context: Task.name }

        await LessonCollection.insertAsync(lessonDoc)
        const toggled = await toggleMaterial.call({ userId, log }, toggleDoc)

        expect(toggled).to.equal(true)
        restore(LessonCollection, 'findOneAsync')

        const updatedDoc = await LessonCollection.findOneAsync(lessonDoc._id)
        expect(updatedDoc.visibleStudent).to.deep.equal([{ _id: taskId, context: Task.name }])
      })
      it('pulls material from the list, if visible', async () => {
        const taskId = Random.id()
        const taskDoc = { _id: Random.id() }
        const { lessonDoc, userId } = await stubTeacherDocs({
          lessonProps: {
            startedAt: new Date(),
            visibleStudent: [{ _id: taskId, context: Task.name }]
          }
        })

        stubTaskDoc(taskDoc)
        const toggleDoc = { _id: lessonDoc._id, referenceId: taskId, context: Task.name }

        await LessonCollection.insertAsync(lessonDoc)
        const toggled = await toggleMaterial.call({ userId, log }, toggleDoc)

        expect(toggled).to.equal(true)
        restore(LessonCollection, 'findOneAsync')

        const updatedDoc = await LessonCollection.findOneAsync(lessonDoc._id)
        expect(updatedDoc.visibleStudent).to.deep.equal([])
      })
    })

    // ======================================================================
    // COMPLETE
    // ======================================================================
    describe(Lesson.methods.complete.name, () => {
      const completeLesson = Lesson.methods.complete.run

      checkLesson(completeLesson, LessonStates.canComplete)
      checkClass(completeLesson)

      it('updates the lesson state to completed', async () => {
        const { userId, lessonDoc } = await stubTeacherDocs()
        lessonDoc.startedAt = new Date()
        await LessonCollection.insertAsync(lessonDoc)

        const completed = await completeLesson.call({ userId, log }, lessonDoc)
        const updatedDoc = await LessonCollection.findOneAsync(lessonDoc._id)
        expect(completed).to.equal(true)
        expect(LessonStates.isCompleted(updatedDoc))
      })
    })

    // ======================================================================
    // RESTART
    // ======================================================================
    describe(Lesson.methods.restart.name, () => {
      const restartLesson = Lesson.methods.restart.run

      checkLesson(restartLesson, LessonStates.canRestart)
      checkClass(restartLesson)

      it('restarts the lesson', async () => {
        const { userId, lessonDoc } = await stubTeacherDocs({ lessonProps: { startedAt: new Date() } })
        await LessonCollection.insertAsync(lessonDoc)
        const result = await restartLesson.call({ userId, log }, lessonDoc)
        const updatedDoc = await LessonCollection.findOneAsync(lessonDoc._id)
        expect(result).to.deep.equal({
          beamerReset: -1, // no beamer doc exists
          groupDocs: { removed: 0, updated: 0 }, // no group was there
          lessonReset: 1, // the lesson doc was reset
          runtimeDocs: {
            [TaskResults.name]: 0,
            [TaskWorkingState.name]: 0,
            [ImageFiles.name]: 0,
            [AudioFiles.name]: 0,
            [VideoFiles.name]: 0,
            [DocumentFiles.name]: 0
          }
        })
        expect(LessonStates.isIdle(updatedDoc))
      })

      it('removes all visible references', async () => {
        const { userId, lessonDoc } = await stubTeacherDocs()
        lessonDoc.startedAt = new Date()
        lessonDoc.visibleStudent = [{ _id: Random.id(), context: Random.id(5) }]
        lessonDoc.visibleBeamer = [Random.id()]
        lessonDoc.phase = Random.id()
        await LessonCollection.insertAsync(lessonDoc)

        const result = await restartLesson.call({ userId, log }, lessonDoc)

        // otherwise it returns always the stubbed doc
        expect(result).to.deep.equal({
          beamerReset: -1, // no beamer doc exists
          groupDocs: { removed: 0, updated: 0 }, // no group was there
          lessonReset: 1, // the lesson doc was reset
          runtimeDocs: {
            [TaskResults.name]: 0,
            [TaskWorkingState.name]: 0,
            [ImageFiles.name]: 0,
            [AudioFiles.name]: 0,
            [VideoFiles.name]: 0,
            [DocumentFiles.name]: 0
          }
        })

        restore(LessonCollection, 'findOneAsync')
        const updatedDoc = await LessonCollection.findOneAsync(lessonDoc._id)
        expect(updatedDoc.visibleStudent).to.equal(undefined)
        expect(updatedDoc.visibleStudent).to.equal(undefined)
        expect(updatedDoc.visibleBeamer).to.equal(undefined)
      })
      it('resets all groups, associated with this lesson', async () => {
        const { userId, lessonDoc } = await stubTeacherDocs()
        lessonDoc.startedAt = new Date()
        lessonDoc.visibleStudent = [{ _id: Random.id(), context: Random.id(5) }]
        lessonDoc.visibleBeamer = [Random.id()]
        lessonDoc.phase = Random.id()
        await LessonCollection.insertAsync(lessonDoc)

        const unitId = lessonDoc.unit

        await getCollection(Group.name).insertAsync(createGroupDoc({ title: 'not remove', unitId }))
        await getCollection(Group.name).insertAsync(createGroupDoc({ title: 'to remove', unitId, isAdhoc: true }))

        const { groupDocs } = await restartLesson.call({ userId, log }, lessonDoc)

        expect(groupDocs).to.deep.equal({ removed: 1, updated: 1 })
        restore(LessonCollection, 'findOneAsync')
      })
    })

    // ======================================================================
    // REMOVE
    // ======================================================================
    describe(Lesson.methods.remove.name, () => {
      const removeLesson = Lesson.methods.remove.run

      checkLesson(removeLesson)
      checkClass(removeLesson, { userId: Random.id() })

      it('throws if the lesson does not exists', async () => {
        const lessonId = Random.id()
        const userId = Random.id()
        const env = { userId, log }
        const args = { _id: lessonId }
        await expectThrow({
          fn: () => removeLesson.call(env, args),
          error: DocNotFoundError.name,
          reason: 'getDocument.docUndefined',
          details: { name: Lesson.name, query: lessonId }
        })
      })

      it('removes lesson', async () => {
        const userId = Random.id()
        const unitDoc = await mockUnitDoc({
          createdBy: userId,
          [AudioFiles.name]: [Random.id()],
          [Phase.name]: [Random.id(), Random.id()],
          [Literature.name]: [Random.id()],
          [DocumentFiles.name]: [Random.id()]
        }, UnitCollection)
        const unitId = unitDoc._id
        const lessonId = Random.id()
        const classId = Random.id()
        const lessonDoc = { _id: lessonId, classId, createdBy: userId, unit: unitId }
        const classDoc = { _id: classId, createdBy: userId, title: Random.id() }

        await LessonCollection.insertAsync(lessonDoc)
        expect(await count(LessonCollection, { _id: lessonDoc._id })).to.equal(1)

        await SchoolClassCollection.insertAsync(classDoc)
        expect(await count(SchoolClassCollection, { _id: classId })).to.equal(1)

        stub(getCollection(Group.name), 'removeAsync', async () => 132)

        const stubDynamic = (collection) => {
          console.debug('stub', collection)
            stub(getCollection(collection), 'removeAsync', async () => 10)
            stub(getCollection(collection), 'countDocuments', async () => 10)
          }

        ;[TaskResults, TaskWorkingState, AudioFiles, DocumentFiles, Literature, Phase].map(c => c.name).forEach(stubDynamic)

        const result = await removeLesson.call({
          userId,
          log
        }, { _id: lessonDoc._id })
        expect(result).to.deep.equal({
          beamerRemoved: -1,
          groupsRemoved: 132,
          lessonRemoved: 1,
          phasesRemoved: 10,
          unitRemoved: 1,
          runtimeDocsRemoved: {
            [AudioFiles.name]: 10,
            [DocumentFiles.name]: 10,
            [ImageFiles.name]: 0,
            [VideoFiles.name]: 0,
            [TaskResults.name]: 10,
            [TaskWorkingState.name]: 10
          },
          materialRemoved: {
            [AudioFiles.name]: 0,
            [DocumentFiles.name]: 0,
            [ImageFiles.name]: 0,
            [VideoFiles.name]: 0,
            [EmbeddedResource.name]: 0,
            [Literature.name]: 10,
            [Task.name]: 0,
            [LinkedResource.name]: 0
          }
        })

        expect(await count(LessonCollection, { _id: lessonDoc._id })).to.equal(0)
        expect(await count(UnitCollection, { _id: unitDoc._id })).to.equal(0)
      })

      it('still removes lesson, even in case the linked unit does not exist', async () => {
        const userId = Random.id()
        const unitDoc = await mockUnitDoc({ createdBy: userId }, UnitCollection)
        const unitId = unitDoc._id
        const lessonId = Random.id()
        const classId = Random.id()
        const lessonDoc = { _id: lessonId, classId, createdBy: userId, unit: unitId }
        const classDoc = { _id: classId, createdBy: userId, title: Random.id() }

        await LessonCollection.insertAsync(lessonDoc)
        expect(await count(LessonCollection, { _id: lessonDoc._id })).to.equal(1)
        await SchoolClassCollection.insertAsync(classDoc)
        expect(await count(SchoolClassCollection, { _id: classId })).to.equal(1)

        const result = await removeLesson.call({
          userId,
          log
        }, { _id: lessonDoc._id })
        expect(result.lessonRemoved).to.equal(1)
        expect(await count(LessonCollection, { _id: lessonDoc._id })).to.equal(0)
        expect(await count(UnitCollection, { _id: unitId })).to.equal(0)
      })

      it('does not remove master unit', async () => {
        const userId = Random.id()
        const unitDoc = await mockUnitDoc({ _master: true, createdBy: userId }, UnitCollection)
        const unitId = unitDoc._id
        const lessonId = Random.id()
        const classId = Random.id()
        const lessonDoc = { _id: lessonId, classId, createdBy: userId, unit: unitId }
        const classDoc = { _id: classId, createdBy: userId, title: Random.id() }

        await LessonCollection.insertAsync(lessonDoc)
        expect(await count(LessonCollection, { _id: lessonDoc._id })).to.equal(1)
        await SchoolClassCollection.insertAsync(classDoc)
        expect(await count(SchoolClassCollection, { _id: classId })).to.equal(1)

        const { lessonRemoved, unitRemoved } = await removeLesson.call({ userId, log }, { _id: lessonDoc._id })
        expect(lessonRemoved).to.equal(1)
        expect(unitRemoved).to.equal(0)
        expect(await count(LessonCollection, { _id: lessonDoc._id })).to.equal(0)
        expect(await count(UnitCollection, { _id: unitDoc._id })).to.equal(1)
      })

      it('removes cloned phases', async () => {
        const userId = Random.id()
        const phaseDoc = await mockPhaseDoc({ createdBy: userId })
        const unitDoc = await mockUnitDoc({ phases: [phaseDoc._id], createdBy: userId }, UnitCollection)
        const unitId = unitDoc._id
        phaseDoc.unit = unitId

        const { lessonDoc } = await stubTeacherDocs({ unit: unitId, userId })
        const phaseId = await PhaseCollection.insertAsync(phaseDoc)
        expect(unitDoc.phases).to.deep.equal([phaseDoc._id])

        await LessonCollection.insertAsync(lessonDoc)
        expect(await count(PhaseCollection, { _id: phaseId })).to.equal(1)
        const { phasesRemoved } = await removeLesson.call({ userId, log }, { _id: lessonDoc._id })
        expect(phasesRemoved).to.equal(1)
        expect(await count(PhaseCollection, { _id: phaseId })).to.equal(0)
      })

      it('does not remove global phases or master phases', async () => {
        const userId = Random.id()
        const phaseDoc = await mockPhaseDoc({ createdBy: userId })
        let unitDoc = await mockUnitDoc({ phases: [phaseDoc._id], createdBy: userId }, UnitCollection)
        const unitId = unitDoc._id
        phaseDoc.unit = unitId

        const { lessonDoc } = await stubTeacherDocs({ unit: unitId, userId })
        const phaseId = await PhaseCollection.insertAsync(phaseDoc)

        const othersPhaseId = (await mockPhaseDoc({ unit: unitId }, PhaseCollection))._id
        const globalPhaseId = (await mockPhaseDoc({ createdBy: userId }, PhaseCollection))._id
        const masterPhaseId = (await mockPhaseDoc({ _master: true }, PhaseCollection))._id
        expect(othersPhaseId).to.be.a('string')
        expect(globalPhaseId).to.be.a('string')
        expect(masterPhaseId).to.be.a('string')
        await UnitCollection.updateAsync(unitId, { $set: { phases: [phaseId, othersPhaseId, globalPhaseId, masterPhaseId] } })
        unitDoc = await UnitCollection.findOneAsync(unitId)
        expect(unitDoc.phases).to.deep.equal([phaseId, othersPhaseId, globalPhaseId, masterPhaseId])

        await LessonCollection.insertAsync(lessonDoc)

        // before
        expect(await count(PhaseCollection, { _id: phaseId })).to.equal(1)
        expect(await count(PhaseCollection, { _id: othersPhaseId })).to.equal(1)
        expect(await count(PhaseCollection, { _id: globalPhaseId })).to.equal(1)
        expect(await count(PhaseCollection, { _id: masterPhaseId })).to.equal(1)

        const { phasesRemoved } = await removeLesson.call({ userId, log }, { _id: lessonDoc._id })
        expect(phasesRemoved).to.equal(1)

        // after
        expect(await count(PhaseCollection, { _id: phaseId })).to.equal(0)
        expect(await count(PhaseCollection, { _id: othersPhaseId })).to.equal(1)
        expect(await count(PhaseCollection, { _id: globalPhaseId })).to.equal(1)
        expect(await count(PhaseCollection, { _id: masterPhaseId })).to.equal(1)
      })

      it('removes cloned material', async () => {
        const userId = Random.id()
        let unitDoc = await mockUnitDoc({ _master: true, createdBy: userId }, UnitCollection)
        const unitId = unitDoc._id
        const lessonId = Random.id()
        const classId = Random.id()
        const lessonDoc = { _id: lessonId, classId, createdBy: userId, unit: unitId }
        const classDoc = { _id: classId, createdBy: userId, title: Random.id() }

        // connect task with unit and with lesson
        const taskId = await TaskCollection.insertAsync({ createdBy: userId, title: Random.id() })
        await UnitCollection.updateAsync(unitId, { $set: { tasks: [taskId] } })
        unitDoc = await UnitCollection.findOneAsync(unitId)
        expect(unitDoc.tasks).to.deep.equal([taskId])

        await LessonCollection.insertAsync(lessonDoc)
        await SchoolClassCollection.insertAsync(classDoc)

        const { materialRemoved } = await removeLesson.call({ userId, log }, { _id: lessonDoc._id })
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

        expect(await count(TaskCollection, { _id: taskId})).to.equal(0)
      })

      it('does not remove master material', async () => {
        const userId = Random.id()
        let unitDoc = await mockUnitDoc({ _master: true, createdBy: userId }, UnitCollection)
        const unitId = unitDoc._id
        const lessonId = Random.id()
        const classId = Random.id()
        const lessonDoc = { _id: lessonId, classId, createdBy: userId, unit: unitId }
        const classDoc = { _id: classId, createdBy: userId, title: Random.id() }
        await SchoolClassCollection.insertAsync(classDoc)

        // connect task with unit and with lesson
        const taskId = await TaskCollection.insertAsync({ _master: true, createdBy: userId, title: Random.id() })
        await UnitCollection.updateAsync(unitId, { $set: { tasks: [taskId] } })
        unitDoc = await UnitCollection.findOneAsync(unitId)
        expect(unitDoc.tasks).to.deep.equal([taskId])

        await LessonCollection.insertAsync(lessonDoc)

        const { materialRemoved } = await removeLesson.call({ userId, log }, { _id: lessonDoc._id })
        const entries = Object.entries(materialRemoved)
        expect(entries.length).to.equal(8)

        entries.forEach(([_context, removeCount]) => {
          expect(removeCount).to.equal(0)
        })

        expect(await count(TaskCollection, { _id: taskId})).to.equal(1)
      })

      it('removes custom material only if it\'s not used by other lessons')
      it('removes groups, associated with this lesson', async () => {
        const userId = Random.id()
        const unitDoc = await mockUnitDoc({ _master: true, createdBy: userId }, UnitCollection)
        const unitId = unitDoc._id
        const lessonId = Random.id()
        const classId = Random.id()
        const lessonDoc = { _id: lessonId, classId, createdBy: userId, unit: unitId }
        const classDoc = { _id: classId, createdBy: userId, title: Random.id() }
        await SchoolClassCollection.insertAsync(classDoc)
        await LessonCollection.insertAsync(lessonDoc)


        await getCollection(Group.name).insertAsync(createGroupDoc({ title: 'to remove', unitId }))
        await getCollection(Group.name).insertAsync(createGroupDoc({ title: 'to remove', unitId, isAdhoc: true }))

        const { groupsRemoved } = await removeLesson.call({ userId, log }, { _id: lessonDoc._id })
        expect(groupsRemoved).to.equal(2)
      })
    })

    // ======================================================================
    // MATERIAL
    // ======================================================================
    describe(Lesson.methods.material.name, () => {
      const getLessonMaterial = Lesson.methods.material.run

      checkLesson(getLessonMaterial, LessonStates.isRunning)
      checkClass(getLessonMaterial, { isStudent: true, isTeacher: false })

      it('returns undefined if no material is considered visible', async () => {
        const { lessonDoc, userId } = await stubStudentDocs({ startedAt: new Date() })
        expect(await getLessonMaterial.call({ userId, log }, lessonDoc)).to.equal(undefined)
      })

      it('throws if a collection is not found by context, referenced in the material', async () => {
        const reference = { _id: Random.id(), context: Random.id() }
        const { lessonDoc, userId } = await stubStudentDocs({ startedAt: new Date(), visibleStudent: [reference] })
        await expectThrow({
          fn: () => getLessonMaterial.call({ userId, log }, lessonDoc),
          error: 'errors.collectionNotFound',
          reason: 'getCollection.notFoundByName',
          details: { name: reference.context }
        })
      })
      it('returns the material, referenced by a lesson doc', async () => {
        const taskId = Random.id()
        const taskDoc = { _id: taskId, title: Random.id() }
        Object.assign(taskDoc, Task.helpers.createData())

        const reference = { _id: taskId, context: Task.name }
        const { lessonDoc, userId } = await stubStudentDocs({ startedAt: new Date(), visibleStudent: [reference] })
        await TaskCollection.insertAsync(taskDoc)

        const materialDocs = await getLessonMaterial.call({ userId, log }, lessonDoc)
        expect(materialDocs).to.deep.equal({ [Task.name]: [taskDoc] })
      })
      it('indicates if there are docs not found, but referenced in the material', async () => {
        const taskId = Random.id()
        const reference = { _id: taskId, context: Task.name }
        const { lessonDoc, userId } = await stubStudentDocs({ startedAt: new Date(), visibleStudent: [reference] })

        const materialDocs = await getLessonMaterial.call({ userId, log }, lessonDoc)
        expect(materialDocs).to.deep.equal({ [Task.name]: [], notFound: [{ context: Task.name, _id: taskId }] })
      })
      it('allows to skip material', async () => {
        const taskId = Random.id()
        const taskDoc = { _id: taskId, title: Random.id() }
        const reference = { _id: taskId, context: Task.name }
        const { lessonDoc, userId } = await stubStudentDocs({ startedAt: new Date(), visibleStudent: [reference] })
        await TaskCollection.insertAsync(taskDoc)

        const materialDocs = await getLessonMaterial.call({ userId, log }, { _id: lessonDoc._id, skip: [taskId] })
        expect(materialDocs).to.deep.equal({})
      })
    })

    // ======================================================================
    // UNIT
    // ======================================================================
    describe(Lesson.methods.units.name, () => {
      const getUnits = Lesson.methods.units.run

      it('throws if the user is not member of any of the linked classes', async () => {
        const lessonId = Random.id()
        const classId = Random.id()
        const userId = Random.id()
        const classDoc = { _id: classId, title: Random.id(6), createdBy: Random.id() }
        const lessonDoc = { _id: lessonId, classId, createdBy: Random.id(), unit: Random.id() }
        await SchoolClassCollection.insertAsync(classDoc)
        await LessonCollection.insertAsync(lessonDoc)

        await expectThrow({
          fn: () => getUnits.call({ userId, log }, { lessonIds: [lessonId] }),
          error: PermissionDeniedError.name,
          reason: SchoolClass.errors.notMember,
          details: { userId }
        })
      })
      it('returns all units by given lesson ids', async () => {
        const lessonIds = [Random.id(), Random.id()]
        const classId = Random.id()
        const userId = Random.id()
        const unitIds = [Random.id(), Random.id()]
        const unitDocs = unitIds.map(unitId => {
          return { _id: unitId, title: Random.id(), pocket: Random.id(), index: 0, period: 10 }
        })

        const lessonDocs = lessonIds.map((lessonId, index) => ({ _id: lessonId, classId, unit: unitIds[index] }))
        for (const doc of lessonDocs) {
          await LessonCollection.insertAsync(doc)
        }
        for (const doc of unitDocs) {
          await UnitCollection.insertAsync(doc)
        }

        const classDoc = { _id: classId, title: Random.id(), students: [userId] }
        await SchoolClassCollection.insertAsync(classDoc)

        const foundUnitDocs = await getUnits.call({ userId, log }, { lessonIds })
        expect(foundUnitDocs).to.deep.equal(unitDocs)
      })
      it('skips units that are not found by _id')
    })
  })

  describe('publications', () => {
    describe(Lesson.publications.editor.name, () => {
      it('is not implemented')
    })
    describe(Lesson.publications.my.name, () => {
      it('is not implemented')
    })
    describe(Lesson.publications.byClassStudent.name, () => {
      it('is not implemented')
    })
    describe(Lesson.publications.single.name, () => {
      it('is not implemented')
    })
  })
})
