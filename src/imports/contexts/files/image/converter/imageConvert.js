import { Meteor } from 'meteor/meteor'
import { createLog } from '../../../../api/log/createLog'
import { fileExists } from '../../../../api/utils/filesystem/fileExists'
import { gmexec } from '../../shared/converters/gmexec'

const info = createLog({ name: 'imageConvert', devOnly: true })
let gm

export const imageConvert = async function (fileRef) {
  info('convert thumbnail')
  const collection = this
  const exists = await fileExists(fileRef.path)
  if (!exists) {
    throw Meteor.Error('upload.convertError')
  }

  if (!gm) gm = require('gm')

  const image = gm(fileRef.path)
  if (!image || !image.size) {
    throw new Error('undefimedImage', image)
  }

  try {
    await gmexec(image, image.size)
  } catch (e) {
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

  const storagePath = await collection.storagePath(fileRef)
  const thumbnailPath = `${storagePath}/thumbnail-${fileRef._id}.${fileRef.extension}`
  const img = gm(fileRef.path)
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

  // Change width and height proportionally
  await gmexec(img, img.write, thumbnailPath)
  const stat = await fileExists(thumbnailPath)
  const thumbImage = gm(thumbnailPath)
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

  const upd = { $set: {} }
  upd.$set['versions.thumbnail'] = fileRef.versions.thumbnail

  await collection.collection.updateAsync(fileRef._id, upd)
  return fileRef
}
