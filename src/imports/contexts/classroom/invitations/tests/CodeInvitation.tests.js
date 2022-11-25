/* global describe it beforeEach afterEach */
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { CodeInvitation } from '../CodeInvitations'
import { onClientExec, onServerExec } from '../../../../api/utils/archUtils'
import { UserUtils } from '../../../system/accounts/users/UserUtils'
import { SchoolClass } from '../../schoolclass/SchoolClass'
import { createCodeDoc } from '../../../../../tests/testutils/doc/createCodeDoc'
import { Users } from '../../../system/accounts/users/User'
import { stub, restoreAll } from '../../../../../tests/testutils/stub'
import { InvocationChecker } from '../../../../api/utils/InvocationChecker'
import { DocNotFoundError } from '../../../../api/errors/types/DocNotFoundError'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
import { Admin } from '../../../system/accounts/admin/Admin'

describe(CodeInvitation.name, function () {
  describe('helpers', function () {
    describe(CodeInvitation.helpers.getOffset.name, function () {
      it('Calculates a future date as unix timestamp', function () {
        const now = new Date()
        const time = now.getTime()

        const counts = Math.floor(Math.random() * 10)
        for (let i = 0; i < counts; i++) {
          const offset = CodeInvitation.helpers.getOffset(now, i)
          const expectedTime = time + (i * 1000 * 60 * 60 * 24)
          expect(offset).to.equal(expectedTime)
        }
      })
    })

    describe(CodeInvitation.helpers.timeLeft.name, function () {
      it('Returns the time left in ms between now and the expiration date', function () {
        const now = new Date()
        const counts = Math.floor(Math.random() * 10)
        for (let i = 0; i < counts; i++) {
          const timeLeft = CodeInvitation.helpers.timeLeft(now, i)
          const expectedTimeLeft = i * 1000 * 60 * 60 * 24
          const diff = Math.abs(expectedTimeLeft - timeLeft)
          expect(diff).to.be.below(10) // there are some miliseconds of diffing here and we
        }
      })
    })

    describe(CodeInvitation.helpers.isExpired.name, function () {
      it('returns true for a doc with invalid flag', function () {
        const invalid = { invalid: true, expires: 4, createdAt: new Date() }
        expect(CodeInvitation.helpers.isExpired(invalid)).to.equal(true)
      })

      it('returns true for a doc with expired date', function () {
        const expiredDoc = { expires: -3, createdAt: new Date(), invalid: false }
        expect(CodeInvitation.helpers.isExpired(expiredDoc)).to.equal(true)
      })

      it('returns false for a valid doc with unexpired date', function () {
        const expiredDoc = { expires: 3, createdAt: new Date(), invalid: false }
        expect(CodeInvitation.helpers.isExpired(expiredDoc)).to.equal(false)
      })

      it('throws, if params are missing', function () {
        expect(() => CodeInvitation.helpers.isExpired({})).to.throw()
      })
    })

    describe(CodeInvitation.helpers.isComplete.name, function () {
      it('returns false for a doc with no registered users', function () {
        const doc = createCodeDoc({ registeredUsers: null })
        expect(CodeInvitation.helpers.isComplete(doc)).to.equal(false)
      })

      it('returns false for a doc where the registered users are below max users', function () {
        const doc = createCodeDoc({ registeredUsers: [Random.id()], maxUsers: 2 })
        expect(CodeInvitation.helpers.isComplete(doc)).to.equal(false)
      })

      it('returns true for a doc where all users have been completed', function () {
        const doc = createCodeDoc({ registeredUsers: [Random.id(), Random.id()], maxUsers: 2 })
        expect(CodeInvitation.helpers.isComplete(doc)).to.equal(true)
      })

      it('throws, if registered users are greater than max users', function () {
        const doc = createCodeDoc({ registeredUsers: [Random.id(), Random.id()], maxUsers: 1 })
        expect(() => CodeInvitation.helpers.isComplete(doc)).to.throw()
      })

      it('throws, if params are missing', function () {
        expect(() => CodeInvitation.helpers.isComplete({})).to.throw()
      })
    })

    describe(CodeInvitation.helpers.isPending.name, function () {
      it('returns false, if a doc is invalid', function () {
        const doc = createCodeDoc()
        doc.invalid = true
        expect(CodeInvitation.helpers.isPending(doc)).to.equal(false)
      })
      it('returns false, if a doc is expired', function () {
        const doc = createCodeDoc({ expires: -2 })
        expect(CodeInvitation.helpers.isPending(doc)).to.equal(false)
      })
      it('returns false, if a doc is completed', function () {
        const doc = createCodeDoc({ registeredUsers: [Random.id()] })
        expect(CodeInvitation.helpers.isPending(doc)).to.equal(false)
      })
      it('returns true otherwise', function () {
        const doc = createCodeDoc()
        expect(CodeInvitation.helpers.isPending(doc)).to.equal(true)
      })
      it('throws if params are incomplete', function () {
        expect(() => CodeInvitation.helpers.isPending({})).to.throw()
      })
    })

    describe(CodeInvitation.helpers.getStatus.name, function () {
      it('gets the correct status for invalid', function () {
        const doc = createCodeDoc()
        doc.invalid = true
        const status = CodeInvitation.helpers.getStatus(doc)
        expect(status).to.deep.equal(CodeInvitation.status.expired)
      })
      it('gets the correct status for expired', function () {
        const doc = createCodeDoc({ expires: -2 })
        const status = CodeInvitation.helpers.getStatus(doc)
        expect(status).to.deep.equal(CodeInvitation.status.expired)
      })
      it('gets the correct status for completed', function () {
        const doc = createCodeDoc({ registeredUsers: [Random.id()] })
        const status = CodeInvitation.helpers.getStatus(doc)
        expect(status).to.deep.equal(CodeInvitation.status.complete)
      })
      it('gets the correct status for pending', function () {
        const doc = createCodeDoc()
        const status = CodeInvitation.helpers.getStatus(doc)
        expect(status).to.deep.equal(CodeInvitation.status.pending)
      })
    })

    onClientExec(function () {
      describe(CodeInvitation.helpers.createURLQuery.name, function () {
        it('Creates a compressed version of URL query containing invitation credentials', function () {
          const doc = createCodeDoc()
          const queryString = CodeInvitation.helpers.createURLQuery(doc)
          expect(queryString).to.be.a('string')
          expect(queryString.length < JSON.stringify(doc).length).to.equal(true)
        })
      })

      describe(CodeInvitation.helpers.parseURLQuery.name, function () {
        it('parses a compressed url query', function () {
          const doc = createCodeDoc()
          const queryDoc = {
            code: doc.code,
            firstName: doc.firstName,
            lastName: doc.lastName,
            email: doc.email,
            institution: doc.institution
          }
          const queryString = CodeInvitation.helpers.createURLQuery(queryDoc)
          const parsed = CodeInvitation.helpers.parseURLQuery(queryString)
          expect(parsed).to.deep.equal(queryDoc)
        })
      })
    })
  })

  onServerExec(function () {
    import { mockCollections, clearCollections, restoreAllCollections } from '../../../../../tests/testutils/mockCollection'
    import { exampleUser } from '../../../../../tests/testutils/exampleUser'
    import { unstubUser, stubUser } from '../../../../../tests/testutils/stubUser'

    let CodeCollection
    let SchoolClassCollection

    let user
    let userId
    let environment
    let classDoc
    let classId

    describe('methods', function () {
      before(function () {
        [CodeCollection, SchoolClassCollection] = mockCollections(CodeInvitation, SchoolClass, Admin, Users)
      })

      beforeEach(function () {
        user = exampleUser()
        userId = user._id
        environment = { userId }
        classDoc = { createdBy: userId, title: Random.id() }
        classId = SchoolClassCollection.insert(classDoc)
      })

      afterEach(function () {
        unstubUser(user, userId)
        restoreAll()
        clearCollections(Users, CodeInvitation, SchoolClass)
      })

      after(function () {
        restoreAllCollections()
      })

      const createInvitation = (...args) => CodeInvitation.methods.create.run.call(environment, ...args)
      const forceExpire = (...args) => CodeInvitation.methods.forceExpire.run.call(environment, ...args)
      const addToClass = (...args) => CodeInvitation.methods.addToClass.run.call(environment, ...args)
      const removeInvitation = (...args) => CodeInvitation.methods.remove.run.call(environment, ...args)
      const verify = (...args) => CodeInvitation.methods.verify.run.call(environment, ...args)

      describe(CodeInvitation.methods.create.name, function () {
        it('throws, if the user cannot invite the given role', function () {
          // expected errors
          const { admin, schoolAdmin, curriculum, teacher, student } = UserUtils.roles
          const errorPairs = [
            [schoolAdmin, [admin, schoolAdmin]],
            [curriculum, [admin, schoolAdmin, curriculum]],
            [teacher, [admin, schoolAdmin, curriculum, teacher]],
            [student, [admin, schoolAdmin, curriculum, teacher, student]]
          ]

          errorPairs.forEach(entry => {
            const role = entry[0]
            const targets = entry[1]
            const { institution } = user
            stubUser(user, userId, [role], institution)

            targets.forEach(targetRole => {
              const createDoc = {
                maxUsers: 1,
                expires: 1,
                role: targetRole,
                institution,
                classId
              }

              const thrown = expect(() => createInvitation.call(environment, createDoc))
                .to.throw('codeInvitation.createFailed')
              thrown.with.property('reason', CodeInvitation.errors.insufficientRole)
              thrown.with.deep.property('details', { userId, role: targetRole })
            })

            unstubUser(user, userId)
          })
        })
        it('throws ,if a class is given but the user is not owner of the class or class does not exists', function () {
          stubUser(user, userId, [UserUtils.roles.teacher], user.institution)
          const createDoc = {
            maxUsers: 1,
            expires: 1,
            role: UserUtils.roles.student,
            classId: Random.id(),
            institution: user.institution
          }

          // case a: classdoc not found
          const notFound = expect(() => createInvitation.call(environment, createDoc))
            .to.throw(DocNotFoundError.name)
          notFound.with.property('reason', 'getDocument.docUndefined')
          notFound.with.deep.property('details', { name: SchoolClass.name, query: createDoc.classId })

          // case b: not owner
          createDoc.classId = SchoolClassCollection.insert({ title: Random.id(), createdBy: Random.id() })
          const notTeacher = expect(() => createInvitation(createDoc))
            .to.throw(PermissionDeniedError.name)
          notTeacher.with.property('reason', 'schoolClass.notTeacher')
          notTeacher.with.deep.property('details', { userId, classId: createDoc.classId })
        })
        it('throws if user is not admin and institutions mismatch', function () {
          const errorPairs = [
            [UserUtils.roles.schoolAdmin, [UserUtils.roles.teacher, UserUtils.roles.student]],
            [UserUtils.roles.teacher, [UserUtils.roles.student]]
          ]

          errorPairs.forEach(entry => {
            const role = entry[0]
            const targets = entry[1]
            stubUser(user, userId, [role], user.institution)

            targets.forEach(targetRole => {
              const createDoc = {
                maxUsers: 1,
                expires: 1,
                role: targetRole,
                institution: Random.id(),
                classId
              }
              expect(() => createInvitation(createDoc)).to.throw(CodeInvitation.errors.institutionMismatch)
            })

            unstubUser(user, userId)
          })
        })
        it('returns a new code doc', function () {
          const expectedWorking = [
            [UserUtils.roles.admin, [UserUtils.roles.admin, UserUtils.roles.schoolAdmin, UserUtils.roles.teacher, UserUtils.roles.student]],
            [UserUtils.roles.schoolAdmin, [UserUtils.roles.teacher, UserUtils.roles.student]],
            [UserUtils.roles.teacher, [UserUtils.roles.student]]
          ]

          expectedWorking.forEach(entry => {
            const role = entry[0]
            const targetRoles = entry[1]
            stubUser(user, userId, [role], user.institution)

            targetRoles.forEach(targetRole => {
              const createDoc = {
                role: targetRole,
                maxUsers: 1,
                expires: 1,
                institution: user.institution,
                classId
              }

              const codeDocId = createInvitation(createDoc)
              const codeDoc = CodeCollection.findOne(codeDocId)
              expect(codeDoc.code).to.be.a('string')
              expect(codeDoc.code).to.be.lengthOf(4)
              expect(codeDoc.role).to.equal(createDoc.role)
              expect(codeDoc.maxUsers).to.equal(createDoc.maxUsers)
              expect(codeDoc.expires).to.equal(createDoc.expires)
              expect(codeDoc.institution).to.equal(user.institution)
            })

            unstubUser(user, userId)
          })
        })
      })

      describe(CodeInvitation.methods.remove.name, function () {
        it('removes a code document', function () {
          stubUser(user, userId, [UserUtils.roles.teacher], user.institution)

          const codeDocId = CodeCollection.insert({
            role: UserUtils.roles.student,
            code: Random.id(5),
            maxUsers: 1,
            expires: 1,
            institution: user.institution,
            classId
          })

          const codeDoc = CodeCollection.findOne(codeDocId)
          const removed = removeInvitation(codeDoc)
          expect(removed).to.equal(1)
          expect(CodeCollection.findOne(codeDocId)).to.equal(undefined)
        })
      })

      describe(CodeInvitation.methods.verify.name, function () {
        it('throws when the document does not exists', function () {
          const codeDoc = { code: Random.id() }
          expect(() => verify(codeDoc)).to.throw(CodeInvitation.errors.invalidLink)
        })
        it('throws when the document is expired', function () {
          stubUser(user, userId, [UserUtils.roles.teacher], user.institution)

          const createDoc = createCodeDoc({ expires: 1, classId, institution: user.institution })
          const codeDocId = CodeCollection.insert(createDoc)
          CodeCollection.update(codeDocId, { $set: { invalid: true, createdAt: new Date() } })

          const codeDoc = CodeCollection.findOne(codeDocId)
          expect(() => verify(codeDoc)).to.throw(CodeInvitation.errors.invalidLink)
        })
        it('throws when the document is completed', function () {
          stubUser(user, userId, [UserUtils.roles.teacher], user.institution)
          const createDoc = createCodeDoc({ expires: 1, classId, institution: user.institution })
          const codeDocId = CodeCollection.insert(createDoc)
          CodeCollection.update(codeDocId, { $set: { createdAt: new Date(), registeredUsers: [Random.id()] } })

          const codeDoc = CodeCollection.findOne(codeDocId)
          expect(() => verify(codeDoc)).to.throw(CodeInvitation.errors.invalidLink)
        })
        it('returns the correct document for the given code', function () {
          stubUser(user, userId, [UserUtils.roles.teacher], user.institution)
          const createDoc = createCodeDoc({ expires: 1, classId, institution: user.institution })
          const codeDocId = CodeCollection.insert(createDoc)
          CodeCollection.update(codeDocId, { $set: { createdAt: new Date(), registeredUsers: [] } })

          const codeDoc = CodeCollection.findOne(codeDocId)
          const verifiedDoc = verify(codeDoc)
          const expectedDoc = {
            firstName: codeDoc.firstName,
            lastName: codeDoc.lastName,
            role: codeDoc.role,
            institution: codeDoc.institution,
            email: codeDoc.email,
            classId: codeDoc.classId,
            className: SchoolClassCollection.findOne(classId).title
          }
          expect(verifiedDoc).to.deep.equal(expectedDoc)
        })
      })

      describe(CodeInvitation.methods.addToClass.name, function () {
        it('throws on invalid code', function () {
          stubUser(user, userId, [UserUtils.roles.teacher], user.institution)
          const codeDoc = { code: Random.id() }
          expect(() => addToClass(codeDoc)).to.throws(CodeInvitation.errors.invalidCode)
        })
        it('throws if the class does not exists', function () {
          stubUser(user, userId, [UserUtils.roles.teacher], user.institution)
          const createDoc = {
            role: UserUtils.roles.student,
            code: Random.id(4),
            maxUsers: 1,
            expires: 1,
            institution: user.institution,
            createdAt: new Date(),
            classId: Random.id()
          }

          stub(Users.helpers, 'verify', () => true)

          const codeDocId = CodeCollection.insert(createDoc)
          const codeDoc = CodeCollection.findOne(codeDocId)
          expect(() => addToClass(codeDoc)).to.throws('docNotFound')
        })
        it('throws if the user is already in the class', function () {
          stub(Users.helpers, 'verify', () => true)
          stubUser(user, userId, [UserUtils.roles.teacher], user.institution)
          const classDocId = SchoolClassCollection.insert({ createdBy: userId, title: Random.id(), students: [userId] })

          const createDoc = {
            role: UserUtils.roles.student,
            code: Random.id(4),
            maxUsers: 1,
            expires: 1,
            institution: user.institution,
            createdAt: new Date(),
            classId: classDocId
          }

          const codeDocId = CodeCollection.insert(createDoc)

          stub(SchoolClass.helpers, 'isStudent', ({ classDoc, userId }) => classDoc && userId && true)

          const codeDoc = CodeCollection.findOne(codeDocId)
          expect(() => addToClass(codeDoc)).to.throws(CodeInvitation.errors.alreadyClassMember)
        })
        it('adds a student to the class', function () {
          stub(Users.helpers, 'verify', () => true)
          stub(UserUtils, 'hasRole', () => true)
          stub(InvocationChecker, InvocationChecker.ensureMethodInvocation.name, () => true)

          stubUser(user, userId, [UserUtils.roles.student], user.institution)

          const classDocId = SchoolClassCollection.insert({ title: Random.id(), students: [] })
          const createDoc = {
            role: UserUtils.roles.student,
            maxUsers: 1,
            expires: 1,
            code: Random.id(4),
            institution: user.institution,
            createdAt: new Date(),
            classId: classDocId
          }

          const codeDocId = CodeCollection.insert(createDoc)

          stub(SchoolClass.helpers, 'isStudent', ({ classDoc, userId }) => classDoc && userId && false)
          stub(SchoolClass.helpers, 'addStudent', ({ classId, userId }) => {
            return SchoolClassCollection.update(classId, { $addToSet: { students: userId } })
          })

          const codeDoc = CodeCollection.findOne(codeDocId)
          addToClass(codeDoc)

          const classDoc = SchoolClassCollection.findOne(classDocId)
          expect(classDoc.students).to.include(userId)
        })
        it('adds the student to the registered users', function () {
          stub(Users.helpers, 'verify', () => true)
          stub(UserUtils, 'hasRole', () => true)
          stub(InvocationChecker, InvocationChecker.ensureMethodInvocation.name, () => true)

          stubUser(user, userId, [UserUtils.roles.student], user.institution)
          const classDocId = SchoolClassCollection.insert({ title: Random.id(), students: [] })
          const createDoc = {
            role: UserUtils.roles.student,
            maxUsers: 1,
            expires: 1,
            code: Random.id(4),
            institution: user.institution,
            createdAt: new Date(),
            classId: classDocId
          }

          stub(SchoolClass.helpers, 'isStudent', ({ classDoc, userId }) => classDoc && userId && false)
          stub(SchoolClass.helpers, 'addStudent', ({ classId, userId }) => {
            return SchoolClassCollection.update(classId, { $addToSet: { students: userId } })
          })

          const codeDocId = CodeCollection.insert(createDoc)
          const codeDoc = CodeCollection.findOne(codeDocId)
          addToClass(codeDoc)

          const updatedCodeDoc = CodeCollection.findOne(codeDocId)
          expect(updatedCodeDoc.registeredUsers).to.include(userId)
        })
      })

      describe(CodeInvitation.methods.forceExpire.name, function () {
        it('throws if the targeted doc is not owned', function () {
          stubUser(user, userId, [UserUtils.roles.teacher], user.institution)
          const createDoc = {
            role: UserUtils.roles.student,
            maxUsers: 1,
            expires: 1,
            institution: user.institution,
            code: Random.id(4),
            classId
          }

          const codeDocId = CodeCollection.insert(createDoc)
          const codeDoc = CodeCollection.findOne(codeDocId)
          expect(codeDoc.createdAt).to.equal(undefined)
          expect(() => forceExpire(codeDoc)).to.throw('permissionDenied')
        })
        it('throws if the targeted doc does not exists', function () {
          stubUser(user, userId, [UserUtils.roles.admin], user.institution)
          expect(() => forceExpire({ _id: Random.id() })).to.throw('docNotFound')
        })
        it('invalidates a doc', function () {
          stubUser(user, userId, [UserUtils.roles.admin], user.institution)

          const createDoc = {
            role: UserUtils.roles.teacher,
            maxUsers: 1,
            expires: 1,
            institution: user.institution,
            createdBy: userId,
            code: Random.id(4),
            classId
          }

          const codeDocId = CodeCollection.insert(createDoc)
          const codeDoc = CodeCollection.findOne(codeDocId)
          expect(codeDoc.invalid).to.equal(false)

          const updated = forceExpire(codeDoc)
          expect(updated).to.equal(1)

          const invalidDoc = CodeCollection.findOne(codeDocId)
          expect(invalidDoc.invalid).to.equal(true)
        })
      })
    })
  })
})
