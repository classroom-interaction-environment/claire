/* eslint-env mocha */
import { Random } from 'meteor/random'
import { UserFactory } from '../UserFactory'
import { expect } from 'chai'
import { Accounts } from 'meteor/accounts-base'
import { Roles } from 'meteor/alanning:roles'
import { UserUtils } from '../../../../contexts/system/accounts/users/UserUtils'
import { restoreAll, stub } from '../../../../../tests/testutils/stub'
import { mockCollection } from '../../../../../tests/testutils/mockCollection'
import { Admin } from '../../../../contexts/system/accounts/admin/Admin'

const userDoc = ({ email, firstName, lastName, password, role, institution } = {}) => {
  const doc = {
    email: email || `${Random.id()}@domain.tld`,
    firstName: firstName || 'John',
    lastName: lastName || 'Doe',
    password: password,
    role: role || UserUtils.roles.teacher,
    institution: institution || 'Example School'
  }

  if (email === null) delete doc.email
  if (firstName === null) delete doc.firstName
  if (lastName === null) delete doc.lastName
  if (password === null) delete doc.password
  if (role === null) delete doc.role
  if (institution === null) delete doc.institution

  return doc
}

const allRoles = Object.values(UserUtils.roles)
allRoles.forEach(role => Roles.createRole(role, { unlessExists: true }))

const AdminCollection = mockCollection(Admin)

const loop = (times, fct) => {
  for (let i = 0; i < times; i++) {
    fct()
  }
}

describe(UserFactory.name, function () {
  beforeEach(function () {
    Meteor.users.remove({})
  })

  afterEach(function () {
    restoreAll()
  })

  describe('input validation', function () {
    it('throws on empty / missing input', function () {
      expect(() => UserFactory.create()).to.throw('Cannot destructure property')
      expect(() => UserFactory.create({})).to.throw('form.validation.required')

      try {
        UserFactory.create({})
      } catch (validationError) {
        expect(validationError.details).to.deep.equal([{
          name: 'email',
          type: 'required',
          value: undefined,
          message: 'form.validation.required'
        },
        {
          name: 'role',
          type: 'required',
          value: undefined,
          message: 'form.validation.required'
        },
        {
          name: 'firstName',
          type: 'required',
          value: undefined,
          message: 'form.validation.required'
        },
        {
          name: 'lastName',
          type: 'required',
          value: undefined,
          message: 'form.validation.required'
        },
        {
          name: 'institution',
          type: 'required',
          value: undefined,
          message: 'form.validation.required'
        }
        ])
      }
    })
    it('throws on an incorrect email', function () {
      loop(100, function () {
        expect(() => UserFactory.create(userDoc({ email: Random.id() }))).to.throw('form.validation.EmailWithTLD')
      })
    })
    it('throws on an incorrect firstName', function () {
      loop(100, function () {
        const firstName = Random.id(49) + '1'
        expect(() => UserFactory.create(userDoc({ firstName }))).to.throw('form.validation.regEx')
      })
    })
    it('throws on an incorrect lastName', function () {
      loop(100, function () {
        const lastName = Random.id(49) + '1'
        expect(() => UserFactory.create(userDoc({ lastName }))).to.throw('form.validation.regEx')
      })
    })
    it('throws on an incorrect role', function () {
      loop(100, function () {
        const role = Random.id()
        expect(() => UserFactory.create(userDoc({ role }))).to.throw('form.validation.notAllowed')
      })
    })
    it('throws if a user with the given email already exists', function () {
      const user = userDoc()
      stub(Accounts, 'findUserByEmail', () => true)

      const expectThrown = expect(() => UserFactory.create(user)).to.throw('createUser.failed')
      expectThrown.with.property('reason', 'user.emailUsed')
      expectThrown.with.property('details', user.email)
    })
  })

  describe('creation', function () {
    it('creates a new user for given email address', function () {
      loop(100, function () {
        const user = userDoc()
        const userId = UserFactory.create(user)
        const createdUser = Meteor.users.findOne(userId)
        expect(createdUser.emails[0].address).to.equal(user.email)
      })
    })
    it('updates the user profile with the minimal defaults', function () {
      loop(100, function () {
        const user = userDoc()
        const userId = UserFactory.create(user)
        const createdUser = Meteor.users.findOne(userId)
        expect(createdUser.firstName).to.equal(user.firstName)
        expect(createdUser.lastName).to.equal(user.lastName)
        expect(createdUser.institution).to.equal(user.institution)
        expect(createdUser.role).to.equal(user.role)
      })
    })
    it('creates a user optionally with or without password', function () {
      const withoutPasswordUserId = UserFactory.create(userDoc())
      const withoutPasswordUser = Meteor.users.findOne(withoutPasswordUserId)
      expect(withoutPasswordUser.services.password).to.equal(undefined)

      const withPasswordUserId = UserFactory.create(userDoc({ password: Random.id() + '1' }))
      const withPasswordUser = Meteor.users.findOne(withPasswordUserId)
      expect(withPasswordUser.services.password).to.be.an('object')
    })
    it('strips any unnecessary whitespace from firstName, lastName and institution', function () {
      const user = userDoc({
        firstName: 'John the second ',
        lastName: 'doe      ',
        institution: `where
      he
      is
            working  at`
      })

      const userId = UserFactory.create(user)
      const createdUser = Meteor.users.findOne(userId)
      expect(createdUser.firstName).to.equal('John the second')
      expect(createdUser.lastName).to.equal('Doe')
      expect(createdUser.institution).to.equal('Where he is working at')
    })
    it('adds the user to the respective given role with institution scope', function () {
      allRoles.forEach(role => {
        const user = userDoc({ role })
        const userId = UserFactory.create(user)
        expect(Roles.userIsInRole(userId, role, user.institution))
      })
    })
    it('does not make user a real Admin', function () {
      const user = userDoc({ role: UserUtils.roles.admin })
      const userId = UserFactory.create(user)
      expect(AdminCollection.find({ userId }).count()).to.equal(0)
    })
  })

  describe('rollback', function () {
    let user
    let assertRollback

    beforeEach(function () {
      user = userDoc()
      assertRollback = () => {
        expect(Accounts.findUserByEmail(user.email)).to.equal(undefined)
        expect(Meteor.users.find({
          firstName: user.firstName,
          lastName: user.lastName,
          institution: user.institution
        }).count()).to.equal(0)
      }
    })
    it('rolls back the account on Accounts.createUser failure', function () {
      stub(Accounts, 'createUser', () => {})
      expect(() => UserFactory.create(user)).to.throw('createUser.failed')
        .with.property('reason', 'createUser.notCreated')
      assertRollback()
    })

    it('rolls back the account on profile update failure', function () {
      stub(Meteor.users, 'update', () => 0)
      expect(() => UserFactory.create(user)).to.throw('createUser.failed')
        .with.property('reason', 'createUser.profileNotUpdated')
      assertRollback()
    })

    it('rolls back the account on Roles asisignment failure', function () {
      stub(Roles, 'userIsInRole', () => false)
      expect(() => UserFactory.create(user)).to.throw('createUser.failed')
        .with.property('reason', 'createUser.rolesNotAdded')
      assertRollback()
    })
  })
})
