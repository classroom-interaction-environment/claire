import { Lang } from '../../utils/Translate'
import { DisplayTypes } from '../../../../api/schema/Resolvers'
import { onClientExec } from '../../../../api/utils/archUtils'
import { applyRoute } from '../../../../api/routes/applyRoute'

export const Task = {
  name: 'task',
  isTaskContent: true,
  order: 3,
  icon: 'user-edit',
  label: 'curriculum.task',
  isCurriculum: true,
  isClassroom: true,
  fieldName: 'tasks',
  material: {
    resolveDependencies (taskDoc, deps = {}) {
      if (!taskDoc?.pages || !taskDoc?.header || !taskDoc.footer) {
        // TODO ????
      }
      const resolve = target => {
        const { content } = target
        ;(content || []).forEach(entry => {
          if (entry._id) {
            if (!deps[entry.meta]) {
              deps[entry.meta] = []
            }
            deps[entry.meta].push(entry._id)
          }
        })
      }

      resolve(taskDoc.header)
      taskDoc.pages.forEach(page => resolve(page))
      resolve(taskDoc.footer)

      return deps
    },
    onCreated (taskId, unitDoc /*, viewState */) {
      import { applyRoute } from '../../../../api/routes/applyRoute'
      const options = this || {}
      const { redirect, isMasterMaterial, isMasterMode } = options

      if (redirect && isMasterMaterial && !isMasterMode) {
        setTimeout(() => applyRoute(redirect, taskId, unitDoc?._id), 300)
      }
    }
  }
}

Task.publicFields = {
  header: 1,
  footer: 1,
  pages: 1
}

// /////////////////////////////////////////////////////////////////////////////
//
// SCHEMA
//
// /////////////////////////////////////////////////////////////////////////////

Task.schema = {
  // ================================================== //
  // HEADER
  // ================================================== //
  header: {
    type: Object,
    optional: true,
    displayType: DisplayTypes.number,
    resolve (value) {
      return (value && value.content && value.content.length) || 0
    },
    label: Lang.translateReactive('task.header.title')
  },
  'header.align': {
    type: String,
    optional: true,
    label: Lang.translateReactive('task.header.align')
  },
  'header.content': {
    type: Array,
    optional: true,
    label: Lang.translateReactive('task.header.content')
  },
  'header.content.$': {
    type: Object,
    label: Lang.translateReactive('task.header.contentEntry'),
    blackbox: true
  },

  // ================================================== //
  // FOOTER
  // ================================================== //
  footer: {
    type: Object,
    optional: true,
    label: Lang.translateReactive('task.footer.title')
  },
  'footer.align': {
    type: String,
    optional: true,
    label: Lang.translateReactive('task.footer.align')
  },
  'footer.content': {
    type: Array,
    optional: true,
    label: Lang.translateReactive('task.footer.content')
  },
  'footer.content.$': {
    type: Object,
    label: Lang.translateReactive('task.footer.contentEntry'),
    blackbox: true
  },

  // ================================================== //
  // PAGES
  // ================================================== //
  pages: {
    type: Array,
    optional: true,
    label: Lang.translateReactive('task.pages.title')
  },
  'pages.$': {
    type: Object,
    optional: true,
    label: Lang.translateReactive('task.pages.page')
  },
  'pages.$.title': {
    type: String,
    optional: true,
    label: Lang.translateReactive('task.pages.pageTitle')
  },
  'pages.$.content': {
    type: Array,
    optional: true,
    label: Lang.translateReactive('task.pages.content')
  },
  'pages.$.content.$': {
    type: Object,
    label: Lang.translateReactive('task.pages.contentEntry'),
    blackbox: true
  }
}

/** @deprecated move into own modules */
Task.helpers = {
  createData () {
    return {
      header: {
        align: 'center',
        content: []
      },
      footer: {
        align: 'center',
        content: []
      },
      pages: [{
        title: '1',
        content: []
      }]
    }
  },
  pagesSchema (schemaCreator) {
    throw new Error('not implemented') // TODO implement to validate pagecontent
  },

}

Task.methods = {}

/** @deprecated move into own modue */
Task.layout = {
  page: {
    type: Object
  },
  'page.title': {
    type: String
  },
  'page.content': {
    type: Array
  },
  'page.content.$': {
    type: Object
  },
  'page.content.$.type': {
    type: String
  }
}

onClientExec(function () {
  Object.assign(Task.material, {
    info: {
      create: 'task.createInfo'
    },
    editable: false, // basically because we prove a cusom edit button here
    schema: {},
    beforeInsert: function (insertDoc) {
     // all default data may be overridden by insertDoc
     return Object.assign({}, Task.helpers.createData(), insertDoc)
    },
    renderer: {
      list: {
        template: 'taskListRenderer',
        load: async function () {
          return import('./renderer/list/taskListRenderer')
        }
      },
      main: {
        template: 'taskRenderer',
        load: async function () {
          return import('./renderer/main/taskRenderer')
        },
        /** @deprecated use data **/
        previewData: function  (targetId, instance) {
          console.warn('previewData is deprecated')
          if (!targetId) return

          const { collection } = this
          const task = collection.findOne(targetId)
          if (!task) return

          return {
            title: task.title,
            data: Object.assign({}, task),
            preview: true
          }
        },
        data: ({ materialDoc, document, templateInstance, options = {} }) => {
          const { print = false, preview = true, student = false } = options
          const data = Object.assign({}, materialDoc, document)

          return {
            title: document.title,
            data: data,
            preview: preview,
            print: print,
            student: student
          }
        }
      }
    }
  })
})
