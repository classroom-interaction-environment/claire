import { createLog } from '../../../../api/log/createLog'
import checkMime from 'file-type'
const log = createLog({ name: 'videoConvert' })
const mp4Extension = 'mp4'

/**
 * Converts a given file to mp4/h264
 * @param uploadedFile
 * @return {Promise<file>}
 */
export const videoConvert = function convertVideo (uploadedFile) {
  const filesCollection = this
  log('run on', uploadedFile.name, uploadedFile._id)

  return new Promise(Meteor.bindEnvironment(function (resolve) {
    const { _id, size, path, extension, name, _storagePath } = uploadedFile

    // create screenshot for video thumbnail here so we can early on display
    // some loading indicator with also a "preview" image
    const posterPath = `${_storagePath}/poster-${_id}.jpg`
    const posterCommand = `-ss 00:00:05 -i ${path} -frames:v 1 -q:v 2 ${posterPath}`
    Promise.await(ffmpeg(posterCommand))

    const posterStats = Promise.await(exists(posterPath))

    // update poster version
    uploadedFile.versions.poster = {
      path: posterPath,
      size: posterStats.size,
      type: 'image/jpeg',
      extension: 'jpg',
      meta: {
        // TODO with/height
      }
    }

    const modifier = { $set: {} }
    modifier.$set['versions.poster'] = uploadedFile.versions.poster

    // for now we assume mp4 files to be support, even if the
    // internal codec may not be h264
    // if (extension === mp4Extension) {
    //  Promise.await(filesCollection.collection.update(uploadedFile._id, modifier))
    //  return resolve(Promise.await(filesCollection.collection.findOne(uploadedFile._id)))
    // }

    // we simply run ffmpeg on all we can find in hope the output is smaller
    // than the original
    const compressedPath = `${_storagePath}/compressed-${_id}.${mp4Extension}`
    const command = `-i ${path} -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.0 -crf 22 -preset slow -vf scale=1280:-2 -c:a aac -b:a 192k -strict experimental -movflags +faststart -threads 0 ${compressedPath}`
    // `-i ${path}  -c:a aac -c:v libx264 ${compressedPath}`
    // -i ${path} -vcodec h264 -acodec aac -strict -2 ${compressedPath}
    // -i ${path} -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3 ${compressedPath}
    // -i ${path} -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.0 -crf 20 -movflags +faststart -threads 0 ${compressedPath}
    // -i ${path} -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.0 -crf 22 -preset slow -vf scale=1280:-2 -c:a aac -b:a 192k -strict experimental -movflags +faststart -threads 0 ${compressedPath}"

    Promise.await(ffmpeg(command))

    const mp4Stats = Promise.await(exists(compressedPath))
    const mp4Mime = Promise.await(checkMime.fromFile(compressedPath))

    log('compressed size is', mp4Stats.size)
    log('originals size was', size)

    // we replace original as we don't want to support other formats than mp4
    // when it comes to streaming/downloading them to different browsers/devices
    uploadedFile.versions.original = {
      path: compressedPath,
      size: mp4Stats.size,
      type: mp4Mime.mime,
      extension: mp4Mime.ext,
      meta: {}
    }

    const extensionIndex = name.lastIndexOf('.')
    const baseName = name.substring(0, extensionIndex - 1)

    Object.assign(modifier.$set, {
      name: `${baseName}.${mp4Extension}`,
      size: mp4Stats.size,
      type: mp4Mime.mime,
      path: compressedPath,
      mime: mp4Mime.mime,
      'mime-type': mp4Mime.mime,
      ext: mp4Extension,
      extension: mp4Extension,
      extensionWithDot: `.${mp4Extension}`
    })

    modifier.$set['versions.original'] = uploadedFile.versions.original
    log('update collection')
    Promise.await(filesCollection.collection.update(uploadedFile._id, modifier))
    Promise.await(remove(path))

    // we need to return the updated file
    const updatedFile = Promise.await(filesCollection.collection.findOne(uploadedFile._id))
    log('done', updatedFile)
    resolve(updatedFile)
  }))
}

async function ffmpeg (command) {
  const _ffmpeg = await import('ffmpeg-cli')
  log('ffmpeg', command)
  return _ffmpeg.run(command)
}

function exists (path) {
  import fs from 'fs'
  return new Promise((resolve, reject) => {
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

function remove (path) {
  return new Promise((resolve, reject) => {
    fs.rm(path, (err) => {
      if (err) {
        reject(err)
      }

      else {
        resolve()
      }
    })
  })
}
