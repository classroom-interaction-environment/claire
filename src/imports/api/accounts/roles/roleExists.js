import { mapFromObject } from "../../utils/mapFromObject";
import { Hierarchy } from "./Hierarchy";

export const roleExists = (role) => roleMap.has(role);

const roleMap = mapFromObject(Hierarchy);
