import { check } from 'meteor/check'
import checkFileType from 'file-type'
import mimeTypes from 'mime-types'
import { createDebugLog } from '../log/createLog'

const debug = createDebugLog('checkMime')

export const getCheckMime = (i18nFactory = x => x, filesDef) => {
  check(i18nFactory, Function)

  return async uploadedFile => {
    const { path, extension } = uploadedFile
    debug('check mime for', uploadedFile)

    const detected = await checkFileType.fromFile(path)

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
