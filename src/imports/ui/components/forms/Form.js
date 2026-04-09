import { ReactiveVar } from "meteor/reactive-var";
import { createLog } from "../../../api/log/createLog";
import { setFatalError } from "../fatal/fatal";
import "meteor/aldeed:autoform/dynamic";
import { AutoFormPassword2 } from "meteor/jkuester:autoform-password2/dynamic";
import { AutoFormThemeBootstrap5 } from "meteor/communitypackages:autoform-bootstrap5/dynamic";

const initialized = new ReactiveVar();
const formName = "Form";
const debug = createLog({ name: formName, type: "debug", devOnly: true });

export const Form = {};
Form.name = formName;

Form.initialized = () => {
	if (!initialized.get()) {
		initForms()
			.then(() => initialized.set(true))
			.catch((e) => setFatalError(e));
	}
	return initialized;
};

Form.renderer = {
	template: "caroForm",
	load: async () => import("./caroform/caroform"),
};

export const initForms = async function initForms() {
	debug("laod AutoForm");
	await AutoForm.load();

	debug("load BS4 theme");
	await AutoFormThemeBootstrap5.load();
	AutoForm.setDefaultTemplate("bootstrap5");

	await AutoFormPassword2.load();

	debug("load renderer");
	Form.renderer.load();
};
