import { FileTypes } from '../shared/FileTypes'
import {
  onClient,
  onClientExec,
  onServer,
} from '../../../api/utils/archUtils'
import { getCollection } from '../../../api/utils/getCollection'
import { Meteor } from 'meteor/meteor'

/**
 * AppImages are used for displaying public / application-wide images, such as company/organization logos.
 */

export const AppImages = {
  name: 'appImages',
  label: 'files.appImages',
  isFilesCollection: true,
  icon: 'file-image',
  schema: {},
  methods: {},
  publicFields: {},
  publications: {},
  helpers: {},

  // this is not material, so we attach renderer on top-level
  renderer: onClient({
    template: 'imageFileRenderer',
    load: async function () {
      return import('./renderer/main/imageFileRenderer')
    }
  }),


  files: {
    type: FileTypes.image.value,
    extensions: FileTypes.image.extensions,
    accept: FileTypes.image.accept,
    maxSize: 1024 * 1000 * 6,
    usePartialResponse: false,
    converter: null // no thumbnails for app images
  }
}

/**
 * Helpers will be used to call the app images on client startup
 * and cache the images in a closed-scoped reactive var.
 */

onClientExec(function () {
  const { ReactiveVar } = require('meteor/reactive-var')
  const appImages = new ReactiveVar()

  AppImages.helpers.get = function () {
    return appImages.get()
  }

  AppImages.helpers.init = function (callback) {
    Meteor.call(AppImages.methods.get.name, {}, (err, res) => {
      if (err) return callback(err)
      appImages.set(res)
      callback(undefined, res)
    })
  }
})

/**
 * Publication only applies to admin panel, where an immediate update
 * of the uploaded image is required by publication in order to make the fileUpload form work.
 */
AppImages.publications.all = {
  name: 'appImages.publications.all',
  admin: true,
  schema: {},
  run: onServer(function () {
    return getCollection(AppImages.name).find()
  })
}

/**
 * All non-admin users, including non-registered visitors will use this method
 * to call the app images.
 */

AppImages.methods.get = {
  name: 'appImages.methods.get',
  schema: {},
  isPublic: true,
  run: onServer(function () {
    return getCollection(AppImages.name).find().fetch()
  })
}
