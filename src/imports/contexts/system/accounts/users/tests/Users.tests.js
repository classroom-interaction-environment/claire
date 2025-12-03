/* global describe it afterEach Roles */
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { Accounts } from 'meteor/accounts-base'
import { Users } from '../User'
import { CodeInvitation } from '../../../../classroom/invitations/CodeInvitations'
import { SchoolClass } from '../../../../classroom/schoolclass/SchoolClass'
import { UserFactory } from '../../../../../api/accounts/registration/UserFactory'
import { Admin } from '../../admin/Admin'
import { onServerExec } from '../../../../../api/utils/archUtils'
import { createCodeDoc } from '../../../../../../tests/testutils/doc/createCodeDoc'
import { expect } from 'chai'
import { restoreAll, stub } from '../../../../../../tests/testutils/stub'
import {
  clearAllCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../../../tests/testutils/mockCollection'
import { collectPublication } from '../../../../../../tests/testutils/collectPublication'
import { UserUtils } from '../UserUtils'
import { mockClassDoc } from '../../../../../../tests/testutils/doc/mockClassDoc'
import { PermissionDeniedError } from '../../../../../api/errors/types/PermissionDeniedError'
import { DocNotFoundError } from '../../../../../api/errors/types/DocNotFoundError'
import { expectThrow } from '../../../../../../tests/testutils/expectThrow'
import { invitationComplete } from '../../../../classroom/invitations/validation/invitationComplete'
import { Hierarchy } from '../../../../../api/accounts/roles/Hierarchy'
import { count } from '../../../../../utils/count'

const createRegisterDoc = ({
  code = Random.id(),
  email = `${Random.id()}@example.app`,
  firstName,
  lastName,
  institution = Random.id(),
} = {}) => ({
  code, email, firstName, lastName, institution
})

describe('Users', () => {
  let SchoolClassCollection
  let CodeInvitationCollection
  let UsersCollection

  before(() => {
    [SchoolClassCollection, CodeInvitationCollection, UsersCollection] = mockCollections(SchoolClass, CodeInvitation, Users, Admin)
  })

  afterEach(async () => {
    restoreAll()
    await clearAllCollections()
  })

  after(async () => {
    await restoreAllCollections()
  })

  onServerExec(() => {
    describe('helpers', () => {
      describe(Users.helpers.verify.name, () => {
        const verifyUser = Users.helpers.verify

        it('throws if the user is not found', () => {
          expect(() => verifyUser()).to.throw('errors.userNotFound')
        })
        it('throws if the user has no email', () => {
          expect(() => verifyUser({})).to.throw('errors.noEmailFound')
          expect(() => verifyUser({ emails: [] })).to.throw('errors.noEmailFound')
          expect(() => verifyUser({ emails: [{}] })).to.throw('errors.noEmailFound')
        })
        it('returns false if the user is not verified', () => {
          expect(verifyUser({ emails: [{ address: Random.id() }] })).to.equal(false)
          expect(verifyUser({ emails: [{ address: Random.id(), verified: false }] })).to.equal(false)
        })
        it('returns true if the user is verified', () => {
          expect(verifyUser({ emails: [{ address: Random.id(), verified: true }] })).to.equal(true)
        })
      })
    })

    describe('methods', () => {
      const registerWithCode = Users.methods.registerWithCode.run

      describe(Users.methods.registerWithCode.name, () => {
        it('throws on a code that does not find a code doc', async () => {
          const doc = createRegisterDoc()
          await expectThrow({
            fn: () => registerWithCode.call({}, doc),
            error: 'codeRegister.failed',
            reason: 'codeRegister.codeInvalid',
            details: { code: doc.code }
          })
        })
        it('throws if the code doc is expired', async () => {
          const codeDoc = createCodeDoc()
          await CodeInvitationCollection.insertAsync({
            code: codeDoc.code,
            maxUsers: 10,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
            expires: 1,
            role: Hierarchy.student,
            institution: Random.id()
          })
          const registerDoc = createRegisterDoc({ code: codeDoc.code })
          await expectThrow({
            fn: () => registerWithCode.call({}, registerDoc),
            error: 'codeRegister.failed',
            reason: 'codeRegister.codeInvalid',
            details: { code: codeDoc.code }
          })
        })
        it('throws if the code doc is already completed', async () => {
          const codeDoc = createCodeDoc({ expires: -1 })
          await CodeInvitationCollection.insertAsync({
            code: codeDoc.code,
            maxUsers: 1,
            registeredUsers: [Random.id()],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
            expires: 4,
            role: Hierarchy.student,
            institution: Random.id()
          })
          const registerDoc = createRegisterDoc({ code: codeDoc.code })
          await expectThrow({
            fn: () => registerWithCode.call({}, registerDoc),
            error: 'codeRegister.failed',
            reason: 'codeRegister.codeInvalid',
            details: { code: codeDoc.code }
          })
        })
        it('throws if a user exists already by given email', async () => {
          const registerDoc = createRegisterDoc()
          await CodeInvitationCollection.insertAsync({
            ...registerDoc,
            registeredUsers: [Random.id()],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
            expires: 7,
            maxUsers: 22,
            role: Hierarchy.teacher
          })
          await UsersCollection.insertAsync({ emails: [{ address: registerDoc.email }] })
          await expectThrow({
            fn: () => registerWithCode.call({}, registerDoc),
            error: 'codeRegister.failed',
            reason: 'codeRegister.emailExists'
          })
        })
        it('throws if the account creation failed', async () => {
          const registerDoc = createRegisterDoc()
          await CodeInvitationCollection.insertAsync({
            ...registerDoc,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
            expires: 2,
            maxUsers: 2,
            role: UserUtils.roles.teacher
          })
          stub(UserFactory, 'create',async () => {
            throw new Meteor.Error('error', 'expectedErrorReason')
          })
          stub(Accounts, 'createUserAsync', () => null)

          await expectThrow({
            fn: () => registerWithCode.call({}, registerDoc),
            error: 'codeRegister.failed',
            reason: 'expectedErrorReason'
          })

        })
        it('throws if adding user to the class fails', async () => {
          const codeDoc = createCodeDoc()
          await CodeInvitationCollection.insertAsync({
            ...codeDoc,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
            expires: 2,
            maxUsers: 2,
            role: UserUtils.roles.teacher
          })
          const registerDoc = createRegisterDoc({ code: codeDoc.code, firstName: 'John', lastName: 'Doe' })

          stub(UserFactory, 'create', async () => Random.id())

          await expectThrow({
            fn: () => registerWithCode.call({}, registerDoc),
            error: 'codeRegister.failed',
            reason: 'codeRegister.studentNotAdded',
            details: { classId: codeDoc.classId, studentAdded: false }
          })
        })

        const validRegistration = async ({ codeDocArgs } = {}) => {
          const codeDoc = createCodeDoc(codeDocArgs)
          delete codeDoc.classId
          const codeDocId = await CodeInvitationCollection.insertAsync(codeDoc)
          const registerDoc = createRegisterDoc({ code: codeDoc.code, firstName: 'John', lastName: 'Doe' })

          stub(Roles, 'addUsersToRolesAsync', async () => true)
          stub(Roles, 'userIsInRoleAsync', async () => true)
          stub(Accounts, 'createUserAsync', async ({ email }) => {
            return UsersCollection.insertAsync({ emails: [{ address: email }] })
          })
          stub(Accounts, 'sendEnrollmentEmail', () => true)
          stub(Accounts, 'sendVerificationEmail', () => true)

          const userId = await registerWithCode.call({}, registerDoc)
          expect(await count(UsersCollection, { _id: userId })).to.equal(1)

          return { codeDocId, userId, registerDoc }
        }

        it('registers a user', async () => {
          await validRegistration()
        })
        it('invalidates the codeDoc after registration', async () => {
          const { codeDocId } = await validRegistration()
          const afterRegisterCodeDoc = await CodeInvitationCollection.findOneAsync(codeDocId)
          expect(invitationComplete(afterRegisterCodeDoc)).to.equal(true)
        })
        it('always uses role and institution from codeDoc', async () => {
          const codeDocArgs = {
            role: UserUtils.roles.curriculum,
            institution: 'Other school'
          }
          const { userId, codeDocId, registerDoc } =await validRegistration({ codeDocArgs })
          const user = await UsersCollection.findOneAsync(userId)
          const codeDoc = await CodeInvitationCollection.findOneAsync(codeDocId)

          expect(user.role).to.equal(codeDoc.role)
          expect(user.role).to.not.equal(registerDoc.role)
          expect(user.institution).to.equal(codeDoc.institution)
          expect(user.institution).to.not.equal(registerDoc.institution)
        })
        it('allows to use firstName and lastName in favour from user input', async () => {
          const codeDocArgs = {
            firstName: 'Jane',
            lastName: 'Done'
          }
          const { userId, codeDocId, registerDoc } = await validRegistration({ codeDocArgs })
          const user = await UsersCollection.findOneAsync(userId)
          const codeDoc = await CodeInvitationCollection.findOneAsync(codeDocId)
          expect(user.firstName).to.not.equal(codeDoc.firstName)
          expect(user.firstName).to.equal(registerDoc.firstName)
          expect(user.lastName).to.not.equal(codeDoc.lastName)
          expect(user.lastName).to.equal(registerDoc.lastName)
        })
      })
      describe(Users.methods.checkResetpasswordToken.name, () => {
        const checkResetPasswordToken = Users.methods.checkResetpasswordToken.run

        it('throws if the given user is not found', async () => {
          const email = Random.id()
          await expectThrow({
            fn: () => checkResetPasswordToken({
              token: Random.id(),
              email
            }),
            error: 'user.tokenInvalid',
            reason: 'user.userNotFound',
            details: { email }
          })
        })
        it('throws if the token is the token is missing', async () => {
          const email = Random.id()
          const userDoc = { email }
          await UsersCollection.insertAsync({
            emails: [{ address: email }],
            services: {
              password: {
                reset: { reason: 'reset', token: Random.id() }
              }
            }
          })
          await expectThrow({
            fn: () => checkResetPasswordToken({
              email: userDoc.email,
              token: null,
              reason: 'reset'
            }),
            error: 'user.tokenInvalid',
            reason: 'user.tokenInvalid',
            details: { email }
          })
        })
        it('throws if the reason is not valid',async () => {
          const email = 'me@example.com'
          const userId =await UsersCollection.insertAsync({ emails: [{ address: email }], services: { password: {} } })
          const tokenId = Random.id()
          await UsersCollection.updateAsync(userId, {
            $set: { 'services.password.reset': { token: tokenId, reason: 'reset' } }
          })

          const reason = Random.id()
          await expectThrow({
            fn: () => checkResetPasswordToken({
              token: tokenId,
              email,
              reason
            }),
            error: 'user.tokenInvalid',
            reason: 'user.reasonInvalid',
            details: { reason }
          })
        })
        it('throws if the date is already expired', async () => {
          const email = Random.id()
          const userId = await UsersCollection.insertAsync({ emails: [{ address: email }], services: { password: {} } })
          const tokenId = Random.id()
          const reason = 'reset'

          await UsersCollection.updateAsync(userId, {
            $set: {
              'services.password.reset': {
                token: tokenId,
                reason,
                when: new Date(Date.now() - 1000000000)
              }
            }
          })
          await expectThrow({
            fn: () => checkResetPasswordToken({
              email,
              token: tokenId,
              reason: reason
            }),
            error: 'user.tokenInvalid',
            reason: 'user.tokenExpired',
          })
        })
        it('returns true if the token is valid', async () => {
          const email = Random.id()
          const userId = await UsersCollection.insertAsync({ emails: [{ address: email }], services: { password: {} } })
          const tokenId = Random.id()
          const reason = 'reset'

          await UsersCollection.updateAsync(userId, {
            $set: {
              'services.password.reset': {
                token: tokenId,
                reason,
                when: new Date(Date.now() - 1000000)
              }
            }
          })

          expect(await checkResetPasswordToken({
            email: email,
            token: tokenId,
            reason: reason
          })).to.equal(true)
        })
      })

      describe(Users.methods.getUser.name, () => {
        const getUser = Users.methods.getUser.run
        const _id = Random.id()
        let user

        beforeEach(() => {
          user = {
            _id: _id,
            emails: [{ address: `${Random.id()}@domain.tld` }],
            services: {
              password: {}
            },
            presence: {
              online: true
            },
            firstName: 'John',
            lastName: 'Doe'
          }
        })

        afterEach(() => {
          restoreAll()
        })

        it('throws if the given user does not exists', async () => {
          const values = [null, undefined, '', Random.id()]
          for (const val of values) {
            for (const envVal of values) {
              const env = { userId: envVal }
              const doc = { _id: val }
              await expectThrow({
                fn: () => getUser.call(env, doc),
                error: 'user.invalidUser',
                reason: 'user.notFound',
                details: { userId: val, calledBy: env.userId }
              })
            }
          }
        })
        it('returns a near full user for oneself', async () => {
          await UsersCollection.insertAsync(user)

          const actualUser = await getUser.call({ userId: user._id }, { _id })
          expect(actualUser._id).to.equal(user._id)
          expect(actualUser.firstName).to.equal(user.firstName)
          expect(actualUser.lastName).to.equal(user.lastName)
          expect(actualUser.services).to.equal(undefined)
          expect(actualUser.emails).to.deep.equal(user.emails)
          expect(actualUser.presence).to.deep.equal({ online: true })
        })
        it('returns a limited user for others',async () => {
          await UsersCollection.insertAsync(user)

          const actualUser = await getUser.call({ userId: Random.id() }, { _id })
          expect(actualUser._id).to.equal(user._id)
          expect(actualUser.firstName).to.equal(user.firstName)
          expect(actualUser.lastName).to.equal(user.lastName)
          expect(actualUser.emails).to.equal(undefined)
          expect(actualUser.presence).to.equal(undefined)
          expect(actualUser.services).to.equal(undefined)
        })
      })

      describe(Users.methods.resendVerificationMail.name, () => {
        const resend = Users.methods.resendVerificationMail.run

        it('fails silent if the user not exists', async () => {
          const mailSent = stub(Accounts, 'sendVerificationEmail', async () => {})
          const sent = await resend({ userId: Random.id() })
          expect(sent).to.equal(undefined)
          expect(mailSent.notCalled).to.equal(true)
        })
        it('fails silent if the user is already verified', async () => {
          const user = {
            _id: Random.id(),
            emails: [{
              address: Random.id(),
              verified: true
            }]
          }
          stub(UsersCollection, 'findOneAsync', async () => user)
          const mailSent = stub(Accounts, 'sendVerificationEmail', async () => {})
          const sent = await resend({ userId: user._id })
          expect(sent).to.equal(undefined)
          expect(mailSent.notCalled).to.equal(true)
        })
        it('sends a verification mail to the given user', async () => {
          const user = {
            _id: Random.id(),
            emails: [{
              address: Random.id(),
              verified: false
            }]
          }
          const mailId = Random.id()

          stub(UsersCollection, 'findOneAsync', async () => user)
          const mailSent = stub(Accounts, 'sendVerificationEmail', async () => mailId)

          const sent = await resend({ userId: user._id })
          expect(sent).to.equal(undefined)
          expect(mailSent.calledOnceWithExactly(user._id)).to.equal(true)
        })
      })

      describe(Users.methods.sendResetPasswordEmail.name, () => {
        const send = Users.methods.sendResetPasswordEmail.run

        it('fails silent if the user not exists by email', async () => {
          const sent = await send({ email: Random.id() })
          expect(sent).to.equal(undefined)
        })
        it('sends a password-reset mail to the given user', async () => {
          const email = Random.id()
          const userId = await UsersCollection.insertAsync({ emails: [{ address: email }] })
          stub(Accounts, 'sendResetPasswordEmail', () => userId)
          const sent = await send({ email })
          expect(sent).to.equal(userId)
        })
      })

      describe(Users.methods.updateProfile.name, () => {
        const update = Users.methods.updateProfile.run

        it('updates the current user\'s profile',async () => {
          const userId = await UsersCollection.insertAsync({ firstName: 'John', lastName: 'Doe', profileImage: Random.id() })
          const userDoc = await UsersCollection.findOneAsync(userId)
          const updateDoc = {
            firstName: 'Jane',
            lastName: 'Done',
            profileImage: Random.id()
          }

          expect(await await update.call({ userId }, updateDoc)).to.equal(1)

          const updatedUser = await UsersCollection.findOneAsync(userId)
          expect(updatedUser.firstName).to.equal(updateDoc.firstName)
          expect(updatedUser.lastName).to.equal(updateDoc.lastName)
          expect(updatedUser.profileImage).to.equal(updateDoc.profileImage)
          expect(updatedUser.firstName).to.not.equal(userDoc.firstName)
          expect(updatedUser.lastName).to.not.equal(userDoc.lastName)
          expect(updatedUser.profileImage).to.not.equal(userDoc.profileImage)
        })
      })

      describe(Users.methods.updateUI.name, () => {
        const update = Users.methods.updateUI.run

        it('it updates the users ui', async () => {
          const user = { ui: { fluid: undefined } }
          const userId = await UsersCollection.insertAsync(user)

          const updateDoc = { fluid: true }

          expect(await update.call({ userId }, updateDoc)).to.equal(1)

          const updatedUser = await UsersCollection.findOneAsync(userId)
          expect(updatedUser.ui.fluid).to.equal(updateDoc.fluid)
          expect(updatedUser.ui.fluid).to.not.equal(user.ui.fluid)
        })

        it('creates a new ui namespace on the user if it does not exist', async () => {
          const user = {}
          const userId = await UsersCollection.insertAsync(user)

          const updateDoc = {
            fluid: true
          }

          expect(await update.call({ userId }, updateDoc)).to.equal(1)

          const updatedUser = await UsersCollection.findOneAsync(userId)
          expect(updatedUser.ui.fluid).to.equal(true)
        })
      })

      describe(Users.methods.userIsAvailable.name, () => {
        const userIsAvailable = Users.methods.userIsAvailable.run

        it('returns if a user exists by mail', async () => {
          const email = Random.id()
          await UsersCollection.insertAsync({ emails: [{ address: email }] })
          expect(await userIsAvailable({ email })).to.equal(false)
          expect(await userIsAvailable({ email: Random.id() })).to.equal(true)
        })
      })
    })

    describe('publications', () => {
      afterEach(() => {
        restoreAll()
      })

      describe(Users.publications.byClass.name, () => {
        const byClass = Users.publications.byClass.run

        it('throws if there is no class by given classId', async () => {
          const classId = Random.id()
          await expectThrow({
            fn: () => byClass.call({}, { classId }),
            error: DocNotFoundError.name,
            reason: 'getDocument.docUndefined',
            details: { name: SchoolClass.name, query: classId }
          })
        })
        it('throws if the current user is not not owner and also not a member of the class', async () => {
          const classDoc = await mockClassDoc({}, SchoolClassCollection)
          const classId = classDoc._id
          const userId = Random.id()
          await expectThrow({
            fn: () => byClass.call({ userId }, { classId }),
            error: PermissionDeniedError.name,
            reason: 'schoolClass.notMember',
            details: { userId, classId }
          })
        })
        it('returns all users of a class if the user is owner', async() => {
          const userId = Random.id()
          const studentDoc = { _id: Random.id(), username: Random.id(), presence: {}, services: {} }
          await UsersCollection.insertAsync(studentDoc)

          const classDoc = { _id: Random.id(), createdBy: userId, students: [studentDoc._id] }
          const classId = classDoc._id

          stub(SchoolClassCollection, 'findOneAsync', async () => classDoc)

          const users = await collectPublication(await byClass.call({ userId }, { classId }))
          expect(users.length).to.equal(1)
          expect(users[0]._id).to.equal(studentDoc._id)
          expect(users[0].username).to.equal(studentDoc.username)
          expect(users[0].presence).to.deep.equal({})
          expect(users[0].services).to.equal(undefined)
        })
        it('returns all users of a class if the user is member', async() => {
          const teacherId = Random.id()
          const studentDoc = { _id: Random.id(), username: Random.id(), presence: {}, services: {} }
          await UsersCollection.insertAsync(studentDoc)

          const classDoc = { _id: Random.id(), createdBy: teacherId, students: [studentDoc._id] }
          const classId = classDoc._id

          stub(SchoolClassCollection, 'findOneAsync', async () => classDoc)

          // call from student
          const users = await collectPublication(await byClass.call({ userId: studentDoc._id }, { classId }))
          expect(users.length).to.equal(1)
          expect(users[0]._id).to.equal(studentDoc._id)
          expect(users[0].username).to.equal(studentDoc.username)
          expect(users[0].presence).to.deep.equal({})
          expect(users[0].services).to.equal(undefined)
        })
      })
    })
  })
})
