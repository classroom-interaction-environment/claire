import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'

export const UnitEditorViewStates = {
  summary: {
    name: 'summary',
    label: 'editor.unit.summary',
    template: 'uesummary',
    load: async function () {
      return import('./views/summary/summary')
    }
  },
  basicInfo: {
    name: 'basicInfo',
    label: 'editor.unit.basicInfo',
    template: 'uebasicInfo',
    load: async function () {
      return import('./views/basicinfo/basicInfo')
    }
  },
  objectives: {
    name: 'objectives',
    label: 'editor.unit.objectives.title',
    template: 'ueobjectives',
    load: async function () {
      return import('./views/objectives/objectives')
    }
  },
  material: {
    name: 'material',
    label: 'editor.unit.material.title',
    template: 'uematerial',
    load: async function () {
      return import('./views/material/material')
    }
  },
  phases: {
    name: 'phases',
    label: 'editor.unit.phases.title',
    template: 'uephases',
    load: async function () {
      return import('./views/phases/phases')
    }
  },
  codeView: {
    name: 'codeView',
    label: 'editor.unit.codeView',
    template: 'uecodeView',
    roles: [UserUtils.roles.admin],
    load: async function () {
      return import('./views/codeView/codeViedw')
    }
  }
}
