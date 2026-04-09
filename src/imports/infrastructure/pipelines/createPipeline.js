/**
 * Creates a new pipeline method.
 * @param name
 * @param fn
 * @param quiet
 * @return {function(*, *=): *}
 */
import { createLog } from "../../api/log/createLog";

export const createPipeline = (name, fn, { quiet = false } = {}) => {
	let contextName = "";
	const pipelineName = `${name}`;
	const pipelineLog = (...args) => log(contextName, pipelineName, ...args);

	const api = {};
	api.log = pipelineLog;
	api.info = pipelineLog;

	return (context, options = {}) => {
		contextName = `[${context.name}]:`;
		if (!quiet) {
			pipelineLog("pipeline exec");
		}
		return fn(context, api, options);
	};
};

const log = createLog({ name: createPipeline.name });
