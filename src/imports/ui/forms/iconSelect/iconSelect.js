import { Template } from "meteor/templating";
import { getAllFontAwesomeIcons } from "../../utils/getAllFontAwesomeIcons";
import { dataTarget } from "../../utils/dataTarget";
import { asyncTimeout } from "../../../api/utils/asyncTimeout";
import { debounce } from "../../../api/utils/debounce";
import "./iconSelect.html";
import "./iconSelect.scss";
import "./autoform";

Template.afIconSelect.setDependencies({});

Template.afIconSelect.onCreated(function () {
	const allIcons = getAllFontAwesomeIcons();
	const allKeys = Object.keys(allIcons);

	this.setDefault = () => {
		this.state.set({ searchAvailable: false });
		setTimeout(
			() => this.state.set({ icons: allKeys, searchAvailable: true }),
			300,
		);
	};

	this.search = (name) => {
		const out = [];
		const lowercaseName = name.toLowerCase();
		for (const key in allIcons) {
			if (key.includes(lowercaseName)) {
				out.push(key);
			}
		}
		return out;
	};

	this.setDefault();
});

Template.afIconSelect.onRendered(function () {
	// at first we set the existing value,
	// for example in case this is an update form
	if (this.data.value) {
		this.state.set({ selectedIcon: this.data.value });
		updateHiddenField(this.data.value, this);
	}

	// then we setup our intersection observer to prevent
	// blocking the main thread with rendering 1000+ icons...
	const options = {
		root: this.lookup(".icon-select-container").get(0),
		rootMargin: "0px",
		threshold: 0.0,
	};

	const byWhiteSpace = /\s+/g;
	const classNames =
		"btn btn-sm btn-outline-secondary border-0 select-icon-btn".split(
			byWhiteSpace,
		);
	const iconClassNames = "fa fas fa-fw".split(byWhiteSpace);
	const callback = (entries, observer) => {
		for (const entry of entries) {
			if (!entry.isIntersecting) {
				return;
			}

			// make sure to skip, in case observer.unobserved has not been reached yet
			const transformed = entry.target.getAttribute("data-transformed");
			if (transformed) {
				return;
			}

			entry.target.classList.add(...classNames);
			entry.target.setAttribute("data-transformed", true);

			const first = entry.target.firstElementChild;
			const name = entry.target.getAttribute("data-name");
			const icon = document.createElement("i");
			icon.classList.add(...iconClassNames);
			icon.classList.add(`fa-${name}`);
			entry.target.appendChild(icon);
			entry.target.removeChild(first);

			observer.unobserve(entry.target);
		}
	};

	this.observer = new window.IntersectionObserver(callback, options);

	this.autorun(() => {
		const icons = this.state.get("icons");
		if (icons?.length > 0) {
			setTimeout(() => {
				const $nodes = this.$(".icon-container");
				for (const node of Object.values($nodes)) {
					if (!(node instanceof window.Element)) {
						return;
					}
					this.observer.observe(node);
				}
			}, 500);
		}
	});
});

Template.afIconSelect.helpers({
	icons() {
		return Template.getState("icons");
	},
	searchAvailable() {
		return Template.getState("searchAvailable");
	},
	selectedIcon() {
		return Template.getState("selectedIcon");
	},
	inputAtts() {
		return Template.currentData().atts;
	},
	setIcon() {
		return Template.getState("setIcon");
	},
});

Template.afIconSelect.onDestroyed(function () {
	this.observer.disconnect();
});

Template.afIconSelect.events({
	"click .select-icon-btn": async (event, templateInstance) => {
		event.preventDefault();
		const selectedIcon = dataTarget(event, templateInstance, "name");
		updateHiddenField(selectedIcon, templateInstance);
		templateInstance.state.set("setIcon", true);
		await asyncTimeout(100);
		templateInstance.state.set({ selectedIcon });
		templateInstance.state.set("setIcon", false);
	},
	"input .search-icon-input": debounce((_event, templateInstance) => {
		const $search = templateInstance.lookup(".search-icon-input");
		const name = $search.val();
		if (!name?.length) {
			return templateInstance.setDefault();
		}
		if (name.length < 3) {
			return;
		}
		const icons = templateInstance.search(name);
		templateInstance.state.set({ icons });
	}, 250),
});

const updateHiddenField = (name, templateInstance) => {
	const $hidden = templateInstance.lookup(".hidden-input");
	$hidden.val(name);
};
