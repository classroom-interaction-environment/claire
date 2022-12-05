import { check } from 'meteor/check'
import { getCollection } from '../../../api/utils/getCollection'
import { Curriculum } from '../../../contexts/curriculum/Curriculum.js'
import { Item } from '../definitions/items/Item'
import { ResponseDataTypes } from '../../../api/plugins/ResponseDataTypes'

export const getItem = ({ taskId, itemId, taskDoc, page }) => {
  check(taskId, String)
  check(itemId, String)
  check(page, Number)
  if (!taskDoc) {
    taskDoc = getCollection(Curriculum.Task.name).findOne(taskId)
  }
  const contentPage = taskDoc.pages[page]
  return contentPage.content.find(e => e && e.itemId === itemId)
}

export const toResponse = ({ value }) => {
  if (typeof value === 'undefined' || value === null) return value
  return Array.isArray(value)
    ? value.map(entry => String(entry))
    : [String(value)]
}

export const fromResponse = ({ taskId, itemId, taskDoc, page, response }) => {
  if (typeof response === 'undefined' || response === null) return response

  const item = getItem({ taskDoc, taskId, itemId, page })
  if (!item) {
    throw new Error(`Unexpected undefined item for itemId ${itemId}`)
  }

  const { meta } = item
  if (!meta) {
    throw new Error(`Unexpected undefined item type (meta) for itemId ${itemId}`)
  }

  const ItemContext = Item.get(meta)
  const { dataType } = ItemContext

  // plugins may refer to a responsetype directly and not only by name
  if (dataType.from) {
    return dataType.from(response, item)
  }

  if (!(dataType in ResponseDataTypes)) {
    throw new Error(`Unexpected dataType "${dataType}".`)
  }

  const responseType = ResponseDataTypes[dataType]
  return responseType.from(response, item)
}
