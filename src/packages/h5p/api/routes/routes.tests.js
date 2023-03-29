/* eslint-env mocha */
import { expect } from 'chai'
import { h5pEditor } from '../../h5p/server/H5PFactory'
import { H5PAjaxEndpoint } from '@lumieducation/h5p-server'
import { H5PContentCollection } from '../../h5p/server/collections/H5PContentCollection'
import { mockRequest, mockResponse } from '../../../tests/helpers/mockHttp'
import { restoreAll, stub } from '../../../tests/helpers/stubUtils'
// endpoint api
import { getAjax } from './getAjax'
import { downloadContent } from './downloadContent'
import { getContentFile } from './getContentFile'
import { getLibraryFile } from './getLibraryFile'
import { getTempFiles } from './getTempFiles'
import { getTheme } from './getTheme'
import { getUserContent } from './getUserContent'
import { postAjax } from './postAjax'
import { postFinishedData } from './postFinishedData'
import { postUserContent } from './postUserContent'
import { saveContent } from '../methods/saveContent'
import { H5PUserContentCollection } from '../../h5p/server/collections/H5PUserContentCollection'
import { H5PFinishedUserDataCollection } from '../../h5p/server/collections/H5PFinishedUserDataCollection'

/**
 * The routes tests are opting for integration with the H5P-Server endpoints
 * using the ajaxEndpoint (important for the editor).
 * However, we will not cover every use-case, since we don't need to
 * re-test the already tested original behaviour but only the integration
 * behaviour:
 * - are errors correctly bubbled-up
 * - are in certain cases errors catched and wrapped as http response
 * - are the correct response codes and headers used
 * - is the response data in the correct format
 *
 * Take a look at mockRequest and mockResponse to see how we test the data
 * of the response object.
 */

describe('routes', function () {
  let ajaxEndpoint

  before(function () {
    stub(H5PContentCollection)
    stub(H5PUserContentCollection)
    stub(H5PFinishedUserDataCollection)
    ajaxEndpoint = new H5PAjaxEndpoint(h5pEditor)
  })

  after(function () {
    restoreAll()
  })

  describe(getAjax.name, function () {
    it('throws on invalid params', async function () {
      const query = {
        action: 'foobar',
        machineName: 'foobar',
        majorVersion: 'foobar',
        minorVersion: 'foobar',
        language: 'de',
        user: {}
      }
      const req = mockRequest({ query })
      const res = mockResponse()
      const fn = getAjax(ajaxEndpoint)
      await expect(fn(req, res))
        .to.be.rejectedWith('malformed-request (error: The only allowed actions at the GET Ajax endpoint are \'content-type-cache\' and \'libraries\'.)')
    })
    it('returns editor data for a given format', async function () {
      const queries = [{
        action: 'libraries',
        machineName: 'H5P.Blanks',
        majorVersion: 1,
        minorVersion: 12,
        language: 'de',
        user: {}
      }, {
        action: 'libraries',
        machineName: 'H5P.Blanks',
        majorVersion: 1,
        minorVersion: 12,
        // should use cookies to load language
        user: {}
      }]

      for (const query of queries) {
        const req = mockRequest({ query })
        const res = mockResponse()
        const fn = getAjax(ajaxEndpoint)
        await fn(req, res)
        const response = await res.getResult()
        const libraryEditorData = JSON.parse(response.write[0])
        // data is huge so we use very little assumptions here
        expect(libraryEditorData.languages).to.be.an('array')
        expect(libraryEditorData.semantics).to.be.an('array')
        expect(response.code).to.equal(200)
        expect(response.headers).to.deep.equal({ 'Content-Type': 'application/json' })
      }
    })
  })
  describe(postAjax.name, function () {
    it('correctly bubbles-up errors, thrown by the ajaxEndpoint', async function () {
      const query = { action: 'foobar' }
      const req = mockRequest({ query })
      const res = mockResponse()
      const fn = postAjax(ajaxEndpoint)
      await expect(fn(req, res))
        .to.be.rejectedWith('malformed-request (error: This action is not implemented in h5p-nodejs-library.)')
    })
    it('posts editor content to the endpoint', async function () {
      const query = { action: 'translations', language: 'de' }
      const body = { libraries: ['H5P.Blanks 1.12'] }
      const req = mockRequest({ query, body })
      const res = mockResponse()
      const fn = postAjax(ajaxEndpoint)
      await fn(req, res)
      const result = await res.getResult()
      expect(result.code).to.equal(200)
      expect(result.headers).to.deep.equal({ 'Content-Type': 'application/json' })
      const translations = JSON.parse(result.write[0])
      expect(JSON.parse(translations.data['H5P.Blanks 1.12'])).to.be.an('object')
      expect(translations.success).to.equal(true)
    })
    it('handles file upload')
  })
  describe(downloadContent.name, function () {
    it('throws if there is no content by given contentId', async function () {
      const params = { contentId: 'foobar' }
      const req = mockRequest({ params })
      const res = mockResponse()
      const fn = downloadContent(ajaxEndpoint)
      await expect(fn(req, res))
        .to.be.rejectedWith('download-content-not-found (contentId: foobar)')
    })
    it('returns the content as buffer', async function () {
      const metadata = {
        license: 'U',
        authors: [],
        changes: [],
        extraTitle: 'testtitle',
        title: 'testtitle'
      }
      const library = 'H5P.Blanks 1.12'
      const saved = await saveContent({ params: { test: 'params' }, metadata, library, contentId: null })
      const { contentId } = saved
      const params = { contentId }
      const req = mockRequest({ params })
      const res = mockResponse()
      const fn = downloadContent(ajaxEndpoint)
      await fn(req, res)
      const data = await res.getResult()
      expect(data.code).to.equal(200)
      expect(data.headers).to.deep.equal({ 'Content-disposition': `attachment; filename=${contentId}.h5p` })

      // the download should have written a buffer into our response
      const buffer = data.write[0]
      expect(buffer).to.be.instanceof(Buffer)
      expect(buffer.length).to.be.above(0)
    })
  })
  describe(getContentFile.name, function () {
    it('is not implemented')
  })
  describe(getLibraryFile.name, function () {
    it('is not implemented')
  })
  describe(getTempFiles.name, function () {
    it('is not implemented')
  })
  describe(getTheme.name, function () {
    it('is not yet implemented', async function () {
      const req = mockRequest({ })
      const res = mockResponse()
      const fn = getTheme()
      await expect(fn(req, res)).to.be.rejectedWith('h5pEditor.renderTheme is not a function')
    })
  })
  describe(getUserContent.name, function () {
    it('returns a false-success response if no content has been found', async function () {
      const params = {}
      const req = mockRequest({ params })
      const res = mockResponse()
      const fn = getUserContent()
      await fn(req, res)
      const result = await res.getResult()
      expect(result.code).to.eql(404)
      const contentType = { 'Content-Type': 'application/json' }
      expect(result.headers).to.deep.eql(contentType)
      expect(result.end[0]).to.equal(JSON.stringify({ data: undefined, success: false }))
    })
    it('returns a success response with the sate, if such content exists', async function () {
      // first, create some fake content
      const metadata = {
        license: 'U',
        authors: [],
        changes: [],
        extraTitle: 'testtitle',
        title: 'testtitle'
      }
      const library = 'H5P.Blanks 1.12'
      const saved = await saveContent({ params: { test: 'params' }, metadata, library, contentId: null })
      const { contentId } = saved

      // second insert some user content
      const user = { _id: 'foobaruser' }
      const userContentDoc = {
        contentId,
        userId: user._id,
        dataType: 'string',
        subContentId: 'sub',
        userState: 'userStateXOXOXO',
        preload: true,
        invalidate: false
      }
      const _id = await H5PUserContentCollection.insert(userContentDoc)

      // do the request
      const params = { contentId, dataType: userContentDoc.dataType, subContentId: userContentDoc.subContentId }
      const req = mockRequest({ user, params })
      const res = mockResponse()
      const fn = await getUserContent()
      await fn(req, res)
      const result = await res.getResult()

      // evaluate result
      expect(result.code).to.eql(200)
      const contentType = { 'Content-Type': 'application/json' }
      expect(result.headers).to.deep.eql(contentType)
      const expectedData = { _id, ...userContentDoc }
      expect(JSON.parse(result.end[0])).to.deep.equal({ data: expectedData, success: true })
    })
  })
  describe(postUserContent.name, function () {
    it('updates the user content', async function () {
      // first, create some fake content
      const metadata = {
        license: 'U',
        authors: [],
        changes: [],
        extraTitle: 'testtitle',
        title: 'testtitle'
      }
      const library = 'H5P.Blanks 1.12'
      const saved = await saveContent({ params: { test: 'params' }, metadata, library, contentId: null })
      const { contentId } = saved

      // update the db
      const user = { _id: 'foobaruser' }
      const params = { contentId, dataType: 'string', subContentId: 'sub' }
      const bodies = [
        {
          data: 'usrcontentXOXOXOX',
          invalidate: 1,
          preload: 1
        },
        {
          data: 'usrcontentXOXOXOX',
          invalidate: '1',
          preload: '1'
        }
      ]

      const expectedDoc = {
        contentId,
        dataType: 'string',
        subContentId: 'sub',
        preload: true,
        invalidate: true,
        userState: 'usrcontentXOXOXOX',
        userId: user._id
      }

      for (const body of bodies) {
        const req = mockRequest({ user, params, body })
        const res = mockResponse()
        const fn = await postUserContent()
        await fn(req, res)
        const result = await res.getResult()
        expect(result.code).to.equal(200)
        expect(result.write.length).to.equal(0)
        expect(result.end.length).to.equal(0)
        const { _id, ...doc } = H5PUserContentCollection.findOne({ contentId, userId: user._id })
        expect(doc).to.deep.equal(expectedDoc)
      }
    })
  })
  describe(postFinishedData.name, function () {
    it('returns a 403 response if the feature is disabled', async function () {
      h5pEditor.config.setFinishedEnabled = false
      const req = mockRequest({})
      const res = mockResponse()
      const fn = await postFinishedData()
      await fn(req, res)
      const result = await res.getResult()
      expect(result.code).to.equal(403)
      expect(result.write.length).to.equal(0)
      expect(result.end.length).to.equal(0)
    })
    it('fails silently if data is insufficient', async function () {
      h5pEditor.config.setFinishedEnabled = true
      const body = {}
      const req = mockRequest({ body })
      const res = mockResponse()
      const fn = await postFinishedData()
      await fn(req, res)
      const result = await res.getResult()
      expect(result.code).to.equal(200)
      expect(result.headers).to.deep.equal({ 'Content-Type': 'application/json' })
      expect(result.write[0]).to.equal(JSON.stringify({ data: undefined, success: false }))
      expect(result.end.length).to.equal(0)
      expect(H5PFinishedUserDataCollection.find().count()).to.equal(0)
    })
    it('fails silently if data is missing', async function () {
      h5pEditor.config.setFinishedEnabled = true
      const opened = Math.round(new Date().getTime() / 1000)
      const finished = opened + 15 // 15 seconds
      const body = {
        opened: opened.toString(10),
        finished: finished.toString(10),
        score: '1',
        maxScore: '1'
      }
      const req = mockRequest({ body })
      const res = mockResponse()
      const fn = await postFinishedData()
      await fn(req, res)
      const result = await res.getResult()
      expect(result.code).to.equal(200)
      expect(result.headers).to.deep.equal({ 'Content-Type': 'application/json' })
      expect(result.write[0]).to.equal(JSON.stringify({ data: undefined, success: false }))
      expect(result.end.length).to.equal(0)
      expect(H5PFinishedUserDataCollection.find().count()).to.equal(0)
    })
    it('returns an opaque success response if successfully updated', async function () {
      // first, create some fake content
      const metadata = {
        license: 'U',
        authors: [],
        changes: [],
        extraTitle: 'testtitle',
        title: 'testtitle'
      }
      const library = 'H5P.Blanks 1.12'
      const saved = await saveContent({ params: { test: 'params' }, metadata, library, contentId: null })
      const { contentId } = saved
      const user = { _id: 'foobaruser' }

      // then send the data
      h5pEditor.config.setFinishedEnabled = true
      // the client sends time in seconds so internally we convert it back to ms
      const opened = Math.round(new Date().getTime() / 1000)
      const finished = opened + 15 // 15 seconds
      const body = {
        opened: opened.toString(10),
        finished: finished.toString(10),
        score: '1',
        maxScore: '1',
        contentId: contentId
      }
      const req = mockRequest({ user, body })
      const res = mockResponse()
      const fn = await postFinishedData()
      await fn(req, res)
      const result = await res.getResult()
      expect(result.code).to.equal(200)
      expect(result.headers).to.deep.equal({ 'Content-Type': 'application/json' })
      expect(result.write[0]).to.equal(JSON.stringify({ data: undefined, success: true }))
      expect(result.end.length).to.equal(0)

      const { _id, ...resultDoc } = H5PFinishedUserDataCollection.findOne()
      expect(resultDoc).to.deep.equal({
        completionTime: 15000,
        contentId,
        finishedTimestamp: (finished * 1000),
        openedTimestamp: (opened * 1000),
        maxScore: 1,
        score: 1,
        userId: user._id
      })
    })
  })
})
