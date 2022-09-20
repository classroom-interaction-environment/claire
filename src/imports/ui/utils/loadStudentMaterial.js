import { Lesson } from '../../contexts/classroom/lessons/Lesson'
import { getLocalCollection } from '../../infrastructure/collection/getLocalCollection'
import { callMethod } from '../controllers/document/callMethod'

/**
 * Students-only client side method to prapre a cache-intensive approach to load
 * students-materials, based on current visible material
 *
 * @param _id
 * @param visibleStudent
 * @param callback
 * @return {*}
 */
export const loadStudentMaterial = async ({ _id, groupId, visibleStudent, prepare, receive, failure, success }) => {
  console.debug('[loadStudentMaterial]:', _id, { visibleStudent })
  // nothing to load, abort already
  if (!visibleStudent || visibleStudent.length === 0) {
    return success ? success(null, '') : ''
  }

  const skip = []
  const remain = []

  // let's build a cache, based on our local (cache-) collections
  visibleStudent.forEach(reference => {
    const cache = getLocalCollection(reference.context)
    if (cache.findOne(reference._id)) {
      skip.push(reference._id)
    }
    else {
      remain.push(reference)
    }
  })

  // if there is nothing to load left, abort
  if (skip.length === visibleStudent.length || remain.length === 0) {
    return success ? success(null, '') : ''
  }

  const args = { _id, skip }
  if (groupId) {
    args.groupId = groupId
  }

  console.debug('[loadStudentMaterial]:', _id, { skip })
  const material = await callMethod({
    name: Lesson.methods.material,
    args: args,
    prepare: prepare,
    receive: receive,
    failure: failure
  })
  let hash = ''

  if (!material) {
    return console.debug('[loadStudentMaterial]: no material found')
  }

  Object.entries(material).forEach(([ctxName, documents]) => {
    console.debug('[loadStudentMaterial]: loaded', ctxName, documents)
    const collection = getLocalCollection(ctxName)
    ;(documents || []).forEach(doc => {
      hash += doc._id.substring(0, 2)
      collection.upsert(doc._id, { $set: doc })
    })
  })

  if (success) success(material, hash)
  return { material, hash }
}
