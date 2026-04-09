import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Tracker } from "meteor/tracker";
import { ReactiveVar } from "meteor/reactive-var";
import { FlowRouter, RouterHelpers } from "meteor/ostrio:flow-router-extra";
import { createLog } from "../log/createLog";
import { loggedIn } from "../accounts/user/loggedIn";

const debug = createLog({ name: "Router", type: "debug" });

/**
 * Facade to a router to support a common definition for routing in case
 * the underlying router will change or be replaced due to a better version
 * or when development of the router stopped.
 */
export const Router = {};

Router.src = FlowRouter;

Router.go = (value, ...optionalArgs) => {
	const type = typeof value;
	if (type === "object" && value !== null) {
		const path = value.path(...optionalArgs);
		debug("go", path);
		return FlowRouter.go(path);
	} else if (type === "string") {
		debug("go", value);
		return FlowRouter.go(value);
	} else {
		throw new Error(
			`Unexpected format: [${typeof type}], expected string or object`,
		);
	}
};

Router.has = (path) => paths[path];

Router.location = ({ pathName } = {}) => {
	if (pathName) {
		return FlowRouter.current().route.name;
	}
	return FlowRouter.current().path;
};

Router.current = (options = {}) => {
	if (options.reactive) {
		FlowRouter.watchPathChange();
	}
	return FlowRouter.current();
};

Router.param = (value) => {
	if (typeof value === "object") {
		return FlowRouter.setParams(value);
	}
	if (typeof value === "string") {
		return FlowRouter.getParam(value);
	}
	throw new Error(
		`Unexpected format: [${typeof value}], expected string or object`,
	);
};

Router.queryParam = (value) => {
	if (typeof value === "object") {
		return FlowRouter.setQueryParams(value);
	}
	if (typeof value === "string") {
		return FlowRouter.getQueryParam(value);
	}
	throw new Error(
		`Unexpected format: [${typeof type}], expected string or object`,
	);
};

let _defaultTarget = "body";

Router.setDefaultTarget = (value) => {
	_defaultTarget = value;
};

const paths = {};

/*
    .whileWaiting() hook
    .waitOn() hook
    .waitOnResources() hook
    .endWaiting() hook
    .data() hook
    .onNoData() hook
    .triggersEnter() hooks
    .action() hook
    .triggersExit() hooks
 */
function createRoute(routeDef, onError) {
	return {
		name: routeDef.key,
		whileWaiting() {
			const title = loggedIn() ? routeDef.label : "";

			// we render by default a "loading" template if the Template has not been loaded yet
			// which can be explicitly prevented by switching showLoading to false
			if (!Template[routeDef.template] && routeDef.showLoading !== false) {
				// we need to check, whether the target exists, since there are
				// routes that dynamically load the render target before using it
				const loadingRenderTarget =
					routeDef.target && Template[routeDef.target]
						? routeDef.target
						: _defaultTarget;
				this.render(loadingRenderTarget, "loading", {
					title,
					requireTranslate: true,
				});
			}
		},
		async waitOn() {
			debug("waitOn", routeDef.key);
			const loggingIn = new Promise((resolve) => {
				Tracker.autorun((computation) => {
					const loadComplete = !Meteor.loggingIn(); // && Roles.subscription.ready()
					if (loadComplete) {
						computation.stop();
						resolve();
					}
				});
			});
			try {
				debug("loading route", routeDef.key);
				await routeDef.load();
				debug("resolve logging in", routeDef.key);
				await loggingIn;
				debug("route loaded", routeDef.key);
				return true;
			} catch (err) {
				debug("failed to load", routeDef.key);
				console.error(err);
				Router.go("/");
			}
		},
		triggersEnter: routeDef.triggersEnter?.(),
		action(params, queryParams) {
			debug("action", routeDef.key, params, queryParams);
			// if we have loaded the template but it is not available
			// on the rendering pipeline through Template.<name> we
			// just skip the action and wait for the next rendering cycle
			if (!Template[routeDef.template]) {
				console.warn(
					"[Router]: skipping yet undefined template",
					routeDef.template,
				);
				const label =
					typeof routeDef.label === "function"
						? routeDef.label()
						: routeDef.label;

				Router.label(label);

				return setTimeout(() => {
					// Router.refresh(routeDef.target || _defaultTarget, 'loading')
				}, 50);
			}

			const hasAction = routeDef.onAction;
			debug("route hasAction", routeDef.label, "→", hasAction, routeDef);
			if (hasAction) {
				routeDef.onAction(params, queryParams);
			}

			window.scrollTo(0, 0);
			const data = routeDef.data || {};
			data.params = params;
			data.queryParams = queryParams;
			data.lastRoute = Object.assign({}, lastRoute);
			lastRoute.search = window.location.search;
			lastRoute.pathname = window.location.pathname;

			const label =
				typeof routeDef.label === "function"
					? routeDef.label()
					: routeDef.label;

			Router.label(label);

			try {
				this.render(routeDef.target || _defaultTarget, routeDef.template, data);
			} catch (e) {
				console.error(e);
				if (typeof onError === "function") {
					onError(e);
				}
			}
		},
	};
}

const lastRoute = {
	search: "",
	pathname: "",
};

const _currentLabel = new ReactiveVar();

Router.label = function label(value) {
	if (value) {
		_currentLabel.set(value);
	}

	return _currentLabel.get();
};

Router.register = (routeDefinition) => {
	debug("register", routeDefinition.path());
	const path = routeDefinition.path();
	paths[path] = routeDefinition;
	const routeInstance = createRoute(routeDefinition);
	return FlowRouter.route(path, routeInstance);
};

Router.reload = () => FlowRouter.reload();

Router.refresh = (target, template) => FlowRouter.refresh(target, template);

Router.isActive = (name) => RouterHelpers.name(name);
