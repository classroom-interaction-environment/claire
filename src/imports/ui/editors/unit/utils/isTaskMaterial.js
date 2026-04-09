import { Task } from "../../../../contexts/curriculum/curriculum/task/Task";

export const isTaskMaterial = (ctx) => [Task.name].includes(ctx.name);
