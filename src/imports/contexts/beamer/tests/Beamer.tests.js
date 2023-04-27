/* global describe it beforeEach afterEach */
import { Random } from 'meteor/random'
import { assert, expect } from 'chai'
import { Beamer } from '../Beamer'
import { Users } from '../../system/accounts/users/User'
import { isContext } from '../../../../tests/testutils/isContext'
import { onClientExec, onServerExec } from '../../../api/utils/archUtils'
import {
  clearCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../tests/testutils/mockCollection'
import { stubUser, unstubUser } from '../../../../tests/testutils/stubUser'
import { exampleUser } from '../../../../tests/testutils/exampleUser'
import { stubMethod, unstubMethod } from '../../../../tests/testutils/stubMethod'
import { DocNotFoundError } from '../../../api/errors/types/DocNotFoundError'

describe('Beamer', function () {
  let user
  let userId
  let environment
  let BeamerCollection

  before(function () {
    [BeamerCollection] = mockCollections(Beamer, Users)
  })

  beforeEach(function () {
    user = exampleUser()
    userId = user._id
    environment = { userId }
    stubUser(user)
  })

  afterEach(function () {
    clearCollections(Beamer)
    clearCollections(Users)
    unstubUser(user, userId)
  })

  after(function () {
    restoreAllCollections()
  })

  it('is a context', function () {
    isContext(Beamer)
  })

  it('has the required Beamer properties', function () {
    expect(Beamer.noDefaultSchema).to.be.a('boolean')
    expect(Beamer.ui).to.be.a('object')
  })

  // SERVER_SIDE_ONLY TESTS

  onServerExec(function () {
    const createDoc = (env) => {
      const beamerDocId = Beamer.methods.insert.run.call(env)
      return BeamerCollection.findOne(beamerDocId)
    }

    const getDoc = _id => BeamerCollection.findOne(_id)

    describe('methods', function () {
      describe(Beamer.methods.insert.name, function () {
        it('has a run function', function () {
          expect(Beamer.methods.insert.run).to.be.a('function')
        })
        it('creates a new beamerDoc if none exists', function () {
          const beamerDoc = createDoc(environment)
          expect(beamerDoc.createdBy).to.equal(userId)
        })
        it('assigns default values on a newly created doc', function () {
          const beamerDoc = createDoc(environment)
          expect(beamerDoc.ui).to.deep.equal({ background: 'light', grid: 'rows' })
          expect(beamerDoc.references).to.deep.equal([])
        })
        it('throws if a doc exists for the current user', function () {
          createDoc(environment)
          assert.throws(function () {
            createDoc(environment)
          }, 'errors.docAlreadyExists')
        })
      })

      describe(Beamer.methods.update.name, function () {
        it('has a run function', function () {
          expect(Beamer.methods.update.run).to.be.a('function')
        })
        it('updates a given beamer doc by _id with values from the update doc', function () {
          const beamerDoc = createDoc(environment)
          const originalDoc = Object.assign({}, beamerDoc)
          expect(beamerDoc.headline).to.be.an('undefined')

          // create update doc
          beamerDoc.headline = Random.id()

          // before update
          const docId = beamerDoc._id
          expect(getDoc(docId)).to.not.deep.equal(beamerDoc)
          expect(getDoc(docId)).to.deep.equal(originalDoc)

          // after update
          Beamer.methods.update.run.call(environment, beamerDoc)
          expect(getDoc(docId)).to.deep.equal(beamerDoc)
          expect(getDoc(docId)).to.not.deep.equal(originalDoc)
        })
        it('throws if no doc is found by _id', function () {
          assert.throws(function () {
            Beamer.methods.update.run({ _id: Random.id() })
          }, DocNotFoundError.name)
        })

        it('throws on attempted update on other users docs', function () {
          const beamerDoc = createDoc(environment)
          assert.throws(function () {
            Beamer.methods.update.run.call({ userId: Random.id() }, { _id: beamerDoc._id, headline: Random.id() })
          }, 'errors.permissionDenied')
        })
      })
    })
  })

  // CLIENT_SIDE_ONLY TESTS

  onClientExec(function () {
    const createDoc = (env) => {
      const ui = {
        background: Beamer.defaultBackground,
        grid: Beamer.defaultGridlayout
      }
      const beamerDocId = BeamerCollection.insert({ createdBy: env.userId, references: [], ui })
      return BeamerCollection.findOne(beamerDocId)
    }

    const updateHandler = function (updateDoc) {
      const _id = updateDoc._id
      const modifier = Object.assign({}, updateDoc)
      delete modifier._id
      return BeamerCollection.update(_id, { $set: modifier })
    }

    describe('doc', function () {
      it('isDefined', function () {
        expect(Beamer.doc).to.be.a('object')
      })

      describe('ready', function () {
        it('is false by default', function () {
          expect(Beamer.doc.ready()).to.equal(false)
        })

        it('is true, once the auto-subscription has been completed', function () {
          Beamer.doc.ready(true)
          expect(Beamer.doc.ready()).to.equal(true)
        })
      })

      describe('create', function () {
        beforeEach(function () {
          const handler = function () {
            return BeamerCollection.insert({ createdBy: environment.userId, references: [], ui: {} })
          }
          stubMethod(Beamer.methods.insert.name, handler)
        })

        afterEach(function () {
          unstubMethod(Beamer.methods.insert.name)
        })

        it('creates the new beamerdoc', function (done) {
          Beamer.doc.create((err, res) => {
            if (err) {
              console.error(err)
              return done(err)
            }
            if (!res) return done(new Error('unexpected'))
            done()
          })
        })
      })

      describe('get', function () {
        it('returns undefined if no doc exists or no subscription has been completed yer', function () {
          expect(Beamer.doc.get()).to.be.an('undefined')
        })
        it('returns the current beamer doc', function () {
          const expectedBeamerDoc = createDoc(environment)
          expect(Beamer.doc.get()).to.deep.equal(expectedBeamerDoc)
        })
      })

      describe('update', function () {
        beforeEach(function () {
          stubMethod(Beamer.methods.update.name, updateHandler)
        })

        afterEach(function () {
          unstubMethod(Beamer.methods.update.name)
        })

        it('throws if callback is not a function', function () {
          createDoc(environment)

          assert.throws(function () {
            Beamer.doc.update({ headline: Random.id() }, {})
          })

          // does not throw if cb is undefined
          Beamer.doc.update({ headline: Random.id() })
        })

        it('updates the current beamer doc', function (done) {
          const originalBeamerDoc = createDoc(environment)
          const updatedBeamerDoc = Object.assign({}, originalBeamerDoc)
          updatedBeamerDoc.headline = Random.id()

          // before update
          expect(Beamer.doc.get()).to.deep.equal(originalBeamerDoc, 'update 1')
          expect(Beamer.doc.get()).to.not.deep.equal(updatedBeamerDoc, 'update 2')

          // after update
          Beamer.doc.update(updatedBeamerDoc, () => {
            expect(Beamer.doc.get()).to.deep.equal(updatedBeamerDoc, 'update 3')
            expect(Beamer.doc.get()).to.not.deep.equal(originalBeamerDoc, 'update 4')
            done()
          })
        })

        it('auto-assigns to current _id if none has been provieded in the update doc', function (done) {
          const originalBeamerDoc = createDoc(environment)
          const updatedBeamerDoc = Object.assign({}, originalBeamerDoc)
          updatedBeamerDoc.headline = Random.id()
          Beamer.doc.update({ headline: updatedBeamerDoc.headline }, () => {
            expect(Beamer.doc.get()).to.deep.equal(updatedBeamerDoc, 'update 5')
            expect(Beamer.doc.get()).to.not.deep.equal(originalBeamerDoc, 'update 6')
            done()
          })
        })
      })

      describe('background', function () {
        beforeEach(function () {
          stubMethod(Beamer.methods.update.name, updateHandler)
        })

        afterEach(function () {
          unstubMethod(Beamer.methods.update.name)
        })

        it('returns the current background color if no value is given', function () {
          createDoc(environment)
          const defaultBg = Beamer.ui.backgroundColors[Beamer.defaultBackground]
          expect(Beamer.doc.background()).to.deep.equal(defaultBg)
        })

        it('throws on wrong values', function () {
          assert.throws(function () {
            createDoc(environment)
            Beamer.doc.background(Beamer.ui.backgroundColors.dark)
          })
        })

        it('updates the current background color if a value is given', function (done) {
          createDoc(environment)
          const expectedColor = Beamer.ui.backgroundColors.dark

          // after update
          Beamer.doc.background(Beamer.ui.backgroundColors.dark.value, (err, color) => {
            if (err) {
              console.error(err)
              return done(err)
            }

            const actualColor = Beamer.doc.background()
            expect(color).to.equal(expectedColor.value, 'values not equal')
            expect(actualColor).to.deep.equal(expectedColor, 'method result and color unequal')
            done()
          })
        })
      })

      describe('grid', function () {
        beforeEach(function () {
          stubMethod(Beamer.methods.update.name, updateHandler)
        })

        afterEach(function () {
          unstubMethod(Beamer.methods.update.name)
        })
        it('returns the default grid if no beamer doc is available yet', function () {
          const defaultGrid = Beamer.ui.gridLayouts[Beamer.defaultGridlayout]
          expect(Beamer.doc.grid()).to.deep.equal(defaultGrid)
        })
        it('updates the current background color if a value is given', function (done) {
          createDoc(environment)
          const expectedLayout = Beamer.ui.gridLayouts.cols3

          // after update
          Beamer.doc.grid(Beamer.ui.gridLayouts.cols3.value, (err, layout) => {
            if (err) {
              console.error(err)
              return done(err)
            }

            const actualLayout = Beamer.doc.grid()
            expect(layout).to.equal(expectedLayout.value, 'values not equal')
            expect(actualLayout).to.deep.equal(expectedLayout, 'method result and layout unequal')
            done()
          })
        })
      })

      describe('code', function () {
        beforeEach(function () {
          stubMethod(Beamer.methods.update.name, updateHandler)
        })

        afterEach(function () {
          unstubMethod(Beamer.methods.update.name)
        })

        it('updates a current invitation code if a value is given', function (done) {
          createDoc(environment)
          const code = Random.id()
          Beamer.doc.code(code, (err) => {
            if (err) return done(err)
            expect(Beamer.doc.get().invitationCode).to.equal(code)
            done()
          })
        })

        it('returns the current code if no value is given', function (done) {
          createDoc(environment)
          expect(Beamer.doc.code()).to.be.an('undefined')

          const code = Random.id()
          Beamer.doc.code(code, (err) => {
            if (err) return done(err)
            expect(Beamer.doc.code()).to.equal(code)
            done()
          })
        })
      })

      describe('material', function () {
        let reference

        beforeEach(function () {
          reference = {
            lessonId: Random.id(),
            referenceId: Random.id(),
            context: Random.id(),
            itemId: Random.id()
          }
          stubMethod(Beamer.methods.update.name, updateHandler)
        })

        afterEach(function () {
          unstubMethod(Beamer.methods.update.name)
        })

        it('adds a material reference, if not present', function (done) {
          createDoc(environment)
          expect(Beamer.doc.get().references).to.deep.equal([])
          Beamer.doc.material(reference, () => {
            expect(Beamer.doc.get().references).to.deep.equal([reference])
            done()
          })
        })
        it('removes a material reference, if already present', function (done) {
          createDoc(environment)
          expect(Beamer.doc.get().references).to.deep.equal([])
          Beamer.doc.material(reference, () => {
            Beamer.doc.material(reference, () => {
              expect(Beamer.doc.get().references).to.deep.equal([])
              done()
            })
          })
        })
      })

      describe('has', function () {
        let reference

        beforeEach(function () {
          reference = {
            lessonId: Random.id(),
            referenceId: Random.id(),
            context: Random.id(),
            itemId: Random.id()
          }
          stubMethod(Beamer.methods.update.name, updateHandler)
        })

        afterEach(function () {
          unstubMethod(Beamer.methods.update.name)
        })

        it('returns a reference by referenceId if found', function (done) {
          createDoc(environment)
          Beamer.doc.update({ references: [reference] }, () => {
            const searchedRef = Beamer.doc.has(reference)
            expect(searchedRef).to.deep.equal(reference)
            done()
          })
        })
        it('returns null for a reference by referenceId if not found', function () {
          createDoc(environment)
          const searchedRef = Beamer.doc.has(reference)
          expect(searchedRef).to.equal(null)
        })
      })
    })

    describe('actions (window)', function () {
      beforeEach(function () {
        Beamer.actions.debug(true)
        stubMethod(Beamer.methods.update.name, updateHandler)
      })

      afterEach(function () {
        Beamer.actions.unload()
        Beamer.actions.debug(false)
        unstubMethod(Beamer.methods.update.name)
      })

      describe('init', function () {
        it('opens a new window and saves its id and url', function (done) {
          createDoc(environment)
          const pathId = `/${Random.id()}`
          const windowRef = Beamer.actions.init(pathId)
          assert.isDefined(windowRef.ref)
          assert.isDefined(windowRef.id)

          assert.equal(Beamer.actions.key(), windowRef.id)
          assert.equal(Beamer.actions.url(), pathId)

          windowRef.ref.close()

          setTimeout(() => {
            assert.isNull(Beamer.actions.key())
            assert.isNull(Beamer.actions.url())
            done()
          }, 1500)
        })
        it('returns a timerId to a running timer', function () {
          createDoc(environment)
          const pathId = `/${Random.id()}`
          const windowRef = Beamer.actions.init(pathId)
          assert.isDefined(Beamer.actions.timerId())
          windowRef.ref.close()
        })
        it('cancels the timer if the window closes and unloads id and url', function (done) {
          createDoc(environment)
          const pathId = `/${Random.id()}`
          const windowRef = Beamer.actions.init(pathId)
          windowRef.ref.close()

          setTimeout(() => {
            assert.isUndefined(Beamer.actions.timerId())
            done()
          }, 500)
        })
      })
      describe('open', function () {
        it('opens a new window at a given location', function () {
          createDoc(environment)
          const pathId = `/${Random.id()}`
          const windowRef = Beamer.actions.open(pathId)
          assert.isDefined(windowRef.ref)
          assert.isDefined(windowRef.id)
          windowRef.ref.close()
        })
      })

      describe('unload', function () {
        it('unloads everything', function (done) {
          createDoc(environment)
          const pathId = `/${Random.id()}`
          const windowRef = Beamer.actions.init(pathId)
          assert.isDefined(windowRef.ref)
          assert.isDefined(windowRef.id)

          assert.equal(Beamer.actions.key(), windowRef.id)
          assert.equal(Beamer.actions.url(), pathId)

          Beamer.actions.unload(() => {
            assert.isNull(Beamer.actions.key())
            assert.isNull(Beamer.actions.url())
            done()
          })
        })
      })
    })
  })
})
