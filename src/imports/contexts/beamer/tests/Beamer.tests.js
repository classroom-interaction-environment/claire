/* global describe it beforeEach afterEach */
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { Beamer } from '../Beamer'
import { Users } from '../../system/accounts/users/User'
import { isContext } from '../../../../tests/testutils/isContext'
import { onServerExec } from '../../../api/utils/archUtils'
import {
  clearCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../tests/testutils/mockCollection'
import { stubUser, unstubUser } from '../../../../tests/testutils/stubUser'
import { exampleUser } from '../../../../tests/testutils/exampleUser'
import { DocNotFoundError } from '../../../api/errors/types/DocNotFoundError'
import { expectThrow } from '../../../../tests/testutils/expectThrow'
import { PermissionDeniedError } from '../../../api/errors/types/PermissionDeniedError'

describe('Beamer', () => {
  let user
  let userId
  let environment
  let BeamerCollection

  before(() => {
    [BeamerCollection] = mockCollections([Beamer, { noSchema: true, override: true }], Users)
  })

  beforeEach(async () => {
    user = exampleUser()
    userId = user._id
    environment = { userId }
    await stubUser(user)
  })

  afterEach(async () => {
    await clearCollections(Beamer)
    await clearCollections(Users)
    await unstubUser(user, userId)
  })

  after(async () => {
    await restoreAllCollections()
  })

  it('is a context', () => {
    isContext(Beamer)
  })

  it('has the required Beamer properties', () => {
    expect(Beamer.noDefaultSchema).to.be.a('boolean')
    expect(Beamer.ui).to.be.a('object')
  })

  // SERVER_SIDE_ONLY TESTS

  onServerExec(() => {
    const getDoc = _id => BeamerCollection.findOneAsync(_id)
    const createDoc = async (env) => {
      const beamerDocId = await Beamer.methods.insert.run.call(env)
      return getDoc(beamerDocId)
    }


    describe('methods', () => {
      describe(Beamer.methods.insert.name, () => {
        it('has a run function', () => {
          expect(Beamer.methods.insert.run).to.be.a('function')
        })
        it('creates a new beamerDoc if none exists', async () => {
          const beamerDoc = await createDoc(environment)
          expect(beamerDoc.createdBy).to.equal(userId)
        })
        it('assigns default values on a newly created doc', async () => {
          const beamerDoc = await createDoc(environment)
          expect(beamerDoc.ui).to.deep.equal({ background: 'light', grid: 'rows' })
          expect(beamerDoc.references).to.deep.equal([])
        })
        it('throws if a doc exists for the current user', async () => {
          await createDoc(environment)
          await expectThrow({
            fn: () => createDoc(environment),
            name: PermissionDeniedError.name,
            reason: 'errors.docAlreadyExists'
          })
        })
      })

      describe(Beamer.methods.update.name, () => {
        const updateBeamer = Beamer.methods.update.run
        it('has a run function', () => {
          expect(updateBeamer).to.be.a('function')
        })
        it('updates a given beamer doc by _id with values from the update doc', async () => {
          const beamerDoc = await createDoc(environment)
          const originalDoc = Object.assign({}, beamerDoc)
          expect(beamerDoc.headline).to.be.an('undefined')

          // create update doc
          beamerDoc.headline = Random.id()

          // before update
          const docId = beamerDoc._id
          expect(await getDoc(docId)).to.not.deep.equal(beamerDoc)
          expect(await getDoc(docId)).to.deep.equal(originalDoc)

          // after update
          await updateBeamer.call(environment, beamerDoc)
          expect(await getDoc(docId)).to.deep.equal(beamerDoc)
          expect(await getDoc(docId)).to.not.deep.equal(originalDoc)
        })
        it('throws if no doc is found by _id', async () => {
          const _id = Random.id()
          await expectThrow({
            fn: () => updateBeamer({ _id }),
            error: DocNotFoundError.name,
            reason: 'beamer.noDocument',
            data: { _id: Random.id() }
          })
        })

        it('throws on attempted update on other users docs', async () => {
          const beamerDoc = await createDoc(environment)
          const _id = beamerDoc._id
          const userId = Random.id()
          await expectThrow({
            fn: () => updateBeamer.call({ userId }, { _id, headline: Random.id() }),
            error: PermissionDeniedError.name,
            reason: 'beamer.notOwner',
            details: { _id, userId }
          })
        })
      })
    })

    describe(Beamer.publicatins.my.name, () => {
      it('returns only the beamer doc for the current user', async () => {
        const beamerDoc = await createDoc(environment)
        const publicationCursor = Beamer.publicatins.my.run.call(environment)
        const publishedDocs = await publicationCursor.fetchAsync()

        expect(publishedDocs).to.have.lengthOf(1)
        expect(publishedDocs[0]).to.deep.equal(beamerDoc)
      })
    });
  })

  // CLIENT_SIDE_ONLY TESTS

  // onClientExec(() => {
  //   const createDoc = async (env) => {
  //     const ui = {
  //       background: Beamer.defaultBackground,
  //       grid: Beamer.defaultGridlayout
  //     }
  //     const beamerDocId = await BeamerCollection.insertAsync({ createdBy: env.userId, references: [], ui })
  //     return BeamerCollection.findOneAsync(beamerDocId)
  //   }
  //
  //   const updateHandler = function (updateDoc) {
  //     const _id = updateDoc._id
  //     const modifier = Object.assign({}, updateDoc)
  //     delete modifier._id
  //     return BeamerCollection.update(_id, { $set: modifier })
  //   }
    //
    // describe('doc', () => {
    //   it('isDefined', () => {
    //     expect(Beamer.doc).to.be.a('object')
    //   })
    //
    //   describe('ready', () => {
    //     it('is false by default', () => {
    //       expect(Beamer.doc.ready()).to.equal(false)
    //     })
    //
    //     it('is true, once the auto-subscription has been completed', () => {
    //       Beamer.doc.ready(true)
    //       expect(Beamer.doc.ready()).to.equal(true)
    //       Beamer.doc.ready(false)
    //       expect(Beamer.doc.ready()).to.equal(false)
    //     })
    //   })
    //
    //   describe('get', () => {
    //     it('returns undefined if no doc exists or no subscription has been completed yer', () => {
    //       expect(Beamer.doc.get()).to.be.an('undefined')
    //     })
    //     it('returns the current beamer doc', async () => {
    //       const expectedBeamerDoc = await createDoc(environment)
    //       expect(Beamer.doc.get()).to.deep.equal(expectedBeamerDoc)
    //     })
    //   })
    //
    //   describe('background', () => {
    //     beforeEach(() => {
    //       stubMethod(Beamer.methods.update.name, updateHandler)
    //     })
    //
    //     afterEach(() => {
    //       unstubMethod(Beamer.methods.update.name)
    //     })
    //
    //     it('returns the current background color if no value is given', () => {
    //       createDoc(environment)
    //       const defaultBg = Beamer.ui.backgroundColors[Beamer.defaultBackground]
    //       expect(Beamer.doc.background()).to.deep.equal(defaultBg)
    //     })
    //
    //     it('throws on wrong values', () => {
    //       assert.throws(() => {
    //         createDoc(environment)
    //         Beamer.doc.background(Beamer.ui.backgroundColors.dark)
    //       })
    //     })
    //
    //     it('updates the current background color if a value is given', function (done) {
    //       createDoc(environment)
    //       const expectedColor = Beamer.ui.backgroundColors.dark
    //
    //       // after update
    //       Beamer.doc.background(Beamer.ui.backgroundColors.dark.value, (err, color) => {
    //         if (err) {
    //           console.error(err)
    //           return done(err)
    //         }
    //
    //         const actualColor = Beamer.doc.background()
    //         expect(color).to.equal(expectedColor.value, 'values not equal')
    //         expect(actualColor).to.deep.equal(expectedColor, 'method result and color unequal')
    //         done()
    //       })
    //     })
    //   })
    //
    //   describe('grid', () => {
    //     beforeEach(() => {
    //       stubMethod(Beamer.methods.update.name, updateHandler)
    //     })
    //
    //     afterEach(() => {
    //       unstubMethod(Beamer.methods.update.name)
    //     })
    //     it('returns the default grid if no beamer doc is available yet', () => {
    //       const defaultGrid = Beamer.ui.gridLayouts[Beamer.defaultGridlayout]
    //       expect(Beamer.doc.grid()).to.deep.equal(defaultGrid)
    //     })
    //     it('updates the current background color if a value is given', function (done) {
    //       createDoc(environment)
    //       const expectedLayout = Beamer.ui.gridLayouts.cols3
    //
    //       // after update
    //       Beamer.doc.grid(Beamer.ui.gridLayouts.cols3.value, (err, layout) => {
    //         if (err) {
    //           console.error(err)
    //           return done(err)
    //         }
    //
    //         const actualLayout = Beamer.doc.grid()
    //         expect(layout).to.equal(expectedLayout.value, 'values not equal')
    //         expect(actualLayout).to.deep.equal(expectedLayout, 'method result and layout unequal')
    //         done()
    //       })
    //     })
    //   })
    //
    //   describe('code', () => {
    //     beforeEach(() => {
    //       stubMethod(Beamer.methods.update.name, updateHandler)
    //     })
    //
    //     afterEach(() => {
    //       unstubMethod(Beamer.methods.update.name)
    //     })
    //
    //     it('updates a current invitation code if a value is given', function (done) {
    //       createDoc(environment)
    //       const code = Random.id()
    //       Beamer.doc.code(code, (err) => {
    //         if (err) return done(err)
    //         expect(Beamer.doc.get().invitationCode).to.equal(code)
    //         done()
    //       })
    //     })
    //
    //     it('returns the current code if no value is given', function (done) {
    //       createDoc(environment)
    //       expect(Beamer.doc.code()).to.be.an('undefined')
    //
    //       const code = Random.id()
    //       Beamer.doc.code(code, (err) => {
    //         if (err) return done(err)
    //         expect(Beamer.doc.code()).to.equal(code)
    //         done()
    //       })
    //     })
    //   })
    //
    //   describe('material', () => {
    //     let reference
    //
    //     beforeEach(() => {
    //       reference = {
    //         lessonId: Random.id(),
    //         referenceId: Random.id(),
    //         context: Random.id(),
    //         itemId: Random.id()
    //       }
    //       stubMethod(Beamer.methods.update.name, updateHandler)
    //     })
    //
    //     afterEach(() => {
    //       unstubMethod(Beamer.methods.update.name)
    //     })
    //
    //     it('adds a material reference, if not present', async () => {
    //       await createDoc(environment)
    //       expect(Beamer.doc.get().references).to.deep.equal([])
    //       await Beamer.doc.material(reference)
    //       expect(Beamer.doc.get().references).to.deep.equal([reference])
    //     })
    //     it('removes a material reference, if already present', async () => {
    //       await createDoc(environment)
    //       expect(Beamer.doc.get().references).to.deep.equal([])
    //       await Beamer.doc.material(reference)
    //       await Beamer.doc.material(reference)
    //       expect(Beamer.doc.get().references).to.deep.equal([])
    //     })
    //   })
    //
    //   describe('has', () => {
    //     let reference
    //
    //     beforeEach(() => {
    //       reference = {
    //         lessonId: Random.id(),
    //         referenceId: Random.id(),
    //         context: Random.id(),
    //         itemId: Random.id()
    //       }
    //       stubMethod(Beamer.methods.update.name, updateHandler)
    //     })
    //
    //     afterEach(() => {
    //       unstubMethod(Beamer.methods.update.name)
    //     })
    //
    //     it('returns a reference by referenceId if found', function (done) {
    //       createDoc(environment)
    //       Beamer.doc.update({ references: [reference] }, () => {
    //         const searchedRef = Beamer.doc.has(reference)
    //         expect(searchedRef).to.deep.equal(reference)
    //         done()
    //       })
    //     })
    //     it('returns null for a reference by referenceId if not found', () => {
    //       createDoc(environment)
    //       const searchedRef = Beamer.doc.has(reference)
    //       expect(searchedRef).to.equal(null)
    //     })
    //   })
    // })
    //
    // describe('actions (window)', () => {
    //   beforeEach(() => {
    //     Beamer.actions.debug(true)
    //     stubMethod(Beamer.methods.update.name, updateHandler)
    //   })
    //
    //   afterEach(() => {
    //     Beamer.actions.unload()
    //     Beamer.actions.debug(false)
    //     unstubMethod(Beamer.methods.update.name)
    //   })
    //
    //   describe('init', () => {
    //     it('opens a new window and saves its id and url', function (done) {
    //       createDoc(environment)
    //       const pathId = `/${Random.id()}`
    //       const windowRef = Beamer.actions.init(pathId)
    //       assert.isDefined(windowRef.ref)
    //       assert.isDefined(windowRef.id)
    //
    //       assert.equal(Beamer.actions.key(), windowRef.id)
    //       assert.equal(Beamer.actions.url(), pathId)
    //
    //       windowRef.ref.close()
    //
    //       setTimeout(() => {
    //         assert.isNull(Beamer.actions.key())
    //         assert.isNull(Beamer.actions.url())
    //         done()
    //       }, 1500)
    //     })
    //     it('returns a timerId to a running timer', () => {
    //       createDoc(environment)
    //       const pathId = `/${Random.id()}`
    //       const windowRef = Beamer.actions.init(pathId)
    //       assert.isDefined(Beamer.actions.timerId())
    //       windowRef.ref.close()
    //     })
    //     it('cancels the timer if the window closes and unloads id and url', function (done) {
    //       createDoc(environment)
    //       const pathId = `/${Random.id()}`
    //       const windowRef = Beamer.actions.init(pathId)
    //       windowRef.ref.close()
    //
    //       setTimeout(() => {
    //         assert.isUndefined(Beamer.actions.timerId())
    //         done()
    //       }, 500)
    //     })
    //   })
    //   describe('open', () => {
    //     it('opens a new window at a given location', () => {
    //       createDoc(environment)
    //       const pathId = `/${Random.id()}`
    //       const windowRef = Beamer.actions.open(pathId)
    //       assert.isDefined(windowRef.ref)
    //       assert.isDefined(windowRef.id)
    //       windowRef.ref.close()
    //     })
    //   })
    //
    //   describe('unload', () => {
    //     it('unloads everything', async () => {
    //       await createDoc(environment)
    //       const pathId = `/${Random.id()}`
    //       const windowRef = Beamer.actions.init(pathId)
    //       assert.isDefined(windowRef.ref)
    //       assert.isDefined(windowRef.id)
    //
    //       assert.equal(Beamer.actions.key(), windowRef.id)
    //       assert.equal(Beamer.actions.url(), pathId)
    //
    //       const promise = new Promise((resolve, reject) => {
    //         Beamer.actions.unload((err, res) => {
    //           if (err) {
    //             reject(err)
    //           } else {
    //             resolve(res)
    //           }
    //         })
    //       })
    //       await promise
    //       assert.isNull(Beamer.actions.key())
    //       assert.isNull(Beamer.actions.url())
    //     })
    //   })
    // })
  // })
})
