export const PrepareViewStates = {
  create: {
    name: 'create',
    label: 'prepare.createClass',
    template: 'createClass',
    load: async function () {
      return import('./views/create/create')
    }
  },
  classes: {
    name: 'classes',
    label: 'prepare.myClasses',
    template: 'myClasses',
    load: async function () {
      return import('./views/classes/classes')
    }
  }
}
