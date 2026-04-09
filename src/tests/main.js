import "meteor/aldeed:collection2/static";
import { onClientExec, onServerExec } from "../imports/api/utils/archUtils";
import { initLanguage } from "../imports/api/language/initLanguage";

before(async () => {
	await initLanguage("en");
});

onClientExec(() => {
	require("./client/main");
});

onServerExec(() => {
	require("./server");
});
