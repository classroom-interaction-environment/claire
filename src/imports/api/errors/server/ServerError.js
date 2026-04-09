export class ServerError extends Meteor.Error {
	constructor(reason, details) {
		super("errors.serverError", reason, details);
	}
}
