/* eslint-disable no-underscore-dangle */
import { Permission, H5pError, Logger } from '@lumieducation/h5p-server'
import { validateFilename, sanitizeFilename } from './utils'

const log = new Logger('MongoGridFSContentStorage')

/**
 * This storage implementation stores content data in a MongoDB collection
 * and a GridFS bucket.
 * The parameters and metadata of a H5P content object are stored in MongoDB,
 * while all files are put into GridFS storage.
 */
export default class MongoGridFSContentStorage {
  /**
   * @param bucket {GridFSBucket} the GridFS content storage; Must be either set to a bucket or the
   * bucket must be specified in the options!
   * @param collection {Mongo.Collection} a MongoDB collection (read- and writable)
   * @param options {object} options
   */
  constructor (bucket, collection, options) {
    log.info('initialize')
    this.maxKeyLength =
      options && options.maxKeyLength !== undefined
        ? options.maxKeyLength - 22
        : 1002
    // By default we shorten to 1002 as GridFS supports a maximum of 1024
    // characters and we need to account for contentIds (12), unique ids
    // appended to the name (8) and separators (2).

    this.bucket = bucket
    this.collection = collection
    this.options = {
      getPermissions: false
    }
  }

  /**
   * Generates the GridFS key for a file in a content object
   * @param contentId
   * @param filename
   * @returns the GridFS key
   */
  async getGridFSKey (contentId, filename) {
    const key = `${contentId}/${filename}`
    if (key.length > 1024) {
      log.error(
        `The GridFS key for "${filename}" in content object with id ${contentId} is ${key.length} bytes long, but only 1024 are allowed.`
      )
      throw new H5pError(
        'mongo-gridfs-content-storage:filename-too-long',
        { filename },
        400
      )
    }
    return key
  }

  /**
   * Creates or updates a content object in the repository. Throws an error if
   * something went wrong.
   * @param metadata The metadata of the content (= h5p.json)
   * @param content the content object (= content/content.json)
   * @param user The user who owns this object.
   * @param contentId (optional) The content id to use
   * @returns The newly assigned content id
   */
  async addContent (metadata, content, user, contentId) {
    log.debug('add content', contentId, 'by', user.id)
    if (
      !(await this.getUserPermissions(contentId, user)).includes(
        Permission.Edit
      )
    ) {
      log.error('User tried add content without proper permissions.')
      throw new H5pError(
        'mongo-gridfs-content-storage:missing-write-permission',
        {},
        403
      )
    }

    try {
      if (!contentId) {
        log.debug('Inserting new content into MongoDB.')
        const insertResult = await this.collection.insert({
          metadata,
          parameters: content,
          creator: user.id
        })
        log.debug('Content inserted into MongoDB.')
        return insertResult
      }

      log.debug(
        `Replacing existing content with id ${contentId} in MongoDB.`
      )
      const replaceResult = await this.collection.update(
        { _id: contentId },
        {
          metadata,
          _id: contentId,
          parameters: content,
          creator: user.id
        },
        { upsert: true }
      )

      if (replaceResult) {
        return contentId
      }
      log.error(`Error when replacing existing content with id ${contentId} in MongoDB`)
      throw new H5pError(
        'mongo-gridfs-content-storage:mongo-replace-error',
        {},
        500
      )
    }
    catch (error) {
      log.error(`Error when adding or updating content in MongoDB: ${error.message}`)
      throw new H5pError(
        'mongo-gridfs-content-storage:mongo-add-update-error',
        {},
        500
      )
    }
  }

  /**
   * Adds a content file to an existing content object. Throws an error if
   * something went wrong.
   * @param contentId The id of the content to add the file to
   * @param filename The filename
   * @param stream A readable stream that contains the data
   * @param user The user who owns this object
   * @returns
   */
  async addFile (contentId, filename, stream, user) {
    log.debug(
      `Uploading file "${filename}" for content with id ${contentId} to GridFS storage.`
    )
    validateFilename(filename)

    if (
      !(await this.getUserPermissions(contentId, user)).includes(
        Permission.Edit
      )
    ) {
      log.error(
        'User tried to upload a file without proper permissions.'
      )
      throw new H5pError(
        'mongo-gridfs-content-storage:missing-write-permission',
        {},
        403
      )
    }

    try {
      return await new Promise((resolve, reject) => {
        stream
          .pipe(
            this.bucket.openUploadStream(
              this.getGridFSKey(contentId, filename),
              {
                metadata: { contentId, filename }
              }
            )
          )
          .on('finish', () => {
            resolve()
          })
          .on('error', err => {
            reject(err)
          })
          .on('close', () => {
            resolve()
          })
      })
    }
    catch (error) {
      log.error(
        `Error while uploading file "${filename}" to GridFS storage: ${error.message}`
      )
      throw new H5pError(
        'mongo-gridfs-content-storage:gridfs-upload-error',
        { filename },
        500
      )
    }
  }

  /**
   * Checks if a piece of content exists in storage.
   * @param contentId the content id to check
   * @returns true if the piece of content exists
   */
  async contentExists (contentId) {
    log.debug(`Checking if content object with id ${contentId} exists.`)
    const foundDoc = await this.collection.findOne(
      {
        _id: contentId
      },
      { projection: { _id: true } }
    )
    if (foundDoc) {
      log.debug(`Content object with id ${contentId} exists.`)
      return true
    }
    log.debug(`Content object with id ${contentId} does not exist.`)
    return false
  }

  /**
   * Deletes a content object and all its dependent files from the repository.
   * Throws errors if something goes wrong.
   * @param contentId The content id to delete.
   * @param user The user who wants to delete the content
   * @returns
   */
  async deleteContent (contentId, user) {
    log.debug(`Deleting content with id ${contentId}.`)
    const permissions = await this.getUserPermissions(contentId, user)
    if (!permissions.includes(Permission.Delete)) {
      log.error('User tried to delete a content object without proper permissions.')
      throw new H5pError(
        'mongo-gridfs-content-storage:missing-delete-permission',
        {},
        403
      )
    }
    try {
      const filesToDelete = await this.listFiles(contentId, user)
      log.debug(`${filesToDelete.length} files in GridFS storage must be deleted.`)
      const idsToDelete = (await this.bucket
        .find({ 'metadata.contentId': contentId })
        .project({ _id: 1 })
        .toArray())
        .map((o) => o._id)

      Promise.all(idsToDelete.map(async (id) => this.bucket.delete(id)))
      if (this.collection.remove({ _id: contentId }) !== 1) {
        throw new Error('GridFS item could not be deleted.')
      }
    }
    catch (error) {
      log.error(`There was an error while deleting the content object: ${error.message}`)
      throw new H5pError(
        'mongo-gridfs-content-storage:deleting-content-error',
        {},
        500
      )
    }
  }

  /**
   * Deletes a file from a content object.
   * @param contentId the content object the file is attached to
   * @param filename the file to delete
   */
  async deleteFile (contentId, filename, user) {
    log.debug(`Deleting file "${filename}" from content with id ${contentId}.`)
    const permissisons = this.getUserPermissions(contentId, user)
    if (!permissisons.includes(Permission.Edit)) {
      log.error('User tried to delete a file from a content object without proper permissions.')
      throw new H5pError(
        'mongo-gridfs-content-storage:missing-write-permission',
        {},
        403
      )
    }

    try {
      const o = await this.bucket
        .find({ metadata: { contentId, filename } })
        .project({ _id: 1 })
        .toArray()

      await this.bucket.delete(o[0]._id)
    }
    catch (error) {
      log.error(`Error while deleting a file from GridFS storage: ${error.message}`)
      throw new H5pError(
        'mongo-gridfs-content-storage:deleting-file-error',
        { filename },
        500
      )
    }
  }

  /**
   * Checks if a file exists.
   * @param contentId The id of the content to add the file to
   * @param filename the filename of the file to get
   * @returns true if the file exists
   */
  async fileExists (contentId, filename) {
    log.debug(
      `Checking if file ${filename} exists in content with id ${contentId}.`
    )
    validateFilename(filename)

    if (!contentId) {
      log.error('ContentId not set!')
      throw new H5pError(
        'mongo-gridfs-content-storage:content-not-found',
        {},
        404
      )
    }

    try {
      const result = await this.bucket
        .find({
          metadata: {
            contentId,
            filename
          }
        })
        .toArray()

      if (result.length > 0) {
        log.debug(`File ${filename} does not exist in ${contentId}.`)
      }

      return result.length > 0
    }
    catch (error) {
      log.debug(`File ${filename} does not exist in ${contentId}.`)
      return false
    }
  }

  /**
   * Returns information about a content file (e.g. image or video) inside a
   * piece of content.
   * @param id the id of the content object that the file is attached to
   * @param filename the filename of the file to get information about
   * @param user the user who wants to retrieve the content file
   * @returns
   */
  async getFileStats (contentId, filename, user) {
    validateFilename(filename)

    if (
      !(await this.getUserPermissions(contentId, user)).includes(
        Permission.View
      )
    ) {
      log.error(
        'User tried to get stats of file from a content object without proper permissions.'
      )
      throw new H5pError(
        'mongo-gridfs-content-storage:missing-view-permission',
        {},
        403
      )
    }

    try {
      const info = await this.bucket
        .find({
          metadata: {
            contentId,
            filename
          }
        })
        .toArray()

      return { size: info[0].length, birthtime: info[0].uploadDate }
    }
    catch (error) {
      log.error(error)
      throw new H5pError(
        'content-file-missing',
        { filename, contentId },
        404
      )
    }
  }

  /**
   * Returns a readable stream of a content file (e.g. image or video) inside a piece of content
   * Note: Make sure to handle the 'error' event of the Readable! This method
   * does not check if the file exists in storage to avoid the extra request.
   * However, this means that there will be an error when piping the Readable
   * to the response if the file doesn't exist!
   * @param contentId the id of the content object that the file is attached to
   * @param filename the filename of the file to get
   * @param user the user who wants to retrieve the content file
   * @returns
   */
  async getFileStream (contentId, filename, user, rangeStart, rangeEnd) {
    log.debug(
      `Getting stream for file "${filename}" in content ${contentId}.`
    )
    validateFilename(filename)

    if (!contentId) {
      log.error('ContentId not set!')
      throw new H5pError(
        'mongo-gridfs-content-storage:content-not-found',
        {},
        404
      )
    }

    if (
      !(await this.getUserPermissions(contentId, user)).includes(
        Permission.View
      )
    ) {
      log.error(
        'User tried to display a file from a content object without proper permissions.'
      )
      throw new H5pError(
        'mongo-gridfs-content-storage:missing-view-permission',
        {},
        403
      )
    }

    const stream = this.bucket.openDownloadStreamByName(
      this.getGridFSKey(contentId, filename),
      rangeStart && rangeEnd
        ? { start: rangeStart, end: rangeEnd }
        : undefined
    )
    return new Promise((resolve, reject) => {
      stream
        .error((e) => {
          log.error(`Error while reading file stream from GridFS: ${e}`)
          reject(e)
        })
        .file(() => resolve(stream))
    })
  }

  async getMetadata (contentId, user) {
    log.debug(`Getting metadata for content with id ${contentId}.`)
    if (!(await this.getUserPermissions(contentId, user)).includes(Permission.View)) {
      log.error(
        'User tried to get metadata of a content object without proper permissions.'
      )
      throw new H5pError(
        'mongo-gridfs-content-storage:missing-view-permission',
        {},
        403
      )
    }

    try {
      const ret = await this.collection.findOne({
        _id: contentId
      })
      return ret.metadata
    }
    catch (error) {
      log.error(`Content with id ${contentId} does not exist.`)
      throw new H5pError(
        'mongo-gridfs-content-storage:content-not-found',
        {},
        404
      )
    }
  }

  async getParameters (contentId, user) {
    log.debug(`Getting parameters for content with id ${contentId}.`)
    if (!(await this.getUserPermissions(contentId, user)).includes(Permission.View)) {
      log.error(
        'User tried to get parameters of a content object without proper permissions.'
      )
      throw new H5pError(
        'mongo-gridfs-content-storage:missing-view-permission',
        {},
        403
      )
    }

    try {
      const ret = await this.collection.findOne({
        _id: contentId
      })
      return ret.parameters
    }
    catch (error) {
      log.error(`ContentId ${contentId} does not exist.`)
      throw new H5pError(
        'mongo-gridfs-content-storage:content-not-found',
        {},
        404
      )
    }
  }

  /**
   * Calculates how often a library is in use.
   * @param library the library for which to calculate usage.
   * @returns asDependency: how often the library is used as subcontent in
   * content; asMainLibrary: how often the library is used as a main library
   */
  async getUsage (library) {
    const [asMainLibrary, asDependency] = await Promise.all([
      this.collection.countDocuments({
        $and: [
          { 'metadata.mainLibrary': library.machineName },
          {
            'metadata.preloadedDependencies': {
              $elemMatch: {
                machineName: library.machineName,
                majorVersion: library.majorVersion,
                minorVersion: library.minorVersion
              }
            }
          }
        ]
      }),
      this.collection.countDocuments({
        $and: [
          {
            'metadata.mainLibrary': {
              $ne: library.machineName
            }
          },
          {
            $or: [
              {
                'metadata.preloadedDependencies': {
                  $elemMatch: {
                    machineName: library.machineName,
                    majorVersion: library.majorVersion,
                    minorVersion: library.minorVersion
                  }
                }
              },
              {
                'metadata.dynamicDependencies': {
                  $elemMatch: {
                    machineName: library.machineName,
                    majorVersion: library.majorVersion,
                    minorVersion: library.minorVersion
                  }
                }
              },
              {
                'metadata.editorDependencies': {
                  $elemMatch: {
                    machineName: library.machineName,
                    majorVersion: library.majorVersion,
                    minorVersion: library.minorVersion
                  }
                }
              }
            ]
          }
        ]
      })
    ])

    return { asMainLibrary, asDependency }
  }

  /**
   * Returns an array of permissions that the user has on the piece of content
   * @param contentId the content id to check
   * @param user the user who wants to access the piece of content
   * @returns the permissions the user has for this content (e.g. download it, delete it etc.)
   */
  async getUserPermissions (contentId, user) {
    log.debug(`Getting user permissions for content with id ${contentId}.`)
    if (this.options.getPermissions) {
      log.debug(
        'Using function passed in through constructor to get permissions.'
      )
      return this.options.getPermissions(contentId, user)
    }
    log.debug(
      'No permission function set in constructor. Allowing everything.'
    )
    return [
      Permission.Delete,
      Permission.Download,
      Permission.Edit,
      Permission.Embed,
      Permission.List,
      Permission.View
    ]
  }

  async listContent (user) {
    log.debug('Listing content objects.')
    if (
      !(await this.getUserPermissions(undefined, user)).includes(
        Permission.View
      )
    ) {
      log.error(
        'User tried to list all content objects without proper permissions.'
      )
      throw new H5pError(
        'mongo-gridfs-content-storage:missing-list-content-permission',
        {},
        403
      )
    }

    try {
      const cursor = this.collection.find({}, { projection: { _id: true } })

      return cursor.fetch().map((match) => match._id)
    }
    catch (error) {
      log.error(
        `Error while listing all ids of content objects: ${error.message}`
      )
      throw new H5pError(
        'mongo-gridfs-content-storage:listing-content-error',
        {},
        500
      )
    }
  }

  /**
   * Gets the filenames of files added to the content with addContentFile(...) (e.g. images, videos or other files)
   * @param contentId the piece of content
   * @param user the user who wants to access the piece of content
   * @returns a list of files that are used in the piece of content, e.g. ['image1.png', 'video2.mp4']
   */
  async listFiles (contentId, user) {
    log.debug(`Listing files in content object with id ${contentId}.`)
    if (
      !(await this.getUserPermissions(contentId, user)).includes(
        Permission.View
      )
    ) {
      log.error(
        'User tried to get the list of files from a content object without proper permissions.'
      )
      throw new H5pError(
        'mongo-gridfs-content-storage:missing-view-permission',
        {},
        403
      )
    }

    try {
      log.debug('Requesting list from GridFS storage.')
      const files = await this.bucket
        .find({
          'metadata.contentId': contentId
        })
        .toArray()
      log.debug(`Found ${files.length} file(s) in GridFS.`)
      return files
    }
    catch (error) {
      console.error(error)
      log.debug('There was an error while getting list of files from GridFS. This might not be a problem if no files were added to the content object.')
      return []
    }
  }

  /**
   * Removes invalid characters from filenames and enforces other filename
   * rules required by the storage implementation (e.g. filename length
   * restrictions).
   * @param filename the filename to sanitize; this can be a relative path
   * (e.g. "images/image1.png")
   * @returns the clean filename
   */
  sanitizeFilename (filename) {
    return sanitizeFilename(
      filename,
      this.maxKeyLength,
      this.options && this.options.invalidCharactersRegexp
    )
  }
}
