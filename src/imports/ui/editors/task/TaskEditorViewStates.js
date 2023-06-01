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
  header: {
    name: 'header',
    label: 'editor.task.headerContent',
    template: 'taskHeader',
    inExtendedView: true,
    async load () {
      await import('../../../contexts/curriculum/curriculum/task/renderer/main/taskRendererFactory')
      await import('./helpers/sharedTemplateHelpers')
      return import('./header/taskHeader')
    }
  },
  footer: {
    name: 'footer',
    label: 'editor.task.footerContent',
    template: 'taskFooter',
    inExtendedView: true,
    async load () {
      await import('../../../contexts/curriculum/curriculum/task/renderer/main/taskRendererFactory')
      await import('./helpers/sharedTemplateHelpers')
      return import('./footer/taskFooter')
    }
  },
  baseInfo: {
    name: 'baseInfo',
    label: 'editor.task.baseInfo',
    template: 'teBasicInfo',
    inExtendedView: true,
    async load () {
      return import('./basic/basic')
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
