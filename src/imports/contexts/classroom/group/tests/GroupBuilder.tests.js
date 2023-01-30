/* eslint-env mocha */
import { expect } from 'chai'
import { GroupBuilder } from '../GroupBuilder'

describe('GroupBuilder', function () {
  describe('constructor', function () {
    it('can be instatiated with optional defaults', function () {
      expect(new GroupBuilder().groupTitleDefault).to.equal('group.defaultTitle')
      expect(new GroupBuilder({ groupTitleDefault: 'foo'}).groupTitleDefault).to.equal('foo')
      GroupBuilder.defaultGroupTitle('bar')
      expect(new GroupBuilder().groupTitleDefault).to.equal('bar')
      GroupBuilder.defaultGroupTitle('group.defaultTitle')
    })
  })
  describe(GroupBuilder.prototype.setOptions.name, function () {
    it('accepts all optional parameters', function () {
      const builder = new GroupBuilder()
      const initial = { ...builder }
      builder.setOptions({})
      expect(builder).to.deep.equal(initial)
    })
    it('throws if users size is greater than maxSize', function () {
      const builder = new GroupBuilder()
      const options = {
        users: ['foo', 'bar'],
        maxUsers: 1,
        maxGroups: 1
      }
      expect(() => builder.setOptions(options))
        .to.throw('groupBuilder.error')
        .with.property('reason', 'groupBuilder.maxUsersExceeded')
    })
    it('sets all options for groups, material and phases', function () {
      const builder = new GroupBuilder()
      const options = {
        users: ['foo', 'bar'],
        maxUsers: 2,
        maxGroups: 1,
        materialForAllGroups: false,
        materialAutoShuffle: true,
        phases: ['foo'],
        material: ['bar'],
        roles: ['he', 'her', 'them', '*']
      }
      const initial = { ...builder }
      builder.setOptions(options)
      expect(builder).to.not.deep.equal(initial)
      const { groups, ...next } = builder
      expect(next).to.deep.equal({
        users: ['foo', 'bar'],
        maxUsers: 2,
        maxGroups: 1,
        materialForAllGroups: false,
        materialAutoShuffle: true,
        phases: ['foo'],
        material: ['bar'],
        roles: ['he', 'her', 'them', '*'],
        groupTitleDefault: 'group.defaultTitle'
      })
      // groups are initialized but empty
      expect(groups.get()).to.deep.equal([])
    })
  })
  describe(GroupBuilder.prototype.createGroups.name, function () {
    it('creates unshuffled groups', function () {
      const builder = new GroupBuilder()
      const options = {
        users: ['foo', 'bar'],
        maxUsers: 2,
        maxGroups: 1,
        materialForAllGroups: false,
        materialAutoShuffle: false,
        phases: ['foo'],
        material: ['bar', 'baz'],
        roles: ['he', 'her', 'them', '*']
      }
      builder.setOptions(options)
      builder.createGroups({ shuffle: false })
      const groups = builder.getAllGroups()
      expect(groups).to.deep.equal([
        {
          title: 'group.defaultTitle 1',
          phases: options.phases,
          users: [],
          material: []
        }
      ])
    })
    it('creates groups with material auto shuffle and equal material as group size', function () {
      const builder = new GroupBuilder()
      const options = {
        users: ['foo', 'bar', 'baz', 'moo'],
        maxUsers: 2,
        maxGroups: 2,
        materialForAllGroups: false,
        materialAutoShuffle: true,
        phases: ['foo'],
        material: ['bar', 'baz'],
        roles: ['he', 'her', 'them', '*']
      }
      builder.setOptions(options)
      builder.createGroups({})
      const groups = builder.getAllGroups()
      expect(groups).to.deep.equal([
        {
          title: 'group.defaultTitle 1',
          phases: options.phases,
          users: [],
          material: ['bar']
        },
        {
          title: 'group.defaultTitle 2',
          phases: options.phases,
          users: [],
          material: ['baz']
        }
      ])
    })
    it('creates groups with material auto shuffle and MORE material as group size', function () {
      const builder = new GroupBuilder()
      const options = {
        users: ['foo', 'bar', 'baz', 'moo'],
        maxUsers: 2,
        maxGroups: 2,
        materialForAllGroups: false,
        materialAutoShuffle: true,
        phases: ['foo'],
        material: ['bar', 'baz', 'moo'],
        roles: ['he', 'her', 'them', '*']
      }
      builder.setOptions(options)
      builder.createGroups({ shuffle: false })
      const groups = builder.getAllGroups()
      expect(groups).to.deep.equal([
        {
          title: 'group.defaultTitle 1',
          phases: options.phases,
          users: [],
          material: ['bar', 'baz']
        },
        {
          title: 'group.defaultTitle 2',
          phases: options.phases,
          users: [],
          material: ['moo', 'bar']
        }
      ])
    })
    it('creates shuffled groups', function () {
      const builder = new GroupBuilder()
      const options = {
        users: ['foo', 'bar', 'baz', 'moo'],
        maxUsers: 2,
        maxGroups: 2,
        materialForAllGroups: true,
        materialAutoShuffle: false,
        phases: ['foo'],
        material: ['bar'],
        roles: ['he', 'her', 'them', '*']
      }
      builder.setOptions(options)
      builder.createGroups({ shuffle: true })
      const groups = builder.getAllGroups()
      expect(groups.length).to.equal(options.maxGroups)

      const existingUsers = new Set()
      groups.forEach((group, index) => {
        const { users, ...rest } = group
        expect(rest).to.deep.equal({
          title: `group.defaultTitle ${index + 1 }`,
          phases: options.phases,
          material: ['bar']
        })

        expect(users.length).to.equal(2)
        users.forEach(userId => {
          expect(existingUsers.has(userId)).to.equal(false)
          existingUsers.add(userId)
        })
      })
    })
    it('throws if users length is zero', function () {
      const builder  = new GroupBuilder()
      expect(() => builder.createGroups({ shuffle: false }))
        .to.throw('groupBuilder.error')
        .with.property('reason', 'groupBuilder.atLeastOneUserRequired')
    })
  })
  describe(GroupBuilder.prototype.addGroup.name, function () {
    it('adds a new group to the groups list')
  })
  describe(GroupBuilder.prototype.removeGroup.name, function () {
    it('throws if there is no group by given index', function () {
      const builder = new GroupBuilder()
      const options = {
        users: ['foo', 'bar', 'baz', 'moo'],
        maxUsers: 2,
        maxGroups: 2,
        materialForAllGroups: false,
        materialAutoShuffle: true,
        phases: ['foo'],
        material: ['bar', 'baz'],
        roles: ['he', 'her', 'them', '*']
      }
      builder.setOptions(options)
      builder.createGroups({ shuffle: false })

      ;[-1, 3, 'foo'].forEach(index => {
        expect(() => builder.removeGroup(index))
          .to.throw('groupBuilder.error')
          .with.property('reason', 'groupBuilder.invalidIndex')
      })
    })
    it('removes a group from the list at a given index', function () {
      const builder = new GroupBuilder()
      const options = {
        users: ['foo', 'bar', 'baz', 'moo'],
        maxUsers: 2,
        maxGroups: 2,
        materialForAllGroups: false,
        materialAutoShuffle: true,
        phases: ['foo'],
        material: ['bar', 'baz'],
        roles: ['he', 'her', 'them', '*']
      }
      builder.setOptions(options)
      builder.createGroups({ shuffle: false })
      expect(builder.getAllGroups().length).to.equal(2)

      builder.removeGroup(0)
      const remain = builder.getAllGroups()
      expect(remain).to.deep.equal([
        {
          title: 'group.defaultTitle 2',
          phases: options.phases,
          users: [],
          material: ['baz']
        }
      ])
    })
  })
  describe(GroupBuilder.prototype.updateGroup.name, function () {
    it('throws if there is no group by given index', function () {
      const builder = new GroupBuilder()
      const options = {
        users: ['foo', 'bar', 'baz', 'moo'],
        maxUsers: 2,
        maxGroups: 2,
        materialForAllGroups: false,
        materialAutoShuffle: true,
        phases: ['foo'],
        material: ['bar', 'baz'],
        roles: ['he', 'her', 'them', '*']
      }
      builder.setOptions(options)
      builder.createGroups({ shuffle: false })

      ;[-1, 3, 'foo'].forEach(index => {
        expect(() => builder.updateGroup(index))
          .to.throw('groupBuilder.error')
          .with.property('reason', 'groupBuilder.invalidIndex')
      })
    })
    it('updates a group title', function () {
      const builder = new GroupBuilder()
      const options = {
        users: ['foo', 'bar', 'baz', 'moo'],
        maxUsers: 2,
        maxGroups: 2,
        materialForAllGroups: false,
        materialAutoShuffle: true,
        phases: ['foo'],
        material: ['bar', 'baz'],
        roles: ['he', 'her', 'them', '*']
      }
      builder.setOptions(options)
      builder.createGroups({ shuffle: false })
      builder.updateGroup({ index: 0, title: 'foo'})
      expect(builder.getGroup(0).title).to.equal('foo')
      expect(builder.getGroup(1).title).to.equal('group.defaultTitle 2')
    })
  })
  describe(GroupBuilder.prototype.resetGroups.name, function () {
    it('resets all groups to an empty array', function () {
      const builder = new GroupBuilder()
      const options = {
        users: ['foo', 'bar', 'baz', 'moo'],
        maxUsers: 2,
        maxGroups: 2,
        materialForAllGroups: false,
        materialAutoShuffle: true,
        phases: ['foo'],
        material: ['bar', 'baz'],
        roles: ['he', 'her', 'them', '*']
      }
      builder.setOptions(options)
      builder.createGroups({ shuffle: false })
      builder.resetGroups()
      expect(builder.getAllGroups()).to.deep.equal([])
    })
  })
  describe(GroupBuilder.prototype.hasMaxGroups.name, function () {
    it('returns false if max group is not reached or exceeded', function () {
      const builder = new GroupBuilder()
      const options = {
        users: ['foo', 'bar', 'baz', 'moo'],
        maxUsers: 2,
        maxGroups: 2,
        materialForAllGroups: false,
        materialAutoShuffle: true,
        phases: ['foo'],
        material: ['bar', 'baz'],
        roles: ['he', 'her', 'them', '*']
      }
      builder.setOptions(options)
      builder.createGroups({ shuffle: false })
      expect(builder.hasMaxGroups()).to.equal(true)
    })
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
    it('throws if user is not defined in the users list', function () {
      const builder = new GroupBuilder()
      expect(() => builder.userHasBeenAssigned('foo'))
        .to.throw('groupBuilder.error')
        .with.property('reason', 'groupBuilder.invalidUserId')
    })
    it('returns whether a user has been assigned to one of the groups', function () {
      const builder = new GroupBuilder()
      const users = ['foo', 'bar']
      builder.setOptions({ users, maxUsers: 2, maxGroups: 2 })
      builder.createGroups({ shuffle: true })
      builder.addGroup({ title: 'moo' })
      builder.removeUser({ index: 0, userId: 'bar' })
      expect(builder.userHasBeenAssigned('foo')).to.equal(true)
      expect(builder.userHasBeenAssigned('bar')).to.equal(false)
    })
  })
})
