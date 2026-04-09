import { Meteor } from "meteor/meteor";

/**
 * Helper to return a value only on server.
 * @param x {*} Value to return on server
 * @return {*|undefined}
 */
export const onServer = (x) => (Meteor.isServer ? x : undefined);

/**
 * Helper to execute a function only on server and return its result.
 * @example
 * onServerExec(() => {
 *   Meteor.call('myServerMethod')
 * })
 * @example
 * new ValidatedMethod({
 *   name: 'myMethod',
 *   run: onServerExec(() => {
 *     const {serverOnlyCode} = require('./serverOnlyCode')
 *
 *     // this gets assigned as "run" function
 *     // but only on the server
 *     return async function (args) {
 *       const { userId } = this
 *       return serverOnlyCode({ userId, args })
 *     }
 *   })
 * })
 *
 * @param fct {function}
 * @return {*|undefined}
 */
export const onServerExec = (fct) => (Meteor.isServer ? fct() : undefined);

/**
 * Helper to return a value only on client.
 * @param x {*} Value to return on client
 * @return {*|undefined}
 */
export const onClient = (x) => (Meteor.isClient ? x : undefined);

/**
 * Helper to execute a function only on client and return its result.
 * @param fct {function}
 * @return {*|undefined}
 */
export const onClientExec = (fct) => (Meteor.isClient ? fct() : undefined);

/**
 * Helper to automatically execute a function and return its result.
 * @param fct {function}
 */
export const auto = (fct) => fct();

/**
 * Isomorphic execution helper to easily write isomorphic code.
 * Executes and returns the result of `client` function on client,
 * and the result of `server` function on server.
 *
 * @param client {function=} Function to execute on client
 * @param server {function=} Function to execute on server
 * @return {*|null}
 */
export const isomporph = ({ client, server }) => {
	if (Meteor.isClient && client) {
		return client();
	}
	if (Meteor.isServer && server) {
		return server();
	}
	return null;
};

/**
 * Throws an error if not executed on server.
 * @example
 * const myFunc = () => {
 *   ensureServer()
 *   // ...continue with server-only logic
 * }
 */
export const ensureServer = () => {
	if (!Meteor.isServer) throw new Error("Scope is expected to be server-only!");
};

/**
 * Throws an error if not executed on client.
 * @example
 * const myFunc = () => {
 *   ensureClient()
 *   // ...continue with client-only logic
 * }
 */
export const ensureClient = () => {
	if (!Meteor.isClient) throw new Error("Scope is expected to be client-only!");
};
