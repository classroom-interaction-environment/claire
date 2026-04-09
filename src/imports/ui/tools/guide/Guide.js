import { check, Match } from "meteor/check";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { i18n } from "../../../api/language/language";
import { markGuideAsRead } from "./markGuideAsRead";

export const Guide = {};

Guide.hasViewed = (key, user) => {
	if (internal.debug) {
		internal.debug("hasViewed", key, user?.ui?.guide, user?.ui?.guide?.[key]);
		if (Object.hasOwn(internal.hasViewed, key)) {
			internal.debug("hasViewed use override", key, internal.hasViewed[key]);
			return internal.hasViewed[key];
		}
	}
	// this is a little scope creepy, but
	// for now we have only this place where we need to check
	const value = user?.ui?.guide?.[key];
	return value === true;
};

const defaults = { debug: null, hasViewed: {} };
const internal = { ...defaults };
const debug = (...args) => {
	if (internal.debug) {
		internal.debug(...args);
	}
};

Guide.debug = (otions) => {
	const override = otions === null ? defaults : otions;
	Object.assign(internal, override);
	debug("Guide debug set with options:", override);
};

const createDriver = ({ allowClose, opacity, steps, ...additionalOptions }) => {
	debug("createDriver", { allowClose, opacity, steps, additionalOptions });
	return driver({
		allowClose,
		overlayOpacity: opacity,
		showButtons: ["next", "previous", "close"],
		doneBtnText: i18n.get("wizard.finish"),
		closeBtnText: i18n.get("actions.close"),
		nextBtnText: i18n.get("wizard.next"),
		prevBtnText: i18n.get("wizard.back"),
		animate: true,
		showProgress: true,
		steps: transformSteps(steps),
		onPopoverRender: (popover) => {
			const closeBtn = popover.wrapper.querySelector(
				".driver-popover-close-btn",
			);
			if (closeBtn) {
				closeBtn.style.display = "inline-block";
			}
		},
		...additionalOptions,
	});
};

const j = (query) => {
	const instance = Template.instance();
	return instance ? instance.$(query) : $(query);
};

const transformSteps = (steps) => {
	return steps.map((step) => {
		const { element, elements, ...options } = step;
		const target = elements?.length > 0 ? elements.shift() : element;
		const config = { element: target, ...options };
		if (elements?.length) {
			config.onHighlightStarted = () => {
				for (const query of elements) {
					const el = j(query);
					const zIndex = el.css("z-index");
					el.data("old-z-index", zIndex);
					el.css("z-index", 10001);
				}
			};
			config.onDeselected = () => {
				for (const query of elements) {
					const el = j(query);
					const oldZIndex = el.data("old-z-index");
					el.css("z-index", oldZIndex);
				}
			};
		}
		return config;
	});
};

const createStep = (options) => {
	check(
		options,
		Match.ObjectIncluding({
			target: Match.Any,
		}),
	);

	const { target, title, description, side = "top", showButtons } = options;
	const step = {
		element: target,
	};

	if (title) {
		step.popover = step.popover || {};
		step.popover.title = title;
	}

	if (description) {
		step.popover = step.popover || {};
		step.popover.description = description;
	}

	if (side) {
		step.popover = step.popover || {};
		step.popover.side = side;
	}

	if (showButtons) {
		step.popover = step.popover || {};
		step.showButtons = showButtons;
	}

	return step;
};

Guide.highlight = function highlight({
	target,
	title,
	description,
	position,
	showButtons,
	allowClose = false,
	opacity = 0.75,
}) {
	const driver = createDriver({ allowClose, opacity });
	const step = createStep({
		target,
		title,
		description,
		position,
		showButtons,
	});
	driver.highlight(step);
	return driver;
};

Guide.tour = ({
	key,
	allowClose = false,
	opacity = 0.75,
	steps,
	...additionalOptions
}) => {
	const instance = createDriver({
		allowClose,
		opacity,
		steps,
		...additionalOptions,
	});
	return {
		autostart(fn) {
			const computation = (c) => {
				const start = () => {
					debug("autostart guide", key);
					this.start();
					markGuideAsRead(key).catch(console.error);
					c.stop();
				};
				const stop = () => {
					debug("autostop guide", key);
					c.stop();
				};
				const value = fn({
					key,
					hasViewed: (user) => (Guide.hasViewed(key, user) ? "stop" : "start"),
					start,
					stop,
				});
				if (value === "start") start();
				if (value === "stop") stop();
				debug("autostart skip value", key, value);
			};
			const instance = Template.instance();
			this.tracker = instance
				? instance.autorun(computation)
				: Tracker.autorun(computation);
		},
		start() {
			if (instance) {
				debug("start guide", key);
				instance.drive();
			}
		},
		dispose() {
			debug("dispose", key);
			if (instance) {
			}
			if (this.tracker) {
				this.tracker.stop();
			}
		},
	};
};

window.debugGuide = Guide.debug;
