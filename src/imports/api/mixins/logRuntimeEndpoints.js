import { createLog } from "../log/createLog";
import { Random } from "meteor/random";
import { deprecate } from "../../infrastructure/functions/deprecate";

const createMethodId = () => Random.id(6);

export const logRuntimeEndpoints = (options) => {
	const { name } = options;
	const isMethod = name.includes(".methods.");
	const isPublication = name.includes(".publications.");
	let endpointType = "unknown";
	if (isMethod) {
		endpointType = "method";
	}
	if (isPublication) {
		endpointType = "publication";
	}

	const wrap = (originalFct, type) =>
		async function (...args) {
			const methodId = createMethodId();
			const logName = `${endpointType}:${name} (${methodId})`;
			const log = createLog({ name: logName });
			const error = createLog({ name: logName, type: "error" });

			// if we allow method to use these logs we can better
			// associate them by the given method id
			this.log = deprecate(log);
			this.error = deprecate(error);

			log(type, "invoked by", this.userId);

			try {
				return originalFct.apply(this, args);
			} catch (runtimeError) {
				// logError({
				//   error: methodRuntimeError,
				//   createdBy: environment.userId,
				//   createdAt: new Date(),
				//   isClient: false,
				//   isServer: true,
				//   isMethod: true,
				//   isPublication: false
				// })

				if (
					["Meteor.Error", "ClientError"].includes(
						runtimeError.errorType || runtimeError.name,
					)
				) {
					runtimeError.isClientSafe = true;
					runtimeError.isMethod = isMethod;
					runtimeError.isPublication = isPublication;
					error(runtimeError); // client safe errors are not logged on the server
				}

				throw runtimeError;
			}
		};

	options.run = wrap(options.run, "run");
	if (options.validate) {
		options.validate = wrap(options.validate, "validate");
	}

	return options;
};
