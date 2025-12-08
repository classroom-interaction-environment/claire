/* eslint-env mocha */
import { Unit } from '../Unit'
import { Random } from 'meteor/random'
import { expect } from 'chai'
import {
  clearAllCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../../../tests/testutils/mockCollection'
import { PermissionDeniedError } from '../../../../../api/errors/types/PermissionDeniedError'
import { DocNotFoundError } from '../../../../../api/errors/types/DocNotFoundError'
import { Phase } from '../../phase/Phase'
import { Users } from '../../../../system/accounts/users/User'
import { stubRole } from '../../../../../../tests/testutils/doc/stubDocs'
import { Hierarchy } from '../../../../../api/accounts/roles/Hierarchy'
import { stub, restoreAll } from '../../../../../../tests/testutils/stub'
import { Admin } from '../../../../system/accounts/admin/Admin'
import { expectThrow } from '../../../../../../tests/testutils/expectThrow'
import { unitMaterialIds } from '../unitMaterialIds'
import { AudioFiles } from '../../../../files/audio/AudioFiles'
import { ImageFiles } from '../../../../files/image/ImageFiles'
import { Task } from '../../task/Task'
import { getCollection } from '../../../../../api/utils/getCollection'

describe(Unit.name, () => {
  let UnitCollection
  let UsersCollection
  before(() => {
    [UnitCollection, , UsersCollection] = mockCollections(Unit, Phase, Users, Admin, AudioFiles, ImageFiles, Task)
  })

  afterEach(async () => {
    await clearAllCollections()
    restoreAll()
  })

  after(async () => {
    await restoreAllCollections()
  })

  const createUnit = async (overrides = {}) => {
    const unitId = await UnitCollection.insertAsync({
      index: 0,
      createdBy: Random.id(),
      pocket: Random.id(),
      dimensions: [Random.id()],
      period: 90,
      title: Random.id(),
      _master: true,
      ...overrides
    })
    return UnitCollection.findOneAsync(unitId)
  }

  describe('methods', () => {
    describe(Unit.methods.byTaskId.name, () => {
      const byTaskId = Unit.methods.byTaskId.run
      it('returns all units that reference a task by id if curriculum user', async () => {
        const unitDoc = await createUnit({ tasks: [Random.id(), Random.id()] })
        const userId = await UsersCollection.insertAsync({ username: Random.id(8) })
        stubRole(userId, Hierarchy.curriculum, undefined)
        const result1 = await byTaskId.call({ userId }, {
          taskId: unitDoc.tasks[0]
        })

        expect(result1.linkedUnits).to.deep.equal([unitDoc])
        expect(result1.unlinkedUnits).to.deep.equal([])
        const unitDoc2 = await createUnit({ tasks: [Random.id(), Random.id()] })
        const result2 = await byTaskId.call({ userId }, {
          taskId: unitDoc2.tasks[0]
        })
        expect(result2.linkedUnits).to.deep.equal([unitDoc2])
        expect(result2.unlinkedUnits).to.deep.equal([unitDoc])
      })
      it('returns otherwise only those units that a user owns', async () => {
        const userId = await UsersCollection.insertAsync({ username: Random.id(8) })
        const unitDoc = await createUnit({ createdBy: userId, tasks: [Random.id(), Random.id()] })
        stubRole(userId, Hierarchy.teacher, undefined)
        const result1 = await byTaskId.call({ userId }, {
          taskId: unitDoc.tasks[1]
        })

        expect(result1.linkedUnits).to.deep.equal([unitDoc])
        expect(result1.unlinkedUnits).to.deep.equal([])
        const unitDoc2 = await createUnit({ tasks: [Random.id(), Random.id()] })
        const result2 = await byTaskId.call({ userId }, {
          userId: unitDoc2.createdBy,
          taskId: unitDoc2.tasks[0]
        })
        expect(result2.linkedUnits).to.deep.equal([])
        expect(result2.unlinkedUnits).to.deep.equal([unitDoc])
      })
    })
    describe(Unit.methods.getEditorDocs.name, () => {
      it('returns all related docs, relevant for editing')
    })
    describe(Unit.methods.loadMaterial.name, () => {
      it('it not implemented')
    })
    describe(Unit.methods.unlinkTask.name, () => {
      const unlink = Unit.methods.unlinkTask.run
      it('throws if unitDoc does not exist', async () => {
        await expectThrow({
          fn: () => unlink.call({}, { taskId: Random.id() }),
          error: DocNotFoundError.name
        })
      })
      it('unlinks a task from a unit doc if owner', async () => {
        const userId = await UsersCollection.insertAsync({ username: Random.id(8) })
        const unitDoc = await createUnit({ createdBy: userId, tasks: [Random.id(), Random.id()] })
        const taskIdToUnlink = unitDoc.tasks[0]
        const modifiedCount = await unlink.call({ userId }, { taskId: taskIdToUnlink })
        expect(modifiedCount).to.equal(1)
        const modifiedUnitDoc = await UnitCollection.findOneAsync(unitDoc._id)
        expect(modifiedUnitDoc.tasks).to.deep.equal([unitDoc.tasks[1]])
      })
    })
    describe(Unit.methods.remove.name, () => {
      const removeUnit = Unit.methods.remove.run

      it('throws if unitDoc does not exist', async () => {
        await expectThrow({
          fn: () => removeUnit.call({}, { _id: Random.id() }),
          error: DocNotFoundError.name
        })
      })
      it('throws if not owner or admin', async () => {
        const unitId = await UnitCollection.insertAsync({
          index: 0,
          pocket: Random.id(),
          dimensions: [Random.id()],
          period: 90,
          title: Random.id(),
          _master: true
        })
        await expectThrow({
          fn: () => removeUnit.call({}, { _id: unitId }),
          error: PermissionDeniedError.name,
          reason: 'errors.notOwner',
          details: {
            context: Unit.name,
            docId: unitId,
            userId: undefined
          }
        })
      })
      it('removes the unitDoc', async () => {
        const userId = await UsersCollection.insertAsync({ username: Random.id(8) })
        const unitId = await UnitCollection.insertAsync({
          index: 0,
          createdBy: userId,
          pocket: Random.id(),
          dimensions: [Random.id()],
          period: 90,
          title: Random.id(),
          _master: true
        })

        // material is dynamic, so we build expected removed material dynamically
        const materialIds = unitMaterialIds(await UnitCollection.findOneAsync(unitId))
        const expectedRemovedMaterial = {}
        for (const [materialCtxName] of Object.entries(materialIds)) {
          expectedRemovedMaterial[materialCtxName] = 0
        }

        const { unitRemoved, materialRemoved } = await removeUnit.call({ userId }, { _id: unitId })
        expect(unitRemoved).to.equal(1)

        expect(materialRemoved).to.deep.equal({
          audioFiles: 0,
          ...expectedRemovedMaterial
        })
        const removedUnit = await UnitCollection.findOneAsync(unitId)
        expect(removedUnit).to.be.undefined
      })
      it('removes all cloned material', async () => {
        const userId = await UsersCollection.insertAsync({ username: Random.id(8) })
        const unitId = await UnitCollection.insertAsync({
          index: 0,
          createdBy: userId,
          pocket: Random.id(),
          dimensions: [Random.id()],
          tasks: [Random.id(), Random.id()],
          phases: [Random.id()],
          images: [Random.id()],
          audio: [Random.id()],
          period: 90,
          title: Random.id(),
          _master: true
        })

        stub(getCollection(AudioFiles.name), 'removeAsync', async () => 1)
        stub(getCollection(ImageFiles.name), 'removeAsync', async () => 1)
        stub(getCollection(Task.name), 'removeAsync', async () => 1)

        // material is dynamic, so we build expected removed material dynamically
        const materialIds = unitMaterialIds(await UnitCollection.findOneAsync(unitId))
        const expectedRemovedMaterial = {}
        for (const [materialCtxName] of Object.entries(materialIds)) {
          expectedRemovedMaterial[materialCtxName] = 0
        }
        const { unitRemoved, materialRemoved } = await removeUnit.call({ userId }, { _id: unitId })
        expect(unitRemoved).to.equal(1)

        expect(materialRemoved).to.deep.equal({
          ...expectedRemovedMaterial,
          audioFiles: 1,
          imageFiles: 1,
          task: 1
        })
        const removedUnit = await UnitCollection.findOneAsync(unitId)
        expect(removedUnit).to.be.undefined
      })
    })
  })
})
