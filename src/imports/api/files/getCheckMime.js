import { check } from 'meteor/check'
import mimeTypes from 'mime-types'
import { createLog } from '../log/createLog'
// import { fileTypeFromFile } from 'file-type'

const debug = createLog({ name: 'checkMime', type: 'debug' })

export const getCheckMime = (i18nFactory = x => x, filesDef) => {
  check(i18nFactory, Function)

  return async uploadedFile => {
    const { path, extension } = uploadedFile
    debug('check mime for', uploadedFile)

    const detected = await fileTypeFromFile(path)

    if (!detected) {
      throw new Error(i18nFactory('files.mimeError', {
        expected: uploadedFile.ext,
        got: 'undefined',
        ending: 'undefined'
      }))
    }

    debug('detected', detected, 'one path', path)
    const detectedExt = detected.ext
    const detectedMime = detected.mime
    const lookup = mimeTypes.lookup(path) || ''

    // in this first approach we check if the detected mime matches the
    // expected, which occurs in many non-container-wrapped file formats
    if (lookup === detectedMime) {
      return true
    }

    // and if that's not the case it might still be supported
    if (filesDef.extensions.includes(detectedExt)) {
      return true
    }

    const resolvedExtension = mimeTypes.extension(detectedMime)

    // for containers, we need to reverse-check if the detected mime is
    // matching the ending we expect the container format to have
    if (resolvedExtension === extension) {
      return true
    }

    throw new Error(i18nFactory('files.mimeError', {
      expected: lookup,
      got: detectedMime,
      ending: resolvedExtension
    }))
  }
}
