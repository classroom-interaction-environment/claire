/* eslint-env mocha */
import { deleteContent } from './deleteContent'
import { listContent } from './listContent'
import { loadContentForPlaying } from './loadContentForPlaying'
import { loadContentForEditing } from './loadContentForEditing'
import { saveContent } from './saveContent'
import { restoreAll, stub } from '../../../tests/helpers/stubUtils'
import { expect } from '../../../tests/helpers/chai'
import { H5PContentCollection } from '../../h5p/server/collections/H5PContentCollection'

describe('methods', function () {
  let contentId
  const params = { test: 'params' }

  before(function () {
    stub(H5PContentCollection)
  })

  after(function () {
    restoreAll()
  })

  describe(saveContent.name, function () {
    it('saves content', async () => {
      const metadata = {
        license: 'U',
        authors: [],
        changes: [],
        extraTitle: 'testtitle',
        title: 'testtitle'
      }
      const library = 'H5P.Blanks 1.12'
      const result = await saveContent({ params, metadata, library, contentId: null })

      contentId = result.contentId
      expect(result.contentId).to.be.a('string')
      expect(result.metadata.mainLibrary).to.equal('H5P.Blanks')
    })
    it('updates existing content', async function () {
      const metadata = {
        license: 'U',
        authors: [],
        changes: [],
        extraTitle: 'testtitle',
        title: 'testtitle2'
      }
      const library = 'H5P.Blanks 1.12'
      const result = await saveContent({ params, metadata, library, contentId })

      // contentId = result.contentId
      expect(result.contentId).to.be.a('string')
      expect(result.metadata.mainLibrary).to.equal('H5P.Blanks')
    })
  })
  describe(loadContentForEditing.name, function () {
    it('throws if content id is not a string', () => {
      expect(loadContentForEditing({ contentId: 123, language: 'de' }))
        .to.eventually.be.rejectedWith()
    })

    it('throws if language is not a string', () => {
      expect(loadContentForEditing({ contentId: 'abc', language: 1234 }))
        .to.eventually.be.rejectedWith()
    })

    it('throws if the contentId does not exist', async () => {
      expect(loadContentForEditing({ contentId: 'abc', language: 'de' }))
        .to.eventually.be.rejectedWith()
    })

    it('loads content for editing', async () => {
      const language = 'de'
      const t = await loadContentForEditing({ contentId, language })
      expect(t.params).to.eql(params)
    })
  })
  describe(listContent.name, function () {
    it('lists all content', async () => {
      const test = await listContent()
      expect(test.length).to.eql(1)
      expect(test[0].contentId).to.equal(contentId)
    })
  })
  describe(loadContentForPlaying.name, function () {
    it('loads the content', async () => {
      const content = await loadContentForPlaying({ contentId })
      expect(content.contentId).to.equal(contentId)
    })
  })
  describe(deleteContent.name, function () {
    it('deletes the content', async () => {
      await deleteContent({ contentId })

      const content = await listContent()
      expect(content.length).to.equal(0)
    })
  })
})
