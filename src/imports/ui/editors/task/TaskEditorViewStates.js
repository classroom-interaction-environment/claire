import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'

export const TaskEditorViewStates = {
  pages: {
    name: 'pages',
    label: 'editor.task.editPages',
    template: 'taskPages',
    inExtendedView: false,
    async load () {
      await import('../../../contexts/curriculum/curriculum/task/renderer/main/taskRendererFactory')
      await import('./helpers/sharedTemplateHelpers')
      return import('./pages/taskPages')
    }
  },
  summary: {
    name: 'summary',
    label: 'editor.task.preview',
    template: 'taskEditorSummary',
    inExtendedView: false,
    async load () {
      await import('../../../contexts/curriculum/curriculum/task/renderer/main/taskRendererFactory')
      await import('./helpers/sharedTemplateHelpers')
      return import('./summary/taskSummary')
    }
  },
  units: {
    name: 'units',
    label: 'curriculum.units',
    template: 'teunits',
    inExtendedView: true,
    async load () {
      return import('./units/taskUnits')
    }
  },
  code: {
    name: 'code',
    label: 'editor.task.codeView',
    roles: [UserUtils.roles.admin],
    inExtendedView: false,
    template: 'taskEditorCode',
    async load () {
      return import('./code/taskCode.html')
    }
  }
}
