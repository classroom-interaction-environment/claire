const exists = function (value) {
  return value !== null && typeof value !== 'undefined'
}

const getUserId = function () {
  const currentInvocation = DDP._CurrentMethodInvocation.get() || DDP._CurrentPublicationInvocation.get()
  return currentInvocation
    ? currentInvocation.userId
    : 'system'
}

export const getUpdateStamps = function () {
  const tmpMod = {}
  tmpMod.updatedBy = getUserId()
  tmpMod.updatedAt = new Date()
  return tmpMod
}

export const insertHook = function (doc, callback, cb, isFilesCollection) {
  doc.createdBy = isFilesCollection
    ? doc.userId || getUserId()
    : getUserId()
  doc.createdAt = new Date()
  doc.updatedAt = doc.createdAt
  doc.updatedBy = doc.createdBy
}

export const updateHook = function (query, modifier, options, callback) {
  const tmpMod = getUpdateStamps()

  if (exists(modifier.$set)) {
    modifier.$set = Object.assign(modifier.$set, tmpMod)
  }
  else {
    modifier.$set = tmpMod
  }

  if (exists(modifier.$unset?.updatedAt)) {
    delete modifier.$unset.updatedAt
  }

  if (exists(modifier.$unset?.updatedBy)) {
    delete modifier.$unset.updatedBy
  }
}
