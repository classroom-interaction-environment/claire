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
import { mockCollection } from '../../../../../../tests/testutils/mockCollection'
import { collectPublication } from '../../../../../../tests/testutils/collectPublication'
import { InvocationChecker } from '../../../../../api/utils/InvocationChecker'

// some methods depend on these collections
mockCollection(Admin)
const SchoolClassCollection = mockCollection(SchoolClass)
const CodeInvitationCollection = mockCollection(CodeInvitation)

const registerUser = ({ code = Random.id(), email = `${Random.id()}@example.app`, firstName, lastName } = {}) => ({
  code, email, firstName, lastName
})

describe('Users', function () {
  onServerExec(function () {
    describe('helpers', function () {
      describe(Users.helpers.verify.name, function () {
        const verify = Users.helpers.verify

        it('throws if the user is not found', function () {
          expect(() => verify()).to.throw('errors.userNotFound')
        })
        it('throws if the user has no email', function () {
          expect(() => verify({})).to.throw('errors.noEmailFound')
          expect(() => verify({ emails: [] })).to.throw('errors.noEmailFound')
          expect(() => verify({ emails: [{}] })).to.throw('errors.noEmailFound')
        })
        it('returns false if the user is not verified', function () {
          expect(verify({ emails: [{ address: Random.id() }] })).to.equal(false)
          expect(verify({ emails: [{ address: Random.id(), verified: false }] })).to.equal(false)
        })
        it('returns true if the user is verified', function () {
          expect(verify({ emails: [{ address: Random.id(), verified: true }] })).to.equal(true)
        })
      })
    })

    describe('methods', function () {
      const registerWithCode = (...args) => Users.methods.registerWithCode.run(...args)

      afterEach(function () {
        Meteor.users.remove({})
        CodeInvitationCollection.remove({})
        restoreAll()
      })

      describe(Users.methods.registerWithCode.name, function () {
        it('throws on an invalid code', function () {
          const registerDoc = registerUser()
          expect(() => registerWithCode(registerDoc))
            .to.throw(Users.errors.codeRegister.failed)
            .with.property('reason', Users.errors.codeRegister.codeInvalid)
        })
        it('throws if a user exists already by given email', function () {
          const registerDoc = registerUser()
          Accounts.createUser(registerDoc)
          stub(CodeInvitation.helpers, CodeInvitation.helpers.validate.name, () => true)
          expect(() => registerWithCode(registerDoc))
            .to.throw(Users.errors.codeRegister.failed)
            .with.property('reason', Users.errors.codeRegister.emailExists)
        })
        it('throws if the account creation failed', function () {
          const registerDoc = registerUser()

          stub(CodeInvitation.helpers, CodeInvitation.helpers.validate.name, () => true)
          stub(CodeInvitation.helpers, CodeInvitation.helpers.getCodeDoc.name, () => {})
          stub(Accounts, 'createUser', () => null)

          expect(() => registerWithCode(registerDoc))
            .to.throw(Users.errors.codeRegister.failed)
            .with.property('reason', 'account')
        })
        it('throws if adding user to the class fails', function () {
          const codeDoc = createCodeDoc()
          const registerDoc = registerUser({ code: codeDoc._id, firstName: 'John', lastName: 'Doe' })

          stub(CodeInvitation.helpers, CodeInvitation.helpers.validate.name, () => true)
          stub(CodeInvitation.helpers, CodeInvitation.helpers.getCodeDoc.name, () => codeDoc)
          stub(CodeInvitation.helpers, CodeInvitation.helpers.addUserToInvitation.name, () => 1)
          stub(UserFactory, UserFactory.create.name, () => Random.id())
          stub(SchoolClass.helpers, SchoolClass.helpers.addStudent.name, () => undefined)

          expect(() => registerWithCode(registerDoc)).to.throw(Users.errors.codeRegister.failed).with.property('reason', 'class')
        })
        it('registers a user', function () {
          const codeDoc = createCodeDoc()
          delete codeDoc.classId

          const registerDoc = registerUser({ code: codeDoc._id, firstName: 'John', lastName: 'Doe' })

          stub(CodeInvitation.helpers, CodeInvitation.helpers.validate.name, () => true)
          stub(CodeInvitation.helpers, CodeInvitation.helpers.getCodeDoc.name, () => codeDoc)
          stub(CodeInvitation.helpers, CodeInvitation.helpers.addUserToInvitation.name, () => 1)
          stub(Accounts, 'sendEnrollmentEmail', () => true)
          stub(Accounts, 'sendVerificationEmail', () => true)

          const userId = registerWithCode(registerDoc)
          expect(Meteor.users.find(userId).count()).to.equal(1)
        })
        it('invalidates the codeDoc after registration', function () {
          const classId = SchoolClassCollection.insert({ title: Random.id() })
          const codeDoc = createCodeDoc({ classId })
          const codeDocId = CodeInvitationCollection.insert(codeDoc)
          const registerDoc = registerUser({ code: codeDoc._id, firstName: 'John', lastName: 'Doe' })

          stub(CodeInvitation.helpers, CodeInvitation.helpers.validate.name, () => true)
          stub(CodeInvitation.helpers, CodeInvitation.helpers.getCodeDoc.name, () => codeDoc)

          stub(Accounts, 'sendEnrollmentEmail', () => true)
          stub(Accounts, 'sendVerificationEmail', () => true)
          stub(InvocationChecker, 'ensureMethodInvocation', () => {})

          expect(CodeInvitation.helpers.isComplete(codeDoc)).to.equal(false)

          const userId = registerWithCode(registerDoc)
          expect(Meteor.users.find(userId).count()).to.equal(1)

          const afterRegisterCodeDoc = CodeInvitationCollection.findOne(codeDocId)
          expect(CodeInvitation.helpers.isComplete(afterRegisterCodeDoc)).to.equal(true)
        })
        it('always uses role and institution from codeDoc', function () {
          const codeDoc = createCodeDoc()
          delete codeDoc.classId

          const registerDoc = registerUser({
            code: codeDoc._id,
            firstName: 'John',
            lastName: 'Doe',
            role: Random.id(),
            institution: 'other school'
          })

          stub(CodeInvitation.helpers, CodeInvitation.helpers.validate.name, () => true)
          stub(CodeInvitation.helpers, CodeInvitation.helpers.getCodeDoc.name, () => codeDoc)
          stub(CodeInvitation.helpers, CodeInvitation.helpers.addUserToInvitation.name, () => 1)
          stub(Accounts, 'sendEnrollmentEmail', () => true)
          stub(Accounts, 'sendVerificationEmail', () => true)

          const userId = registerWithCode(registerDoc)
          const user = Meteor.users.findOne({ _id: userId })
          expect(user.role).to.equal(codeDoc.role)
          expect(user.role).to.not.equal(registerDoc.role)
          expect(user.institution).to.equal(codeDoc.institution)
          expect(user.institution).to.not.equal(registerDoc.institution)
        })
        it('allows to use firstName and lastName in favour from user input', function () {
          const codeDoc = createCodeDoc()
          delete codeDoc.classId

          const registerDoc = registerUser({
            code: codeDoc._id,
            firstName: 'Jane',
            lastName: 'Done'
          })

          stub(CodeInvitation.helpers, CodeInvitation.helpers.validate.name, () => true)
          stub(CodeInvitation.helpers, CodeInvitation.helpers.getCodeDoc.name, () => codeDoc)
          stub(CodeInvitation.helpers, CodeInvitation.helpers.addUserToInvitation.name, () => 1)
          stub(Accounts, 'sendEnrollmentEmail', () => true)
          stub(Accounts, 'sendVerificationEmail', () => true)

          const userId = registerWithCode(registerDoc)
          const user = Meteor.users.findOne()
          expect(user.firstName).to.not.equal(codeDoc.firstName)
          expect(user.firstName).to.equal(registerDoc.firstName)
          expect(user.lastName).to.not.equal(codeDoc.lastName)
          expect(user.lastName).to.equal(registerDoc.lastName)
        })
      })
      describe(Users.methods.checkResetpasswordToken.name, function () {
        const checkResetPasswordToken = Users.methods.checkResetpasswordToken.run

        beforeEach(function () {
          Meteor.users.remove({})
        })

        afterEach(function () {
          restoreAll()
        })

        it('throws if the given user is not found', function () {
          const throwed = expect(() => checkResetPasswordToken({
            email: Random.id(),
            token: Random.id()
          }))
            .to.throw('403')

          throwed.with.property('reason', 'user.tokenInvalid')
          throwed.with.property('details', 'user.userNotFound')
        })
        it('throws if the token is the token is missing', function () {
          const userDoc = { email: Random.id() }
          const userId = Accounts.createUser(userDoc)
          Accounts.setPassword(userId, Random.id())

          const throwed = expect(() => checkResetPasswordToken({
            email: userDoc.email,
            token: Random.id()
          })).to.throw('403')

          throwed.with.property('reason', 'user.tokenInvalid')
          throwed.with.property('details', 'user.tokenInvalid')
        })
        it ('throws if the reason is not valid', function () {
          const userDoc = { email: Random.id(), password: Random.id() }
          const userId = Accounts.createUser(userDoc)
          const tokenId = Random.id()
          Meteor.users.update(userId, {
            $set: { 'services.password.reset': { token: tokenId } }
          })

          const throwed = expect(() => checkResetPasswordToken({
            email: userDoc.email,
            token: tokenId,
            reason: Random.id()
          })).to.throw('403')

          throwed.with.property('reason', 'user.tokenInvalid')
          throwed.with.property('details', 'user.reasonInvalid')
        })
        it('throws if the date is already expired', function () {
          const userDoc = { email: Random.id(), password: Random.id() }
          const userId = Accounts.createUser(userDoc)
          const tokenId = Random.id()
          const reason = Random.id()
          Meteor.users.update(userId, {
            $set: { 'services.password.reset': { token: tokenId, reason } }
          })

          const throwed = expect(() => checkResetPasswordToken({
            email: userDoc.email,
            token: tokenId,
            reason: reason
          })).to.throw('403')

          throwed.with.property('reason', 'user.tokenInvalid')
          throwed.with.property('details', 'user.tokenExpired')
        })
        it('returns true if the token is valid', function () {
          const userDoc = { email: Random.id(), password: Random.id() }
          const userId = Accounts.createUser(userDoc)
          const tokenId = Random.id()
          const reason = Random.id()
          const when = new Date(Date.now() - 1000000)
          Meteor.users.update(userId, {
            $set: { 'services.password.reset': { token: tokenId, reason, when } }
          })

          expect(checkResetPasswordToken({
            email: userDoc.email,
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
          Meteor.users.remove({})
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
          const thrown = expect(() => getUser({})).to.throw(Users.errors.invalidUser)
          thrown.with.property('reason', 'user.notFound')
          thrown.with.property('details', undefined)
        })
        it('returns a near full user for oneself', function () {
          stub(Meteor.users, 'findOne', () => user)

          const actualUser = getUser.call({ userId: user._id }, { _id })
          expect(actualUser._id).to.equal(user._id)
          expect(actualUser.firstName).to.equal(user.firstName)
          expect(actualUser.lastName).to.equal(user.lastName)
          expect(actualUser.services).to.equal(undefined)
          expect(actualUser.emails).to.deep.equal(user.emails)
          expect(actualUser.presence).to.deep.equal({ online: true })
        })
        it('returns a limited user for others', function () {
          stub(Meteor.users, 'findOne', () => user)

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
          stub(Meteor.users, 'findOne', () => user)

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

          stub(Meteor.users, 'findOne', () => user)
          stub(Accounts, 'sendVerificationEmail', () => mailId)

          const sent = resend({ userId: user._id })
          expect(sent).to.equal(mailId)
        })
      })
      describe(Users.methods.sendResetPasswordEmail.name, function () {
        const send = Users.methods.sendResetPasswordEmail.run

        it('fails silent if the user not exists by email', function () {
          stub(Accounts, 'findUserByEmail', () => undefined)
          const sent = send({ email: Random.id() })
          expect(sent).to.equal(undefined)
        })
        it('sends a password-reset mail to the given user', function () {
          const userId = Random.id()
          stub(Accounts, 'findUserByEmail', () => userId)
          stub(Accounts, 'sendResetPasswordEmail', () => userId)
          const sent = send({ email: Random.id() })
          expect(sent).to.equal(userId)
        })
      })
      describe(Users.methods.updateProfile.name, function () {
        const update = Users.methods.updateProfile.run

        it('updates the current user\'s profile', function () {
          const user = { firstName: Random.id(), lastName: Random.id(), profileImage: Random.id() }
          const userId = Meteor.users.insert(user)

          const updateDoc = {
            firstName: Random.id(),
            lastName: Random.id(),
            profileImage: Random.id()
          }

          expect(update.call({ userId }, updateDoc)).to.equal(1)

          const updatedUser = Meteor.users.findOne(userId)
          expect(updatedUser.firstName).to.equal(updateDoc.firstName)
          expect(updatedUser.lastName).to.equal(updateDoc.lastName)
          expect(updatedUser.profileImage).to.equal(updateDoc.profileImage)
          expect(updatedUser.firstName).to.not.equal(user.firstName)
          expect(updatedUser.lastName).to.not.equal(user.lastName)
          expect(updatedUser.profileImage).to.not.equal(user.profileImage)
        })
      })
      describe(Users.methods.updateUI.name, function () {
        const update = Users.methods.updateUI.run

        it('it updates the users ui', function () {
          const user = { ui: { fluid: undefined } }
          const userId = Meteor.users.insert(user)

          const updateDoc = {
            fluid: true
          }

          expect(update.call({ userId }, updateDoc)).to.equal(1)

          const updatedUser = Meteor.users.findOne(userId)
          expect(updatedUser.ui.fluid).to.equal(updateDoc.fluid)
          expect(updatedUser.ui.fluid).to.not.equal(user.ui.fluid)
        })

        it('creates a new ui namespace on the user if it does not exist', function () {
          const user = {}
          const userId = Meteor.users.insert(user)

          const updateDoc = {
            fluid: true
          }

          expect(update.call({ userId }, updateDoc)).to.equal(1)

          const updatedUser = Meteor.users.findOne(userId)
          expect(updatedUser.ui.fluid).to.equal(true)
        })
      })
      describe(Users.methods.userIsAvailable.name, function () {
        const userIsAvailable = Users.methods.userIsAvailable.run

        it('returns if a user exists by mail', function () {
          const userDoc = { email: Random.id(), password: Random.id() }
          Accounts.createUser(userDoc)
          expect(userIsAvailable({ email: userDoc.email })).to.equal(false)
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
          const thrown = expect(() => byClass({ classId })).to.throw('errors.publicationFailed')
          thrown.with.property('reason', 'errors.docNotFound')
          thrown.with.property('details', classId)
        })
        it('throws if the current user is not not owner and also not a member of the class', function () {
          const classDoc = { _id: Random.id() }
          const classId = classDoc._id
          const userId = Random.id()

          stub(SchoolClassCollection, 'findOne', () => classDoc)
          const thrown = expect(() => byClass.call({ userId }, { classId })).to.throw('errors.publicationFailed')
          thrown.with.property('reason', 'errors.permissionDenied')
          thrown.with.property('details', classId)
        })
        it('returns all users of a class if the user is owner', function () {
          const userId = Random.id()
          const studentDoc = { _id: Random.id(), username: Random.id(), presence: {}, services: {} }
          Meteor.users.insert(studentDoc)

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
          Meteor.users.insert(studentDoc)

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
