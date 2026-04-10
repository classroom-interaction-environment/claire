import { Material } from "../../../../contexts/material/Material";
import { isMetaMaterial } from "./isMetaMaterial";
import { isTaskMaterial } from "./isTaskMaterial";

export const unitEditorMaterialNames = () => {
	const allMaterial = [];
	Material.forEach((ctx) => {
		allMaterial.push(ctx);
	});
	return allMaterial
		.filter((ctx) => !isMetaMaterial(ctx) && !isTaskMaterial(ctx))
		.map(({ name, label, fieldName }) => ({ name, label, fieldName }));
};
