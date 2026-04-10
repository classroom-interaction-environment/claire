import "../imports/startup/client";
import "./main.html";

Template.body.onRendered(() => {
	document.documentElement.setAttribute("data-bs-theme", "light");
});
