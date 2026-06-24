import { Template } from "meteor/templating";
import { createDeleteFile } from "../../../shared/createDeleteFile";
import { DocumentFiles } from "../../DocumentFiles";
import { getFilesLink } from "../../../getFilesLink";
import PDFObject from "pdfobject";
import { hasThumbnail, getThumbnail } from "../helpers/thumbnail";
import "../../../../../ui/components/download/downloadButton";
import "./documentFileRenderer.scss";
import "./documentFileRenderer.html";

const API = Template.documentFileRenderer.setDependencies({
	contexts: [DocumentFiles],
});

API.useFallback = false;

Template.documentFileRenderer.onCreated(function () {
	this.deleteFile = createDeleteFile({
		context: DocumentFiles,
		onSuccess: () => API.notify(true),
		onError: API.notify,
	});
});

Template.documentFileRenderer.onRendered(function () {
	const { data } = this;

	if (data?.isPDF) {
		const pdfUrl = getFilesLink({
			file: data,
			name: DocumentFiles.name,
		});

		this.state.set({ pdfUrl });

		if (PDFObject.supportsPDFs) {
			const selector = `#document-file-${data._id}`
			PDFObject.embed(pdfUrl, document.querySelector(selector), {
				height: "60vh",
				title: data.name,
				pdfOpenParams: {
					comment: "A comment",
					view: "Fit",
					pagemode: "none",
					scrollbar: "1",
					toolbar: "1",
					statusbar: "1",
					messages: "1",
					navpanes: "1",
				},
				fallbackLink: `<p>${pdfUrl}?download=true</p>`, // `<p>${i18n.get('files.noPDF')} <a href="" download="${data.name}" target="_top">${i18n.get('actions.download')}</a></p>`
			});

			setTimeout(() => {
				const $pdfObject = this.$(".pdfobject");

				if ($pdfObject.get(0)) {
					API.log("PDF rendered natively");
					this.state.set("rendered", true);
				}
			}, 500);
		} else {
			API.log("no native PDF support");
		}
	}
});

Template.documentFileRenderer.helpers({
	getLink(documentFile) {
		return getFilesLink({
			file: documentFile,
			name: DocumentFiles.name,
		});
	},
	targetId () {
		return Template.instance().data._id;
	},
	file() {
		return Template.instance().data;
	},
	rendered() {
		return Template.getState("rendered");
	},
	pdfUrl() {
		return Template.getState("pdfUrl");
	},
	collectionName() {
		return DocumentFiles.name;
	},
	hasThumbnail,
	getThumbnail,
});

Template.documentFileRenderer.events({
	"click .delete-docfile-button"(event, templateInstance) {
		event.preventDefault();
		templateInstance.deleteFile(event);
	},
	"click .use-fallback"(event, templateInstance) {
		event.preventDefault();
		const pdfUrl = templateInstance.state.get("pdfUrl");
		templateInstance.renderPDFJSFallback(pdfUrl);
	},
});
