import { Meteor } from 'meteor/meteor'
import { createLog } from '../../../../api/log/createLog'

const info = createLog({ name: 'imageConvert', devOnly: true })
let fs
let gm

function exists (path) {
  return new Promise((resolve, reject) => {
    if (!fs) fs = require('fs')
    fs.stat(path, (err, stats) => {
      if (err) {
        reject(err)
      }
      else if (!stats) {
        reject(new Error())
      }
      else {
        resolve(stats)
      }
    })
  })
}

function gmexec (thisObj, fct, ...args) {
  return new Promise((resolve, reject) => {
    args.push((err, res) => {
      if (err) {
        reject(err)
      }
      else {
        resolve(res)
      }
    })
    fct.call(thisObj, ...args)
  })
}

export const imageConvert = function imageConvert (fileRef) {
  info('convert thumbnail')
  const collection = this
  const fileExists = Promise.await(exists(fileRef.path))
  if (!fileExists) {
    throw Meteor.Error('upload.convertError')
  }

  return new Promise(Meteor.bindEnvironment((resolve, reject) => {
    if (!gm) gm = require('gm')

    const image = gm(fileRef.path)
    if (!image || !image.size) {
      throw new Error('undefimedImage', image)
    }

    try {
      Promise.await(gmexec(image, image.size))
    }
    catch (e) {
      console.error(e)
      return resolve(fileRef)
    }

    // Update meta data if original image
    // const updated = collection.collection.update(fileRef._id, {
    //   $set: {
    //     'meta.width': features.width,
    //     'meta.height': features.height,
    //     'versions.original.meta.width': features.width,
    //     'versions.original.meta.height': features.height
    //   }
    // })

    const thumbnailPath = (collection.storagePath(fileRef)) + '/thumbnail-' + fileRef._id + '.' + fileRef.extension
    let img
    try {
      img = gm(fileRef.path)
        .quality(70)
        .define('filter:support=2')
        .define('jpeg:fancy-upsampling=false')
        .define('jpeg:fancy-upsampling=off')
        .define('png:compression-filter=5')
        .define('png:compression-level=9')
        .define('png:compression-strategy=1')
        .define('png:exclude-chunk=all')
        .autoOrient()
        .noProfile()
        .strip()
        .dither(false)
        .interlace('Line')
        .filter('Triangle')
        .resize(64)
        .interlace('Line')
    }
    catch (gmError) {
      return reject(gmError)
    }

    // Change width and height proportionally
    Promise.await(gmexec(img, img.write, thumbnailPath))
    const stat = exists(thumbnailPath)
    const thumbImage = gm(thumbnailPath)
    const imgInfo = Promise.await(gmexec(thumbImage, thumbImage.size))
    fileRef.versions.thumbnail = {
      path: thumbnailPath,
      size: stat.size,
      type: fileRef.type,
      extension: fileRef.extension,
      meta: {
        width: imgInfo.width,
        height: imgInfo.height
      }
    }

    const upd = { $set: {} }
    upd.$set['versions.thumbnail'] = fileRef.versions.thumbnail

    collection.collection.update(fileRef._id, upd)
    resolve(fileRef)
  }))
}
