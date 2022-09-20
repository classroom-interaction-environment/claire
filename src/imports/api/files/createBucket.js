import { MongoInternals } from 'meteor/mongo'

const cache = new Map()

export const createBucket = bucketName => {
  let bucket = cache.get(bucketName)
  if (!bucket) {
    const options = bucketName ? { bucketName } : undefined
    bucket = new MongoInternals.NpmModule.GridFSBucket(MongoInternals.defaultRemoteCollectionDriver().mongo.db, options)
    cache.set(bucketName, bucket)
  }
  return bucket
}
