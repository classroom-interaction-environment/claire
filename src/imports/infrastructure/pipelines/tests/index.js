/* eslint-env mocha */
import { onClientExec, onServerExec } from "../../../api/utils/archUtils";

describe("pipelines", () => {
	require("./createPipeline.tests");

	onServerExec(() => {
		require("../server/buildPipeline.tests");
	});

	onClientExec(() => {
		require("../client/buildPipeline.tests");
	});
});
