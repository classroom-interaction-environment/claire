import { Match } from "meteor/check";
export const isContext = () => ({
	name: String,
	label: Match.Maybe(String),
	icon: Match.Maybe(String),
});
