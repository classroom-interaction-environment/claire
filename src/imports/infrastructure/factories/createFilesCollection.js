import { Meteor } from 'meteor/meteor'
import { createGridFilesFactory } from 'meteor/leaonline:grid-factory'
import { i18n } from '../../api/language/language'
import { onClientExec, onServerExec } from '../../api/utils/archUtils'

let createFilesCollection

onServerExec(function () {
  import { createBucket } from '../../api/files/createBucket'
  import { createObjectId } from '../../api/files/createObjectId'
  import fs from 'fs'

  createFilesCollection = createGridFilesFactory({
    i18nFactory: x => x,
    bucketFactory: createBucket,
    defaultBucket: Meteor.settings.files.bucketName,
    createObjectId: createObjectId,
    fs: fs,
    debug: false
  })
})

onClientExec(function () {
  createFilesCollection = createGridFilesFactory({
    i18nFactory: (...args) => i18n.get(...args),
    debug: false
  })
})

export { createFilesCollection }
