import { Meteor } from "meteor/meteor";
import { ContextBuilder } from "../../../infrastructure/datastructures/ContextBuilder";
import { buildPipeline } from "../../../infrastructure/pipelines/server/buildPipeline";
import { createLog } from "../../../api/log/createLog";

ContextBuilder.buildAll((context) => {
	const useDebug = Meteor.isDevelopment && context.debug;
	const options = {
		collection: true,
		filesCollection: true,
		methods: true,
		publications: true,
	};
	if (Meteor.isTest || useDebug) {
		options.debug = createLog({ name: context.name, type: "debug" });
	}
	buildPipeline(context, options);
});
