/* global describe it beforeEach afterEach */
import { Random } from 'meteor/random'
import { SchoolClass } from '../SchoolClass'
import { Lesson } from '../../lessons/Lesson'
import { mockCollection } from '../../../../../tests/testutils/mockCollection'
import { DocNotFoundError } from '../../../../api/errors/types/DocNotFoundError'
import { InvocationChecker } from '../../../../api/utils/InvocationChecker'
import { onServerExec } from '../../../../api/utils/archUtils'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
import { restoreAll, stub } from '../../../../../tests/testutils/stub'
import { stubMethod, unstubMethod } from '../../../../../tests/testutils/stubMethod'
import { expect } from 'chai'

const SchoolClassCollection = mockCollection(SchoolClass)
const LessonCollection = mockCollection(Lesson)

const { isStudent } = SchoolClass.helpers
const { isTeacher } = SchoolClass.helpers
const { isMember } = SchoolClass.helpers
const { addStudent } = SchoolClass.helpers
const { removeStudent } = SchoolClass.helpers

describe(SchoolClass.name, function () {
  afterEach(function () {
    SchoolClassCollection.remove({})
    LessonCollection.remove({})
    restoreAll()
  })

  describe('helpers', function () {
    describe(SchoolClass.helpers.isStudent.name, function () {
      it('throws if no classdoc is given', function () {
        expect(() => isStudent()).to.throw(DocNotFoundError.name)
      })
      it('returns true if the given user is a student of the class', function () {
        const userId = Random.id()
        const classDoc = { students: [userId] }
        expect(isStudent({ classDoc, userId })).to.equal(true)
      })
      it('returns false if the given user is not a student of the class', function () {
        const classDoc = { students: [Random.id()] }
        expect(isStudent({ classDoc, userId: Random.id() })).to.equal(false)
      })
    })
    describe(SchoolClass.helpers.isTeacher.name, function () {
      it('throws if no classdoc is given', function () {
        expect(() => isTeacher()).to.throw(DocNotFoundError.name, 'classDoc')
      })
      it('returns true if the given user is a teacher of the class', function () {
        const userId = Random.id()
        const classDoc = { teachers: [userId] }
        expect(isTeacher({ classDoc, userId })).to.equal(true)
      })
      it('returns true if the given user is creator of the class', function () {
        const userId = Random.id()
        const classDoc = { teachers: [], createdBy: userId }
        expect(isTeacher({ classDoc, userId })).to.equal(true)
      })
      it('returns false if the given user is not a teacher and not a creator of the class ', function () {
        const classDoc = { students: [], teachers: [Random.id()] }
        expect(isTeacher({ classDoc, userId: Random.id() })).to.equal(false)
      })
    })

    describe(SchoolClass.helpers.isMember.name, function () {
      it('throws if no classdoc is given', function () {
        expect(() => isMember()).to.throw(DocNotFoundError.name, 'classDoc')
      })
      it('returns true if the given user is a teacher of the class', function () {
        const userId = Random.id()
        const classDoc = { teachers: [userId] }
        expect(isMember({ classDoc, userId })).to.equal(true)
      })
      it('returns true if the given user is student of the class', function () {
        const userId = Random.id()
        const classDoc = { teachers: [], students: [userId] }
        expect(isMember({ classDoc, userId })).to.equal(true)
      })
      it('returns false otherwise', function () {
        const classDoc = { students: [Random.id()], teachers: [Random.id()] }
        expect(isMember({ classDoc, userId: Random.id() })).to.equal(false)
      })
    })

    onServerExec(function () {
      describe(SchoolClass.helpers.addStudent.name, function () {
        it('throws if no classdoc is found', function () {
          const addDoc = { userId: Random.id(), classId: Random.id() }
          stub(InvocationChecker, InvocationChecker.ensureMethodInvocation.name, () => undefined)
          expect(() => addStudent(addDoc)).to.throw(DocNotFoundError.name)
        })
        it('throws if not invoked within a Meteor.method', function () {
          const addDoc = { userId: Random.id(), classId: Random.id() }
          expect(() => addStudent(addDoc)).to.throw(InvocationChecker.NotInMethodError.name)
        })
        it('throws if the current user is not a teacher', function () {
          const classDoc = { _id: Random.id(), title: Random.id(), createdBy: Random.id(), teachers: [], students: [] }
          const classId = SchoolClassCollection.insert(classDoc)
          const userId = Random.id()
          stub(InvocationChecker, InvocationChecker.ensureMethodInvocation.name, () => undefined)
          expect(() => addStudent.call({ userId }, {
            classId,
            userId
          })).to.throw(PermissionDeniedError.name, SchoolClass.errors.notTeacher)
        })
        it('throws if the user to be added is already member of the class', function () {
          const userId = Random.id()
          const studentId = Random.id()
          const classDoc = {
            _id: Random.id(),
            title: Random.id(),
            createdBy: userId,
            teachers: [],
            students: [studentId]
          }
          const classId = SchoolClassCollection.insert(classDoc)
          stub(InvocationChecker, InvocationChecker.ensureMethodInvocation.name, () => undefined)
          expect(() => addStudent.call({ userId }, {
            classId,
            userId: studentId
          })).to.throw(PermissionDeniedError.name, SchoolClass.errors.alreadyMember)
        })
        it('adds the user as student to the class', function () {
          const userId = Random.id()
          const studentId = Random.id()
          const classDoc = { _id: Random.id(), title: Random.id(), createdBy: userId, teachers: [], students: [] }
          const classId = SchoolClassCollection.insert(classDoc)
          const beforeAdd = SchoolClassCollection.findOne(classId)

          stub(InvocationChecker, InvocationChecker.ensureMethodInvocation.name, () => undefined)
          addStudent.call({ userId }, { classId, userId: studentId })

          const updatedClass = SchoolClassCollection.findOne(classId)
          expect(updatedClass).to.not.deep.equal(beforeAdd)
          expect(updatedClass.students).to.deep.equal([studentId])
        })
      })
      describe(SchoolClass.helpers.removeStudent.name, function () {
        it('throws if no classdoc is found', function () {
          stub(InvocationChecker, InvocationChecker.ensureMethodInvocation.name, () => undefined)
          const removeDoc = { userId: Random.id(), classId: Random.id() }
          expect(() => removeStudent(removeDoc)).to.throw(DocNotFoundError.name)
        })
        it('throws if not invoked within a Meteor.method', function () {
          const removeDoc = { userId: Random.id(), classId: Random.id() }
          expect(() => removeStudent(removeDoc)).to.throw(InvocationChecker.NotInMethodError.name)
        })
        it('throws if the current user is not a teacher', function () {
          const classDoc = { _id: Random.id(), title: Random.id(), createdBy: Random.id(), teachers: [], students: [] }
          const classId = SchoolClassCollection.insert(classDoc)
          const userId = Random.id()
          stub(InvocationChecker, InvocationChecker.ensureMethodInvocation.name, () => undefined)
          expect(() => removeStudent.call({ userId }, {
            classId,
            userId
          })).to.throw(PermissionDeniedError.name, SchoolClass.errors.notTeacher)
        })
        it('throws if the user to be added is NOT member of the class', function () {
          const userId = Random.id()
          const studentId = Random.id()
          const classDoc = { _id: Random.id(), title: Random.id(), createdBy: userId, teachers: [], students: [] }
          const classId = SchoolClassCollection.insert(classDoc)
          stub(InvocationChecker, InvocationChecker.ensureMethodInvocation.name, () => undefined)
          expect(() => removeStudent.call({ userId }, {
            classId,
            userId: studentId
          })).to.throw(PermissionDeniedError.name, SchoolClass.errors.notMember)
        })
        it('removes the student from the class', function () {
          const userId = Random.id()
          const studentId = Random.id()
          const classDoc = {
            _id: Random.id(),
            title: Random.id(),
            createdBy: userId,
            teachers: [],
            students: [studentId]
          }
          const classId = SchoolClassCollection.insert(classDoc)
          const beforeAdd = SchoolClassCollection.findOne(classId)

          stub(InvocationChecker, InvocationChecker.ensureMethodInvocation.name, () => undefined)
          removeStudent.call({ userId }, { classId, userId: studentId })

          const updatedClass = SchoolClassCollection.findOne(classId)
          expect(updatedClass).to.not.deep.equal(beforeAdd)
          expect(updatedClass.students).to.deep.equal([])
        })
      })
    })
  })

  onServerExec(function () {
    describe('methods', function () {
      const create = SchoolClass.methods.create.run
      const remove = SchoolClass.methods.remove.run

      describe(SchoolClass.methods.create.name, function () {
        it('creates a new school class doc', function () {
          const classDocDef = { title: Random.id(), students: [Random.id()], teachers: [Random.id()] }
          const environment = { userId: Random.id() }
          const classDocId = create.call(environment, Object.assign({}, classDocDef))
          const classDoc = SchoolClassCollection.findOne(classDocId)
          expect(classDoc.title).to.equal(classDocDef.title)
          expect(classDoc.title).to.equal(classDocDef.title)
          expect(classDoc.students).to.deep.equal(classDocDef.students)
          expect(classDoc.teachers).to.deep.equal(classDocDef.teachers.concat([environment.userId]))
        })
      })
      describe(SchoolClass.methods.remove.name, function () {
        beforeEach(function () {
          stubMethod(Lesson.methods.remove.name, function ({ _id }) {
            return LessonCollection.remove(_id)
          })
        })

        afterEach(function () {
          unstubMethod(Lesson.methods.remove.name)
        })

        it('throws if the classDoc is not found', function () {
          expect(() => remove({ _id: Random.id() })).to.throw(DocNotFoundError.name)
        })
        it('removes the class (and only this class) by given _id', function () {
          const userId = Random.id()
          const classDoc = { title: Random.id(), createdBy: userId, teachers: [], students: [] }
          const classId = SchoolClassCollection.insert(classDoc)
          const otherClassId = SchoolClassCollection.insert(classDoc)

          remove.call({ userId }, { _id: classId })
          expect(SchoolClassCollection.find(classId).count()).to.equal(0)
          expect(SchoolClassCollection.find(otherClassId).count()).to.equal(1)
        })
        it('removes all lessons of this (and only this) class', function () {
          const userId = Random.id()

          // create class
          const classDoc = { title: Random.id(), createdBy: userId, teachers: [], students: [] }
          const classId = SchoolClassCollection.insert(classDoc)
          const otherClassId = SchoolClassCollection.insert(classDoc)

          // create lesson
          let lessons = []
          lessons.length = Math.floor(1 + Math.random() * 10)
          lessons.fill(0)
          lessons = lessons.map(() => LessonCollection.insert({ classId, title: Random.id(), createdBy: userId }))

          // create other lessons
          let otherLessons = []
          otherLessons.length = Math.floor(1 + Math.random() * 10)
          otherLessons.fill(0)
          otherLessons = otherLessons.map(() => LessonCollection.insert({ classId: otherClassId, title: Random.id(), createdBy: userId }))

          // before
          lessons.forEach(lessonId => expect(LessonCollection.find(lessonId).count()).to.equal(1))
          otherLessons.forEach(lessonId => expect(LessonCollection.find(lessonId).count()).to.equal(1))
          expect(LessonCollection.find({ classId }).count()).to.equal(lessons.length)

          remove.call({ userId }, { _id: classId })

          // after
          expect(LessonCollection.find({ classId }).count()).to.equal(0)
          lessons.forEach(lessonId => expect(LessonCollection.find(lessonId).count()).to.equal(0))
          otherLessons.forEach(lessonId => expect(LessonCollection.find(lessonId).count()).to.equal(1))
        })
      })
    })
  })
})
