/* global AutoForm */
import { Mongo } from 'meteor/mongo'
import { Item } from '../items/Item'
import { firstOption } from '../common/helpers'
import { i18n } from '../../../../api/language/language'

export const ItemRef = {
  name: 'item',
  label: 'text.itemReference.title',
  icon: 'pen-square',
  schema: {
    hint: {
      type: String,
      label: i18n.reactive('text.itemReference.hint'),
      autoform: {
        afFieldInput: {
          autofocus: ''
        }
      }
    },
    taskId: {
      type: String,
      label: i18n.reactive('text.itemReference.taskId'),
      autoform: {
        firstOption,
        options () {
          const taskCollection = Mongo.Collection.get('task')
          return taskCollection.find({}, { sort: { title: 1 } }).fetch().map(t => ({
            value: t._id,
            label: t.title
          }))
        }
      }
    },
    refId: {
      type: String,
      label: i18n.reactive('text.itemReference.refId'),
      autoform: {
        disabled () {
          const taskId = AutoForm.getFieldValue('taskId')
          if (!taskId) return true
          return !Mongo.Collection.get('task').findOne(taskId)
        },
        firstOption,
        options () {
          const taskId = AutoForm.getFieldValue('taskId')
          const taskDoc = Mongo.Collection.get('task').findOne(taskId)
          if (!taskDoc) return []
          const { pages } = taskDoc
          const items = []
          pages.forEach(page => {
            const { content } = page || []
            content.forEach(element => {
              if (element.type === Item.name) {
                items.push({
                  value: element.itemId,
                  label: element.title
                })
              }
            })
          })
          return items
        }
      }
    }
  }
}
