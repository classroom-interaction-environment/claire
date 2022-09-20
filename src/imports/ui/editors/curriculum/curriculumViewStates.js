
export const curriculumViewStates = {
  heuristics: {
    name: 'heuristics',
    label: 'editor.didactics.heuristics.title',
    template: 'curriculumHeuristics',
    load: async function () {
      return import('./view/heuristics/heuritics')
    }
  },
  objectives: {
    name: 'objectives',
    label: 'editor.didactics.objectives.title',
    template: 'curriculumObjectives',
    load: async function () {
      return import('./view/objectives/objectives')
    }
  },
  pockets: {
    name: 'pockets',
    label: 'editor.didactics.pockets.title',
    template: 'curriculumPockets',
    load: async function () {
      return import('./view/pockets/pockets')
    }
  }
}
