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

const createRegisterDoc = ({
  code = Random.id(),
  email = `${Random.id()}@example.app`,
  firstName,
  lastName,
  institution = Random.id()
} = {}) => ({
  code, email, firstName, lastName, institution
})

describe('Users', function () {
  let SchoolClassCollection
  let CodeInvitationCollection
  let UsersCollection

  before(function () {
    [SchoolClassCollection, CodeInvitationCollection, UsersCollection] = mockCollections(SchoolClass, CodeInvitation, Users, Admin)
  })

  afterEach(function () {
    restoreAll()
    clearAllCollections()
  })

  after(function () {
    restoreAllCollections()
  })

  onServerExec(function () {
    describe('helpers', function () {
      describe(Users.helpers.verify.name, function () {
        const verifyUser = Users.helpers.verify

        it('throws if the user is not found', function () {
          expect(() => verifyUser()).to.throw('errors.userNotFound')
        })
        it('throws if the user has no email', function () {
          expect(() => verifyUser({})).to.throw('errors.noEmailFound')
          expect(() => verifyUser({ emails: [] })).to.throw('errors.noEmailFound')
          expect(() => verifyUser({ emails: [{}] })).to.throw('errors.noEmailFound')
        })
        it('returns false if the user is not verified', function () {
          expect(verifyUser({ emails: [{ address: Random.id() }] })).to.equal(false)
          expect(verifyUser({ emails: [{ address: Random.id(), verified: false }] })).to.equal(false)
        })
        it('returns true if the user is verified', function () {
          expect(verifyUser({ emails: [{ address: Random.id(), verified: true }] })).to.equal(true)
        })
      })
    })

    describe('methods', function () {
      const registerWithCode = (...args) => Users.methods.registerWithCode.run(...args)

      describe(Users.methods.registerWithCode.name, function () {
        it('throws on an invalid code', function () {
          const doc = createRegisterDoc()
          expect(() => registerWithCode(doc))
            .to.throw('codeRegister.failed')
            .with.property('reason', 'codeRegister.codeInvalid')
        })
        it('throws if a user exists already by given email', function () {
          const registerDoc = createRegisterDoc()
          UsersCollection.insert({ emails: [{ address: registerDoc.email }] })

          stub(CodeInvitation.helpers, CodeInvitation.helpers.validate.name, () => true)
          expect(() => registerWithCode(registerDoc))
            .to.throw('codeRegister.failed')
            .with.property('reason', 'codeRegister.emailExists')
        })
        it('throws if the account creation failed', function () {
          const registerDoc = createRegisterDoc()
          CodeInvitationCollection.insert({
            ...registerDoc,
            expires: 2,
            maxUsers: 2,
            role: UserUtils.roles.teacher
          })
          stub(CodeInvitation.helpers, CodeInvitation.helpers.validate.name, () => true)
          stub(CodeInvitation.helpers, CodeInvitation.helpers.getCodeDoc.name, () => undefined)
          stub(UserFactory, 'create', () => {
            throw new Meteor.Error('error', 'expectedErrorReason')
          })
          stub(Accounts, 'createUser', () => null)

          expect(() => registerWithCode(registerDoc))
            .to.throw('codeRegister.failed')
            .with.property('reason', 'expectedErrorReason')
        })
        it('throws if adding user to the class fails', function () {
          const codeDoc = createCodeDoc()
          CodeInvitationCollection.insert(codeDoc)
          const registerDoc = createRegisterDoc({ code: codeDoc.code, firstName: 'John', lastName: 'Doe' })

          stub(CodeInvitation.helpers, CodeInvitation.helpers.validate.name, () => true)
          stub(CodeInvitation.helpers, CodeInvitation.helpers.addUserToInvitation.name, () => 1)
          stub(UserFactory, UserFactory.create.name, () => Random.id())
          stub(SchoolClass.helpers, SchoolClass.helpers.addStudent.name, () => false)

          const thrown = expect(() => registerWithCode(registerDoc))
            .to.throw('codeRegister.failed')
          thrown.with.property('reason', 'codeRegister.studentNotAdded')
          thrown.with.deep.property('details', { classId: codeDoc.classId, studentAdded: false })
        })

        const validRegistration = ({ codeDocArgs } = {}) => {
          const codeDoc = createCodeDoc(codeDocArgs)
          delete codeDoc.classId
          const codeDocId = CodeInvitationCollection.insert(codeDoc)
          const registerDoc = createRegisterDoc({ code: codeDoc.code, firstName: 'John', lastName: 'Doe' })

          stub(CodeInvitation.helpers, CodeInvitation.helpers.validate.name, () => true)
          stub(CodeInvitation.helpers, CodeInvitation.helpers.getCodeDoc.name, () => codeDoc)
          stub(Roles, 'addUsersToRoles', () => true)
          stub(Roles, 'userIsInRole', () => true)
          stub(Accounts, 'createUser', ({ email }) => {
            return UsersCollection.insert({ emails: [{ address: email }] })
          })
          stub(Accounts, 'sendEnrollmentEmail', () => true)
          stub(Accounts, 'sendVerificationEmail', () => true)

          const userId = registerWithCode(registerDoc)
          expect(UsersCollection.find(userId).count()).to.equal(1)

          return { codeDocId, userId, registerDoc }
        }

        it('registers a user', function () {
          validRegistration()
        })
        it('invalidates the codeDoc after registration', function () {
          const { codeDocId } = validRegistration()
          const afterRegisterCodeDoc = CodeInvitationCollection.findOne(codeDocId)
          expect(CodeInvitation.helpers.isComplete(afterRegisterCodeDoc)).to.equal(true)
        })
        it('always uses role and institution from codeDoc', function () {
          const codeDocArgs = {
            role: UserUtils.roles.curriculum,
            institution: 'Other school'
          }
          const { userId, codeDocId, registerDoc } = validRegistration({ codeDocArgs })
          const user = UsersCollection.findOne(userId)
          const codeDoc = CodeInvitationCollection.findOne(codeDocId)

          expect(user.role).to.equal(codeDoc.role)
          expect(user.role).to.not.equal(registerDoc.role)
          expect(user.institution).to.equal(codeDoc.institution)
          expect(user.institution).to.not.equal(registerDoc.institution)
        })
        it('allows to use firstName and lastName in favour from user input', function () {
          const codeDocArgs = {
            firstName: 'Jane',
            lastName: 'Done'
          }
          const { userId, codeDocId, registerDoc } = validRegistration({ codeDocArgs })
          const user = UsersCollection.findOne(userId)
          const codeDoc = CodeInvitationCollection.findOne(codeDocId)
          expect(user.firstName).to.not.equal(codeDoc.firstName)
          expect(user.firstName).to.equal(registerDoc.firstName)
          expect(user.lastName).to.not.equal(codeDoc.lastName)
          expect(user.lastName).to.equal(registerDoc.lastName)
        })
      })
      describe(Users.methods.checkResetpasswordToken.name, function () {
        const checkResetPasswordToken = Users.methods.checkResetpasswordToken.run

        it('throws if the given user is not found', function () {
          const email = Random.id()
          const thrown = expect(() => checkResetPasswordToken({
            token: Random.id(),
            email
          }))
            .to.throw('user.tokenInvalid')

          thrown.with.property('reason', 'user.userNotFound')
          thrown.with.deep.property('details', { email })
        })
        it('throws if the token is the token is missing', function () {
          const email = Random.id()
          const userDoc = { email }
          UsersCollection.insert({
            emails: [{ address: email }],
            services: {
              password: {
                reset: { reason: 'reset', token: Random.id() }
              }
            }
          })

          const thrown = expect(() => checkResetPasswordToken({
            email: userDoc.email,
            token: Random.id(),
            reason: 'reset'
          })).to.throw('user.tokenInvalid')

          thrown.with.property('reason', 'user.tokenInvalid')
          thrown.with.deep.property('details', { email })
        })
        it('throws if the reason is not valid', function () {
          const email = 'me@example.com'
          const userId = UsersCollection.insert({ emails: [{ address: email }], services: { password: {} } })
          const tokenId = Random.id()
          UsersCollection.update(userId, {
            $set: { 'services.password.reset': { token: tokenId, reason: 'reset' } }
          })

          const reason = Random.id()
          const thrown = expect(() => checkResetPasswordToken({
            token: tokenId,
            email,
            reason
          })).to.throw('user.tokenInvalid')

          thrown.with.property('reason', 'user.reasonInvalid')
          thrown.with.deep.property('details', { reason })
        })
        it('throws if the date is already expired', function () {
          const email = Random.id()
          const userId = UsersCollection.insert({ emails: [{ address: email }], services: { password: {} } })
          const tokenId = Random.id()
          const reason = 'reset'

          UsersCollection.update(userId, {
            $set: {
              'services.password.reset': {
                token: tokenId,
                reason,
                when: new Date(Date.now() - 1000000000)
              }
            }
          })

          const thrown = expect(() => checkResetPasswordToken({
            email,
            token: tokenId,
            reason: reason
          })).to.throw('user.tokenInvalid')

          thrown.with.property('reason', 'user.tokenExpired')
        })
        it('returns true if the token is valid', function () {
          const email = Random.id()
          const userId = UsersCollection.insert({ emails: [{ address: email }], services: { password: {} } })
          const tokenId = Random.id()
          const reason = 'reset'

          UsersCollection.update(userId, {
            $set: {
              'services.password.reset': {
                token: tokenId,
                reason,
                when: new Date(Date.now() - 1000000)
              }
            }
          })

          expect(checkResetPasswordToken({
            email: email,
            token: tokenId,
            reason: reason
          })).to.equal(true)
        })
      })

      describe(Users.methods.getUser.name, function () {
        const getUser = Users.methods.getUser.run
        const _id = Random.id()
        let user

        beforeEach(function () {
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

        afterEach(function () {
          restoreAll()
        })

        it('throws if the given user does not exists', function () {
          const thrown = expect(() => getUser({})).to.throw('user.invalidUser')
          thrown.with.property('reason', 'user.notFound')
          thrown.with.property('details', undefined)
        })
        it('returns a near full user for oneself', function () {
          UsersCollection.insert(user)

          const actualUser = getUser.call({ userId: user._id }, { _id })
          expect(actualUser._id).to.equal(user._id)
          expect(actualUser.firstName).to.equal(user.firstName)
          expect(actualUser.lastName).to.equal(user.lastName)
          expect(actualUser.services).to.equal(undefined)
          expect(actualUser.emails).to.deep.equal(user.emails)
          expect(actualUser.presence).to.deep.equal({ online: true })
        })
        it('returns a limited user for others', function () {
          UsersCollection.insert(user)

          const actualUser = getUser.call({ userId: Random.id() }, { _id })
          expect(actualUser._id).to.equal(user._id)
          expect(actualUser.firstName).to.equal(user.firstName)
          expect(actualUser.lastName).to.equal(user.lastName)
          expect(actualUser.emails).to.equal(undefined)
          expect(actualUser.presence).to.equal(undefined)
          expect(actualUser.services).to.equal(undefined)
        })
      })

      describe(Users.methods.resendVerificationMail.name, function () {
        const resend = Users.methods.resendVerificationMail.run

        it('fails silent if the user not exists', function () {
          const sent = resend({ userId: Random.id() })
          expect(sent).to.equal(undefined)
        })
        it('fails silent if the user is already verified', function () {
          const user = {
            _id: Random.id(),
            emails: [{
              address: Random.id(),
              verified: true
            }]
          }
          UsersCollection.insert(user)

          const sent = resend({ userId: user._id })
          expect(sent).to.equal(undefined)
        })
        it('sends a verification mail to the given user', function () {
          const user = {
            _id: Random.id(),
            emails: [{
              address: Random.id(),
              verified: false
            }]
          }
          const mailId = Random.id()

          stub(UsersCollection, 'findOne', () => user)
          stub(Accounts, 'sendVerificationEmail', () => mailId)

          const sent = resend({ userId: user._id })
          expect(sent).to.equal(mailId)
        })
      })

      describe(Users.methods.sendResetPasswordEmail.name, function () {
        const send = Users.methods.sendResetPasswordEmail.run

        it('fails silent if the user not exists by email', function () {
          const sent = send({ email: Random.id() })
          expect(sent).to.equal(undefined)
        })
        it('sends a password-reset mail to the given user', function () {
          const email = Random.id()
          const userId = UsersCollection.insert({ emails: [{ address: email }] })
          stub(Accounts, 'sendResetPasswordEmail', () => userId)
          const sent = send({ email })
          expect(sent).to.equal(userId)
        })
      })

      describe(Users.methods.updateProfile.name, function () {
        const update = Users.methods.updateProfile.run

        it('updates the current user\'s profile', function () {
          const userId = UsersCollection.insert({ firstName: 'John', lastName: 'Doe', profileImage: Random.id() })
          const userDoc = UsersCollection.findOne(userId)
          const updateDoc = {
            firstName: 'Jane',
            lastName: 'Done',
            profileImage: Random.id()
          }

          expect(update.call({ userId }, updateDoc)).to.equal(1)

          const updatedUser = UsersCollection.findOne(userId)
          expect(updatedUser.firstName).to.equal(updateDoc.firstName)
          expect(updatedUser.lastName).to.equal(updateDoc.lastName)
          expect(updatedUser.profileImage).to.equal(updateDoc.profileImage)
          expect(updatedUser.firstName).to.not.equal(userDoc.firstName)
          expect(updatedUser.lastName).to.not.equal(userDoc.lastName)
          expect(updatedUser.profileImage).to.not.equal(userDoc.profileImage)
        })
      })

      describe(Users.methods.updateUI.name, function () {
        const update = Users.methods.updateUI.run

        it('it updates the users ui', function () {
          const user = { ui: { fluid: undefined } }
          const userId = UsersCollection.insert(user)

          const updateDoc = { fluid: true }

          expect(update.call({ userId }, updateDoc)).to.equal(1)

          const updatedUser = UsersCollection.findOne(userId)
          expect(updatedUser.ui.fluid).to.equal(updateDoc.fluid)
          expect(updatedUser.ui.fluid).to.not.equal(user.ui.fluid)
        })

        it('creates a new ui namespace on the user if it does not exist', function () {
          const user = {}
          const userId = UsersCollection.insert(user)

          const updateDoc = {
            fluid: true
          }

          expect(update.call({ userId }, updateDoc)).to.equal(1)

          const updatedUser = UsersCollection.findOne(userId)
          expect(updatedUser.ui.fluid).to.equal(true)
        })
      })

      describe(Users.methods.userIsAvailable.name, function () {
        const userIsAvailable = Users.methods.userIsAvailable.run

        it('returns if a user exists by mail', function () {
          const email = Random.id()
          UsersCollection.insert({ emails: [{ address: email }] })
          expect(userIsAvailable({ email })).to.equal(false)
          expect(userIsAvailable({ email: Random.id() })).to.equal(true)
        })
      })
    })

    describe('publications', function () {
      afterEach(function () {
        restoreAll()
      })

      describe(Users.publications.byClass.name, function () {
        const byClass = Users.publications.byClass.run

        it('throws if there is no class by given classId', function () {
          const classId = Random.id()
          const thrown = expect(() => byClass({ classId }))
            .to.throw(DocNotFoundError.name)
          thrown.with.property('reason', 'getDocument.docUndefined')
          thrown.with.deep.property('details', { name: SchoolClass.name, query: classId })
        })
        it('throws if the current user is not not owner and also not a member of the class', function () {
          const classDoc = mockClassDoc({}, SchoolClassCollection)
          const classId = classDoc._id
          const userId = Random.id()
          const thrown = expect(() => byClass.call({ userId }, { classId }))
            .to.throw(PermissionDeniedError.name)
          thrown.with.property('reason', 'schoolClass.notMember')
          thrown.with.deep.property('details', { userId, classId })
        })
        it('returns all users of a class if the user is owner', function () {
          const userId = Random.id()
          const studentDoc = { _id: Random.id(), username: Random.id(), presence: {}, services: {} }
          UsersCollection.insert(studentDoc)

          const classDoc = { _id: Random.id(), createdBy: userId, students: [studentDoc._id] }
          const classId = classDoc._id

          stub(SchoolClassCollection, 'findOne', () => classDoc)

          const users = collectPublication(byClass.call({ userId }, { classId }))
          expect(users.length).to.equal(1)
          expect(users[0]._id).to.equal(studentDoc._id)
          expect(users[0].username).to.equal(studentDoc.username)
          expect(users[0].presence).to.deep.equal({})
          expect(users[0].services).to.equal(undefined)
        })
        it('returns all users of a class if the user is member', function () {
          const teacherId = Random.id()
          const studentDoc = { _id: Random.id(), username: Random.id(), presence: {}, services: {} }
          UsersCollection.insert(studentDoc)

          const classDoc = { _id: Random.id(), createdBy: teacherId, students: [studentDoc._id] }
          const classId = classDoc._id

          stub(SchoolClassCollection, 'findOne', () => classDoc)

          // call from student
          const users = collectPublication(byClass.call({ userId: studentDoc._id }, { classId }))
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
