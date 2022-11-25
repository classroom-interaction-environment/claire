import { Meteor } from 'meteor/meteor'
import { fileExists } from '../../../../api/utils/filesystem/fileExists'

let im

// convert -density 150 presentation.pdf[0] -quality 90 test.jpg
export const documentConverter = async function (fileRef, options) {
  if (!fileRef.isPDF) {
    return fileRef
  }

  const filesCollection = this
  const exists = await fileExists(fileRef.path)

  if (!exists) {
    throw Meteor.Error('upload.convertError')
  }

  if (!im) im = require('gm').subClass({ imageMagick: true })

  let document
  const thumbnailPath = (filesCollection.storagePath(fileRef)) + '/thumbnail-' + fileRef._id + '.png'

  try {
    document = im(fileRef.path)
      .selectFrame(0)
      .define('filter:support=2')
      .define('png:compression-filter=5')
      .define('png:compression-level=9')
      .define('png:compression-strategy=1')
      .define('png:exclude-chunk=all')
      .noProfile()
      .strip()
      .dither(false)
      .interlace('Line')
      .filter('Triangle')
      .resize('50%')
      .interlace('Line')
  }
  catch (imError) {
    // if we catch an error here we skip the rest as we have nothing
    // created neither on disk nor in the database
    console.error(imError)
    return fileRef
  }

  try {
    await gmexec(document, document.write, thumbnailPath)
  }
  catch (imErr) {
    console.error(imErr)
    return fileRef
  }

  const stat = await fileExists(thumbnailPath)
  const thumbImage = im(thumbnailPath)
  const imgInfo = await gmexec(thumbImage, thumbImage.size)
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

  // update the files doc
  const updateDoc = { $set: {} }
  updateDoc.$set['versions.thumbnail'] = fileRef.versions.thumbnail
  await filesCollection.collection.update(fileRef._id, updateDoc)

  return fileRef
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
