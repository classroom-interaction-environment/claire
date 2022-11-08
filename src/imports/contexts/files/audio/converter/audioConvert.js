import { createInfoLog } from '../../../../api/log/createLog'

const info = createInfoLog('audioConvert')

const disableVideo = '-vn'
const samplingFreq = '-ar 44100'
const audioChannel = '-ac 2'
const audioBitRate = '-b:a 128k'
const mp3LameCodec = '-codec:a libmp3lame'
const mp3Extension = 'mp3'

const buildCommand = ({ path, output }) => {
  const cmd = `-i ${path} 
      ${disableVideo}
      ${samplingFreq}
      ${audioChannel}
      ${audioBitRate}
      ${mp3LameCodec}
      ${output}`
  return cmd.replace(/[\n\s]+/g, ' ') // make all multiple space single space
}

export const audioConvert = function audioConvert (uploadedFile) {
  const filesCollection = this

  return new Promise(Meteor.bindEnvironment(function (resolve) {
    const { _id, size, path, extension, name, _storagePath } = uploadedFile

    // if we have already an mp3 we can skip all this, even if the bitrate is
    // very high, since compatibility is more important than performance
    if (extension === mp3Extension) return resolve(uploadedFile)

    // run ffmpeg command
    const compressedPath = `${_storagePath}/${_id}.${mp3Extension}`
    const command = buildCommand({ path, output: compressedPath })

    Promise.await(ffmpeg(command))
    const mp3Stats = Promise.await(exists(compressedPath))

    if (mp3Stats.size >= size) {
      info('compressed file size is >= original size')
    }

    // we replace original as we don't want to support other formats than mp3
    // when it comes to streaming/downloading them to different browsers/devices
    uploadedFile.versions.original = {
      path: compressedPath,
      size: mp3Stats.size,
      type: 'audio/mpeg',
      extension: mp3Extension,
      meta: {}
    }

    const extensionIndex = name.lastIndexOf('.')
    const baseName = name.substring(0, extensionIndex - 1)
    const modifier = {
      $set: {
        name: `${baseName}.${mp3Extension}`,
        size: mp3Stats.size,
        type: 'audio/mpeg',
        path: compressedPath,
        mime: 'audio/mpeg',
        'mime-type': 'audio/mpeg',
        ext: mp3Extension,
        extension: mp3Extension,
        extensionWithDot: `.${mp3Extension}`
      }
    }

    modifier.$set['versions.original'] = uploadedFile.versions.original

    Promise.await(filesCollection.collection.update(uploadedFile._id, modifier))
    Promise.await(remove(path))

    // we need to return the updated file
    const updatedFile = Promise.await(filesCollection.collection.findOne(uploadedFile._id))
    resolve(updatedFile)
  }))
}

async function ffmpeg (command) {
  const _ffmpeg = await import('ffmpeg-cli')
  info('ffmpeg', command)
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
