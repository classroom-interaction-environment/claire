/* eslint-env mocha */
import { Random } from 'meteor/random'
import { UserFactory } from '../UserFactory'
import { expect } from 'chai'
import { Accounts } from 'meteor/accounts-base'
import { Roles } from 'meteor/alanning:roles'
import { Hierarchy } from '../../roles/Hierarchy'
import { restoreAll, stub } from '../../../../../tests/testutils/stub'
import {
  clearCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../../tests/testutils/mockCollection'
import { Admin } from '../../../../contexts/system/accounts/admin/Admin'
import { Users } from '../../../../contexts/system/accounts/users/User'
import { getUserByEmail } from '../../user/getUserByEmail'
import { Meteor } from 'meteor/meteor'
import { expectThrow } from '../../../../../tests/testutils/expectThrow'
import { count } from '../../../../utils/count'

const userDoc = ({ email, firstName, lastName, password, role, institution } = {}) => {
  const doc = {
    email: email || `${Random.id()}@domain.tld`,
    firstName: firstName || 'John',
    lastName: lastName || 'Doe',
    password: password,
    role: role || Hierarchy.teacher,
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

const loop = async (times, fct) => {
  for (let i = 0; i < times; i++) {
    await fct()
  }
}

describe(UserFactory.name, () => {
  let AdminCollection
  let UsersCollection

  before(() => {
    [AdminCollection, UsersCollection] = mockCollections(Admin, Users)
  })
  afterEach(async () => {
    await clearCollections(Admin, Users)
    restoreAll()
  })
  after(async () => {
    await restoreAllCollections()
  })

  describe('input validation', () => {
    afterEach(() => {
      restoreAll()
    })

    it('throws on empty / missing input', async () => {
      await expectThrow({
        fn: () => UserFactory.create(),
        message:'Cannot destructure property'
      })

      try {
        await UserFactory.create({})
      }
      catch (validationError) {
        await expectThrow({
          fn: () => UserFactory.create({}),
          details: [{
            name: 'email',
            type: 'required',
            value: undefined,
            message: 'Email is required.'
          },
            {
              name: 'role',
              type: 'required',
              value: undefined,
              message: 'Invitee\'s role is required.'
            },
            {
              name: 'firstName',
              type: 'required',
              value: undefined,
              message: 'First name is required.'
            },
            {
              name: 'lastName',
              type: 'required',
              value: undefined,
              message: 'Last name is required.'
            },
            {
              name: 'institution',
              type: 'required',
              value: undefined,
              message: 'Institution / Company is required.'
            }
          ]
        })
      }
    })
    it('throws on an incorrect email', async () => {
      await expectThrow({
        fn: () => UserFactory.create(userDoc({ email: 'invalid-email' })),
        message: 'form.validation.EmailWithTLD'
      })
    })
    it('throws on an incorrect firstName', async () => {
      await loop(25, async () => {
        const firstName = Random.id(49) + '1'
        await expectThrow({
          fn: () => UserFactory.create(userDoc({ firstName })),
          message: 'form.validation.regEx'
        })
      })
    })
    it('throws on an incorrect lastName', async () => {
      await loop(25, async () => {
        const lastName = Random.id(49) + '1'
        await expectThrow({
          fn: () => UserFactory.create(userDoc({ lastName })),
          message: 'form.validation.regEx'
        })
      })
    })
    it('throws on an incorrect role', async () => {
      await loop(25, async () => {
        const role = Random.id()
        await expectThrow({
          fn: () => UserFactory.create(userDoc({ role })),
          message: `'${role}' is not allowed.`
        })
      })
    })
    it('throws if a user with the given email already exists', async () => {
      const user = userDoc()
      await UsersCollection.insertAsync({ emails: [{ address: user.email }] })
      await expectThrow({
        fn: () => UserFactory.create(user),
        error: 'createUser.failed',
        reason: 'user.emailUsed',
        details: { email: user.email }
      })
    })
  })

  describe('creation', () => {
    afterEach(() => {
      restoreAll()
    })

    const stubAccountCreation = ({ stubRole = true } = {}) => {
      if (stubRole) {
        stub(Roles, 'addUsersToRolesAsync', () => true)
        stub(Roles, 'userIsInRoleAsync', () => true)
      }
      stub(Accounts, 'createUserAsync', async (userDoc) => {
        const { email, password, ...rest } = userDoc
        const insertDoc = { emails: [{ address: email }], services: {}, ...rest }
        if (password) {
          insertDoc.services.password = {}
        }
        return UsersCollection.insertAsync(insertDoc)
      })
    }
    it('creates a new user for given email address', async () => {
      stubAccountCreation()
      await loop(25, async () =>{
        const user = userDoc()
        const userId = await UserFactory.create(user)
        const createdUser = await UsersCollection.findOneAsync(userId)
        expect(createdUser.emails[0].address).to.equal(user.email)
      })
    })
    it('updates the user profile with the minimal defaults', async () => {
      stubAccountCreation()
      await loop(25, async () =>{
        const user = userDoc()
        const userId = await UserFactory.create(user)
        const createdUser = await UsersCollection.findOneAsync(userId)
        expect(createdUser.firstName).to.equal(user.firstName)
        expect(createdUser.lastName).to.equal(user.lastName)
        expect(createdUser.institution).to.equal(user.institution)
        expect(createdUser.role).to.equal(user.role)
      })
    })
    it('creates a user optionally with or without password', async () => {
      stubAccountCreation()
      const withoutPasswordUserId = await UserFactory.create(userDoc())
      const withoutPasswordUser = await UsersCollection.findOneAsync(withoutPasswordUserId)
      expect(withoutPasswordUser.services.password).to.equal(undefined)

      const withPasswordUserId = await UserFactory.create(userDoc({ password: Random.id() + '1' }))
      const withPasswordUser = await UsersCollection.findOneAsync(withPasswordUserId)
      expect(withPasswordUser.services.password).to.be.an('object')
    })
    it('strips any unnecessary whitespace from firstName, lastName and institution', async () => {
      stubAccountCreation()
      const user = userDoc({
        firstName: ' John the second ',
        lastName: 'doe      ',
        institution: `where
      he
      is
            working  at`
      })

      const userId = await UserFactory.create(user)
      const createdUser = await UsersCollection.findOneAsync(userId)
      expect(createdUser.firstName).to.equal('John the second')
      expect(createdUser.lastName).to.equal('Doe')
      expect(createdUser.institution).to.equal('Where he is working at')
    })
    it('adds the user to the respective given role with institution scope', async () => {
      stubAccountCreation({ stubRole: false })
      for (const role of Object.values(Hierarchy)) {
        await Roles.createRoleAsync(role, { unlessExists: true })
        const user = userDoc({ role })
        const userId = await UserFactory.create(user)
        expect(await Roles.userIsInRoleAsync(userId, role, user.institution))
      }
    })
    it('does not make user a real Admin', async () => {
      stubAccountCreation()
      const user = userDoc({ role: Hierarchy.admin })
      const userId = await UserFactory.create(user)
      expect(await count(AdminCollection, { userId })).to.equal(0)
    })
  })

  describe('rollback', () => {
    let user
    let assertRollback

    beforeEach(() => {
      user = userDoc()
      user._id = Random.id()
      assertRollback = async  () => {
        expect(getUserByEmail(user.email)).to.equal(undefined)
        expect(count(UsersCollection, {
          firstName: user.firstName,
          lastName: user.lastName,
          institution: user.institution
        })).to.equal(0)
      }
    })

    afterEach(() => {
      restoreAll()
    })

    it('rolls back the account on Accounts.createUser failure', async () => {
      stub(Accounts, 'createUserAsync', async () => undefined)
      await expectThrow({
        fn: () => UserFactory.create(user),
        error: 'createUser.failed',
        reason: 'createUser.notCreated',
      })
      assertRollback()
    })

    it('rolls back the account on profile update failure', async () => {
      stub(Accounts, 'createUserAsync', async () => user._id)
      stub(UsersCollection, 'updateAsync', async () => 0)
      stub(AdminCollection, 'removeAsync', async ({ userId }) => {
        expect(userId).to.equal(user._id)
      })
      stub(Meteor.roleAssignment, 'removeAsync', async (query) => {
        expect(query['user._id']).to.equal(user._id)
      })
      stub(UsersCollection, 'removeAsync', async (userId) => {
        expect(userId).to.equal(user._id)
      })
      await expectThrow({
        fn: () => UserFactory.create(user),
        error: 'createUser.failed',
        reason: 'createUser.profileNotUpdated',
      })
      assertRollback()
    })

    it('rolls back the account on Roles asisignment failure', async () => {
      stub(Accounts, 'createUserAsync', async () => user._id)
      stub(UsersCollection, 'updateAsync', async () => 1)
      stub(AdminCollection, 'removeAsync', async ({ userId }) => {
        expect(userId).to.equal(user._id)
      })
      stub(Meteor.roleAssignment, 'removeAsync', async (query) => {
        expect(query['user._id']).to.equal(user._id)
      })
      stub(UsersCollection, 'removeAsync', async (userId) => {
        expect(userId).to.equal(user._id)
      })
      stub(Roles, 'userIsInRoleAsync', () => false)
      await expectThrow({
        fn: () => UserFactory.create(user),
        error: 'createUser.failed',
        reason: 'createUser.rolesNotAdded',
      })

      assertRollback()
    })
  })
})
