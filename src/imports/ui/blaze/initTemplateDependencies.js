import { Meteor } from "meteor/meteor";
import { ReactiveVar } from "meteor/reactive-var";
import { Notify } from "../components/notifications/Notify";
import { SubscriptionRegistry } from "../subscriptions/SubscriptionRegistry";
import { SubsManager } from "../subscriptions/SubsManager";
import { DocNotFoundError } from "../../api/errors/types/DocNotFoundError";
import { Schema } from "../../api/schema/Schema";
import { detectUserLanguage } from "../../api/language/detectUserLanguage";

/**
 * Initializes a template to implement minimal requirements.
 * Understand it as a procedure all Templates need to undergo in order to
 *
 * - provide dynamic language loading
 * - provide flexible subscriptions management
 * -
 *
 * @param contexts
 * @param loaders
 * @param language
 * @param debug
 * @param useForms
 * @param onError
 * @param onComplete
 * @return {TemplateInstance.api}
 */
export const initTemplateDependencies = function initTemplate({
	contexts = [],
	loaders = [],
	useForms,
	language,
	debug,
	onError = () => {},
	onComplete = () => {},
}) {
	// we wrap all the imports here to fasten-up the client-bundle interpreter
	const { Template } = require("meteor/templating");
	const { Tracker } = require("meteor/tracker");
	const { i18n } = require("../../api/language/language");
	const { getCollection } = require("../../api/utils/getCollection");
	const {
		getLocalCollection,
	} = require("../../infrastructure/collection/getLocalCollection");
	const { initContext } = require("../../startup/client/contexts/initContext");
	const { setFatalError } = require("../components/fatal/fatal");
	const { createLog } = require("../../api/log/createLog");
	const { initOnce } = require("../../infrastructure/loading/initOnce");
	const { initLanguage } = require("../../api/language/initLanguage");
	const { initForms } = require("../components/forms/Form");
	this.initComplete = new ReactiveVar(false);

	// this will be used to store all reactive sources
	// and to check whether all our init routines have been completed
	const allComplete = [];
	const onDestroy = [];

	// logs
	const { viewName } = this;
	const log = createLog({ name: viewName });
	const warn = createLog({ name: viewName, type: "warn" });
	const debugLog = debug
		? createLog({ name: viewName, type: "debug" })
		: () => {};
	debugLog("init");

	const api = {};
	this.api = api;

	api.initComplete = () => this.initComplete.get();
	api.notify = notify;
	api.ensureDocument = ensureDocument;
	api.createSchema = createSchema;

	const modal = (id, action) => {
		const modalId = id.includes("#") ? id : `#${id}`;
		const instance = Template.instance();
		const target = instance || window;
		target.$(modalId).modal(action);
	};

	api.showModal = (id) => modal(id, "show");
	api.hideModal = (id) => modal(id, "hide");

	Object.assign(api, {
		log,
		debug: debugLog,
		warn,
		fatal: setFatalError,
		translate: (...args) => i18n.get(...args),
		translateReactive: (...args) => i18n.reactive(...args),
		getLocalCollection,
		getCollection,
		setFatalError,
		subscribe: (options) => {
			options.debug = options.debug ?? debugLog;
			return subscribe(options);
		},
		unsubscribe: (name) => SubsManager.unsubscribe(name),
		initContext,
		dispose: (key, { onError = console.error } = {}) => {
			try {
				clearSubs(key);
				for (const onDestroyFunc of onDestroy) {
					onDestroyFunc();
				}
				onDestroy.length = 0;
			} catch (e) {
				onError(e);
			}
		},
	});

	const complete = () => {
		debugLog("init complete");
		this.initComplete.set(true);
		onComplete();
	};

	// We use a convention to provide the respective collections by using
	// the context name, make it's first character uppercase and add a
	// "Collection" suffix to it. Example: 'units' => 'UnitsCollection'
	for (const ctx of contexts) {
		debugLog("init ctx", ctx.name);
		initContext(ctx);
	}

	const errorHandler =
		onError ||
		createLog({
			name: this.view.name,
			type: "error",
			devOnly: false,
		});

	if (useForms) {
		allComplete.push(
			initOnce(initForms, {
				onError: errorHandler,
			}),
		);
	}

	// we always need to ensure the language is initialized
	allComplete.push(
		initOnce(initLanguage, {
			onError: errorHandler,
			name: "language",
			options: detectUserLanguage(Meteor.user()),
		}),
	);

	// custom loaders can be added as async functions
	if (loaders.length > 0) {
		allComplete.push(
			...loaders.map((loader) =>
				initOnce(loader, {
					onError: errorHandler,
				}),
			),
		);
	}

	if (allComplete.length === 0) {
		complete();
		return api;
	}

	Tracker.autorun((computation) => {
		if (!allComplete.every((rv) => rv.get())) {
			return;
		}

		// once complete we can stop the tracker and
		// finally try to add template-level translations
		computation.stop();

		if (language) {
			const addTranslations = async () => {
				const { addToLanguage } = await import(
					"../../api/language/addToLanguage"
				);
				return addToLanguage(language);
			};

			const handleLocaleChange = () => {
				this.initComplete.set(false);
				addTranslations()
					.catch((e) => {
						setFatalError(e);
						errorHandler(e);
					})
					.then(() => {
						setTimeout(() => this.initComplete.set(true), 300);
					});
			};

			i18n.onLocaleChange(handleLocaleChange);
			onDestroy.push(() => {
				i18n.onLocaleChange(handleLocaleChange, { remove: true });
			});

			addTranslations()
				.catch((e) => {
					setFatalError(e);
					errorHandler(e);
				})
				.then(() => complete());
		} else {
			complete();
		}
	});

	// instance-level

	this.onCreated(function () {
		this._lookup = new Map();

		this.lookup = (selector) => {
			if (!this._lookup.has(selector)) {
				const component = this.$(selector);
				if (!component) {
					warn("no component found for lookup:", selector);
				} else {
					this._lookup.set(selector, component);
				}
			}

			return this._lookup.get(selector);
		};
	});

	return api;
};

// /////////////////////////////////////////////////////////////////////////////
//
// INTERNAL
//
// /////////////////////////////////////////////////////////////////////////////

/**
 * Subscribes to a publication and allows key-based unsubsribing when the
 * Templates are destroyed. This allows to handle unsubscribing in most upper
 * level of parents and keep child templates lightweight.
 *
 * @param key {String} the subscription key to group subs
 * @param name {String|Object} name or {{name}} Object
 * @param args {Object|undefined} subscription args
 * @param callbacks {Object|undefined} onReady and onStop callbacks
 * @param debug {function} debug function
 * @return {*|{ready}}
 */

const subscribe = ({ key, name, args, callbacks, debug = noop }) => {
	const onError = (e) => {
		debug("subscription error", e);
		if (callbacks?.onError) callbacks?.onError(e);
	};
	const onReady = () => {
		debug("subscription ready");
		if (callbacks?.onReady) callbacks?.onReady();
	};
	try {
		const pubName = typeof name === "object" ? name.name : name;
		debug("subscribing to", pubName, "with key", key, "with args", args);
		SubscriptionRegistry.registerTemplate(key);
		SubscriptionRegistry.add(key, pubName);
		return SubsManager.subscribe(pubName, args, { onError, onReady });
	} catch (e) {
		onError(e);
	}
};

/**
 * Disposes dependencies like subscriptions and such by given key
 * @param key
 */
const clearSubs = (key) => {
	const allSubs = SubscriptionRegistry.getAll(key);
	for (const subName of allSubs) {
		SubsManager.unsubscribe(subName);
	}
};

/**
 * Raises an error
 * @param document {object} the document to be checked
 * @param docId {string=} optional docId to be added to the error
 * @param notify {boolean=} optional flag, shows error notification if true
 */
const ensureDocument = (document, docId, notify = false) => {
	if ([undefined, null].includes(document)) {
		const err = new DocNotFoundError(docId);
		if (notify) notify(err);
		throw err;
	}
};

/**
 * Creates a new schema, either with defaults or standalone.
 * @param schema
 * @param options
 * @param deprecatedOpt
 * @return {schema}
 */
const createSchema = (schema, options = {}, deprecatedOpt) => {
	if (deprecatedOpt) throw new Error("deprected");
	const { withDefault = false } = options;
	delete options.withDefault;

	return withDefault
		? Schema.withDefault(schema, options)
		: Schema.create(schema, options);
};

/**
 * Adds a new notification to the queue. If value is an error it will
 * raise an error notification.
 * If value is true or string, raises a success notification with default
 * message.
 * If value is an object passes the object to the notification method.
 * @param value
 */
const notify = (value) => {
	if (value instanceof Error) {
		return Notify.error(value);
	}

	if (value === true) {
		return Notify.add({
			type: "success",
			message: "common.success",
			icon: "check",
		});
	}
	if (value === false) {
		return Notify.add({
			type: "danger",
			message: "common.failed",
			icon: "times",
		});
	}

	if (typeof value === "string") {
		return Notify.add({
			type: "success",
			message: value,
			icon: "check",
		});
	}

	Notify.add(value);
};
