/* eslint-env mocha */
import { expect } from 'chai'
import { GroupBuilder } from '../GroupBuilder'

describe(GroupBuilder.constructor.name, function () {
  describe('constructor', function () {
    it('can be instatiated with optional defaults', function () {
      const builder = new GroupBuilder()
      expect(builder.groupTitleDefault).to.equal('group.defaultTitle')
    })
  })

  describe(GroupBuilder.prototype.setOptions.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.createGroups.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.addGroup.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.removeGroup.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.updateGroup.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.getAllGroups.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.getGroup.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.resetGroups.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.hasMaxGroups.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.addMaterial.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.addMaterial.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.removeMaterial.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.addUser.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.addUser.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.removeUser.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.updateUser.name, function () {
    it('is not implemented')
  })
  describe(GroupBuilder.prototype.userHasBeenAssigned.name, function () {
    it('is not implemented')
  })
})
