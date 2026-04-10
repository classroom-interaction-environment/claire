export const curriculumViewStates = {
	heuristics: {
		name: "heuristics",
		label: "editor.didactics.heuristics.title",
		template: "curriculumHeuristics",
		load: async () => import("./view/heuristics/heuritics"),
	},
	objectives: {
		name: "objectives",
		label: "editor.didactics.objectives.title",
		template: "curriculumObjectives",
		load: async () => import("./view/objectives/objectives"),
	},
	pockets: {
		name: "pockets",
		label: "editor.didactics.pockets.title",
		template: "curriculumPockets",
		load: async () => import("./view/pockets/pockets"),
	},
};
