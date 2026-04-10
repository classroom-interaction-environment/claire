import { Template } from "meteor/templating";
import { ReactiveDict } from "meteor/reactive-dict";
import { AutoForm } from "meteor/aldeed:autoform";
import { getLocalCollection } from "../../../../../infrastructure/collection/getLocalCollection";
import { dataTarget } from "../../../../../ui/utils/dataTarget";
import { getFilesCollection } from "../../../../../api/utils/getFilesCollection";
import { callMethod } from "../../../../../ui/controllers/document/callMethod";
import { loadIntoCollection } from "../../../../../infrastructure/loading/loadIntoCollection";
import fileUploadLanguage from "./i18n/fileUploadLanguage";
import "./fileUpload.html";

AutoForm.addInputType("customFileUpload", {
	template: "afCustomFileUpload",
	valueOut() {
		const value = this.val() || "";

		if (typeof value === "string") {
			return value;
		}

		try {
			return JSON.parse(value);
		} catch (e) {
			console.error(e);
			return value;
		}
	},
});

const defaultInsertOpts = {
	meta: {},
	isBase64: false,
	transport: "ddp",
	chunkSize: "dynamic",
	allowWebWorkers: true,
};

const API = Template.afCustomFileUpload.setDependencies({
	language: fileUploadLanguage,
});

Template.afCustomFileUpload.onCreated(function () {
	this.id = randomId();
	this.state = new ReactiveDict({ showUpload: true });

	const { atts, value } = this.data;
	const isPreview = atts.preview;

	if (atts.previewRenderer) {
		atts.previewRenderer
			.load()
			.catch(API.notify)
			.then(() => {
				this.state.set("previewTemplate", atts.previewRenderer.template);
			});
	}

	this.insertConfig = atts.insertConfig;
	this.state.set(atts);
	this.formId = AutoForm.getFormId();
	this.collection = getLocalCollection(atts.collection);
	this.files = new ReactiveDict();
	this.uploads = new Map();
	this.views = {
		select: "select",
		preUploadError: "preUploadError",
	};

	this.setView = (name) =>
		this.state.set({
			view: name,
			error: null,
		});
	this.setView(this.views.select);

	// ===========================================================================
	// DRAG / DROP
	// ===========================================================================

	// drag handling
	let dragCounter = 0;

	this.dragEnter = () => {
		if (dragCounter++ === 0) {
			this.state.set("dragOver", true);
		}
	};

	this.dragLeave = () => {
		if (--dragCounter === 0) {
			this.state.set("dragOver", false);
		}
	};

	// ===========================================================================
	// VALIDATION
	// ===========================================================================

	this.validate = (files) => {
		const { accept, multiple, maxSize } = atts;
		API.log("validate files", files);

		if (!multiple && files.length > 1) {
			return this.state.set({
				error: {
					error: "form.fileUpload.preUploadError",
					reason: "form.fileUpload.noMultiple",
					details: { length: files.length },
				},
				view: this.views.preUploadError,
			});
		}

		return files.some((file) => {
			// we primarily check for the type being an accepted type
			// however, there are various files (hello Microsoft) that have
			// varying types across versions or type mismatches with the general type def
			// so we fall back checking the ending against being the accepted
			const typeIsAccepted = isAccepted(file.type.toLowerCase(), accept);
			const endingAccepted = typeIsAccepted
				? true
				: isAccepted(file.name.toLowerCase().split(".").pop(), accept);

			if (!typeIsAccepted && !endingAccepted) {
				API.log("file invalid", { typeIsAccepted, endingAccepted, accept });
				this.state.set({
					error: {
						error: "form.fileUpload.preUploadError",
						reason: "form.fileUpload.notAccepted",
						details: { type: file.type, name: file.name, accept },
					},
					view: this.views.preUploadError,
				});
				return false;
			}

			if (file.size > maxSize) {
				this.state.set({
					error: {
						error: "form.fileUpload.preUploadError",
						reason: "form.fileUpload.sizeExceeded",
						details: {
							name: file.name,
							maxSize: (maxSize / 1000000).toFixed(2),
						},
					},
					view: this.views.preUploadError,
				});
				return false;
			}

			return true;
		});
	};

	/**
	 * Initializes the file upload, can be called from different
	 * events, like drop or files input change event.
	 *
	 * @param event
	 */
	this.prepareUpload = (event) => {
		this.state.set("dragOver", false);
		dragCounter = 0;

		const files = getFiles(event);
		const valid = this.validate(files);

		if (!valid) {
			return;
		}

		for (const file of files) {
			file.id = randomId();
			this.files.set(file.id, {
				id: file.id,
				name: file.name,
				type: file.type,
				size: file.size,
				progress: 0,
			});

			if (isPreview) {
				this.setFileProps(file.id, {
					progress: 100,
					complete: true,
					doc: {},
					isPreview,
				});
			} else {
				const upload = this.uploadFile(file);

				this.autorun((computation) => {
					const progress = Number.parseInt(upload.progress.get(), 10);
					const state = upload.state.get();

					if (progress >= 100 || ["completed", "aborted"].includes(state)) {
						computation.stop();
						this.setFileProps(file.id, { complete: true });
					} else {
						this.setFileProps(file.id, { progress });
					}
				});
			}
		}
	};

	this.setFileProps = (fileId, values) => {
		const stateFile = this.files.get(fileId);
		Object.assign(stateFile, values);
		this.files.set(fileId, stateFile);
	};

	// ===========================================================================
	// UPLOAD
	// ===========================================================================

	this.uploadFile = (file) => {
		API.log(this.id, "upload", file);
		const uploadOptions = Object.assign(
			{},
			defaultInsertOpts,
			this.insertConfig,
			{ file: file },
		);
		const filesCollection = getFilesCollection(atts.collection);
		const upload = filesCollection.insert(uploadOptions, false);
		const onError = (error) => {
			this.setFileProps(file.id, {
				error: {
					error: error.error,
					reason: error.reason || error.message,
					details: error.details,
				},
			});
		};
		upload.on("error", onError);
		upload.on("end", (error, doc) => {
			if (error) {
				return onError(error);
			}

			this.setFileProps(file.id, { doc, progress: 100, complete: true });
			this.updateField({
				id: this.id,
				value: doc._id,
				multiple: atts.multiple,
			});
		});

		upload.start();

		return upload;
	};

	// ===========================================================================
	// AF FIELD
	// ===========================================================================

	this.updateField = ({ id, value, remove = false, isMultiple = false }) => {
		const $input = this.$(`#afFileHiddenInput-${id}`);
		if (!isMultiple) {
			const newValue = remove && $input.val() === value ? null : value;
			$input.val(newValue);
			$input.trigger("input", newValue);
			return newValue;
		}

		const all = $input.val() || [];
		const index = all.indexOf(value);

		if (remove && index > -1) {
			all.splice(index, 1);
		}

		if (!remove && index === -1) {
			all.push(value);
		}

		$input.val(JSON.stringify(all));
		$input.trigger("input", all);
	};

	this.autorun(() => {
		const files = this.files.all();
		const values = Object.values(files);

		// if at least one of the files has neither a doc (complete)
		// nor an error, we assume there is still some upload going
		const complete = values.every((file) => !!file.doc || !!file.error);
		const uploading = values.length > 0 && !complete;
		const showUpload = values.length === 0 || uploading || atts.multiple;
		this.state.set({ uploading, showUpload });
	});

	// ===========================================================================
	// HANDLE EXISTING VALUE
	// ===========================================================================

	// we need to respect the original upload structure when loading an existing
	// file document:

	// { name, complete, progress, doc }

	// where doc is the files doc and the other values result from the upload

	const withExistingValue = async () => {
		const collection = getLocalCollection(atts.collection);
		const doc = collection.findOne(value);
		// 1. load into collection
		if (!doc) {
			await loadIntoCollection({
				name: `${atts.collection}.methods.my`,
				args: { ids: [value] },
				failure: (error) =>
					this.setFileProps(value, {
						error: {
							error: error.error,
							reason: error.reason || error.message,
							details: error.details,
						},
					}),
				collection: collection,
				success: (docs) => {
					// there may be the case, that the fileId exists but the
					// file has been deleted, then we raise a warning and clear
					// the file object to allow a new upload to take place
					if (!docs?.length) {
						return this.files.delete(value);
					}
					this.files.set(value, {
						name: docs[0].name,
						complete: true,
						progress: 100,
					});
					this.setFileProps(value, { doc: docs[0] });
				},
			});
		}

		// 2. get file and load into state file
		else {
			this.files.set(value, { name: doc.name, complete: true, progress: 100 });
			this.files.set(value, { doc });
		}
	};

	if (value) {
		withExistingValue().catch(API.notify);
	}
});

Template.afCustomFileUpload.onRendered(function () {
	const instance = this;
	// we use a mutation observer in order to detect, whether
	// the nearest fieldset is disabled or not and thus disable
	// the upload as well
	const hiddenInput = document.getElementById(
		`afFileHiddenInput-${instance.id}`,
	);
	const fieldset = hiddenInput.closest("fieldset");
	const observer = new window.MutationObserver(function callback(mutationList) {
		for (const mutation of mutationList) {
			if (
				mutation.type === "attributes" &&
				mutation.attributeName === "disabled"
			) {
				instance.state.set({ disabled: mutation.target.disabled });
			}
		}
	});
	observer.observe(fieldset, {
		attributeFilter: ["disabled"],
		attributeOldValue: true,
		subtree: false,
	});

	if (instance.data.value) {
		instance.updateField({
			id: instance.id,
			value: instance.data.value,
			multiple: instance.data.atts.multiple,
			remove: false,
		});
	}
});

Template.afCustomFileUpload.onDestroyed(function () {
	this.files.destroy();
});

Template.afCustomFileUpload.helpers({
	id() {
		return Template.instance().id;
	},
	disabled() {
		return Template.getState("disabled");
	},
	loadComplete() {
		return API.initComplete();
	},
	label() {
		return Template.getState("label");
	},
	accept() {
		return Template.getState("accept");
	},
	capture() {
		return Template.getState("capture");
	},
	dragOver() {
		return Template.getState("dragOver");
	},
	view(name) {
		return Template.getState("view") === name;
	},
	error() {
		return Template.getState("error");
	},
	files() {
		const instance = Template.instance();
		const files = instance.files.all();
		return Object.values(files);
	},
	dataSchemaKey() {
		return Template.instance().data.atts["data-schema-key"];
	},
	uploading() {
		return Template.getState("uploading");
	},
	deleting(id) {
		const deleting = Template.getState("deleting");
		return deleting?.[id];
	},
	previewData(file) {
		return Template.getState("previewTemplate") && file?.doc;
	},
	previewTemplate() {
		return Template.getState("previewTemplate");
	},
	fileIcon() {
		return Template.getState("icon") || "paperclip";
	},
	showUpload() {
		return Template.getState("showUpload");
	},
});

Template.afCustomFileUpload.events({
	"dragenter .upload-drop-zone"(_event, templateInstance) {
		templateInstance.dragEnter();
	},
	"dragover .upload-drop-zone"(event) {
		// File(s) in drop zone
		// Prevent default behavior (Prevent file from being opened)
		event.preventDefault();
	},
	"dragleave .upload-drop-zone"(_event, templateInstance) {
		templateInstance.dragLeave();
	},
	"drop .upload-drop-zone"(event, templateInstance) {
		// File(s) dropped
		// Prevent default behavior (Prevent file from being opened)
		event.preventDefault();
		templateInstance.prepareUpload(event.originalEvent || event);
	},
	"click .state-btn"(event, templateInstance) {
		event.preventDefault();
		templateInstance.setView(dataTarget(event, templateInstance));
	},
	"change [data-files-collection-upload]"(event, templateInstance) {
		if (dataTarget(event, templateInstance, "id") !== templateInstance.id) {
			return;
		}

		templateInstance.prepareUpload(event.originalEvent || event);
	},
	"click .delete-btn"(event, templateInstance) {
		event.preventDefault();

		const _id = dataTarget(event, templateInstance);
		const stateId = dataTarget(event, templateInstance, "id") || _id;

		if (!_id) {
			return templateInstance.files.delete(stateId);
		}

		callMethod({
			name: `${templateInstance.data.atts.collection}.methods.delete`,
			args: { _id },
			prepare: () => {
				const deleting = templateInstance.state.get("deleting") || {};
				deleting[stateId] = true;
				templateInstance.state.set({ deleting });
			},
			receive: () => {
				const deleting = templateInstance.state.get("deleting") || {};
				delete deleting[stateId];
				templateInstance.state.set({ deleting });
			},
			failure: API.notify,
			success: () => {
				templateInstance
					.$(`#afFileHiddenInput-${templateInstance.id}`)
					.trigger("input");
				templateInstance.files.delete(stateId);
				templateInstance.updateField({
					id: templateInstance.id,
					value: _id,
					multiple: templateInstance.data.atts.multiple,
					remove: true,
				});
				API.notify(true);
			},
		});
	},
});

// /////////////////////////////////////////////////////////////////////////////
//
//  PRIVATE
//
// /////////////////////////////////////////////////////////////////////////////

function randomId() {
	return Math.random().toString(36).replace("0.", "");
}

/**
 * Extracts files from a given event when dropped or selected
 * @param event
 * @return {*}
 */
function getFiles(event) {
	// use direct attachment if file input was used
	if (!event.dataTransfer) {
		const target = event.target || event.currentTarget;
		return Array.from(target.files);
	}

	// Use DataTransferItemList interface to access the file(s)
	else if (event.dataTransfer.items) {
		return Array.from(event.dataTransfer.items).map((entry) =>
			entry.getAsFile(),
		);
	}

	// Use DataTransfer interface to access the file(s)
	else {
		return Array.from(event.dataTransfer.files);
	}
}

/**
 * Check if a mime type matches the set given in accept.
 * Credits: https://stackoverflow.com/a/66489392
 *
 * @param type the mime type to test, ex image/png
 * @param accept the mime types to accept, ex audio/*,video/*,image/png
 * @returns true if the mime is accepted, false otherwise
 */
function isAccepted(type, accept) {
	const allowed = accept.split(",").map((x) => {
		let trimmed = x.trim();

		if (trimmed.charAt(0) === ".") {
			trimmed = trimmed.substring(1, trimmed.length);
		}

		return trimmed;
	});

	if (allowed.includes(type)) {
		return true;
	}

	const split = type.split("/");

	return allowed.includes(`${split[0]}/*`) || allowed.includes(split[1]);
}
