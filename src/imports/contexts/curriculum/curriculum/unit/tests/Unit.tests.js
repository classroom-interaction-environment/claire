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


describe(Unit.name, function () {
  let UnitCollection

  before(function () {
    [UnitCollection] = mockCollections(Unit, Phase)
  })

  afterEach(function () {
    clearAllCollections()
  })

  after(function () {
    restoreAllCollections()
  })

  describe('methods', function () {
    describe(Unit.methods.byTaskId.name, function () {
      it('returns all units that reference a task by id if curriculum user')
      it('returns otherwise only those units that a user owns')
    })
    describe(Unit.methods.getEditorDocs.name, function () {
      it('returns all related docs, relevant for editing')
    })
    describe(Unit.methods.loadMaterial.name, function () {
      it('it not implemented')
    })
    describe(Unit.methods.unlinkTask.name, function () {
      it('throws if not owner or admin')
      it('throws if unitDoc does not exist')
      it('unlinks a task from a unit doc')
    })
    describe(Unit.methods.remove.name, function () {
      const removeUnit = Unit.methods.remove.run

      it('throws if unitDoc does not exist', function () {
        expect(() => removeUnit({ _id: Random.id() })).to.throw(DocNotFoundError.name)
      })
      it('throws if not owner or admin', function () {
        const unitId = UnitCollection.insert({
          index: 0,
          pocket: Random.id(),
          dimensions: [Random.id()],
          period: 90,
          title: Random.id(),
          _master: true
        })

        expect(() => removeUnit({ _id: unitId })).to.throw(PermissionDeniedError.name)
      })
      it('removes all cloned material')
      it('removes the unitDoc')
    })
  })
})
