/* global describe it */
import { Random } from "meteor/random";
import { expect } from "chai";
import { PasswordConfig } from "../PasswordConfig";

describe("PasswordConfig", () => {
	describe("constructor", () => {
		it("can be created without options, using defaults", () => {
			const config = PasswordConfig.from();
			expect(config.id).to.be.a("string");
			const defaults = PasswordConfig.defaults();
			const all = config.all();
			delete all.rules;
			expect(all).to.deep.equal(defaults);
		});

		it("can be created with options", () => {
			const settings = {
				min: {
					value: 111,
					rule: false,
				},
				max: {
					value: 123,
					rule: false,
				},
				allowedChars: {
					value: "[0-9]",
					rule: true,
					message: "only numbers",
				},
				icon: "foobar",
				confirm: false,
				rules: [
					{
						test: () => {},
						message: () => {},
					},
				],
				blacklist: [],
			};
			const config = PasswordConfig.from(settings);
			expect(config.all()).to.not.deep.equal(PasswordConfig.defaults());
		});
	});

	describe("values", () => {
		it("icon", () => {
			const config = PasswordConfig.from({ icon: "lock" });
			expect(config.icon()).to.equal("lock");
			expect(config.icon()).to.not.equal(PasswordConfig.defaults().icon);
		});
		it("min", () => {
			const config = PasswordConfig.from({ min: 16 });
			expect(config.min()).to.equal(16);
			expect(config.min()).to.not.equal(PasswordConfig.defaults().min.value);
		});
		it("max", () => {
			const config = PasswordConfig.from({ max: 161 });
			expect(config.max()).to.equal(161);
			expect(config.max()).to.not.equal(PasswordConfig.defaults().max.value);
		});
		it("allowedChars", () => {
			const config = PasswordConfig.from({ allowedChars: "[a-z]" });
			const allowedChars = new RegExp(config.allowedChars(), "gi");
			expect(allowedChars.test("abcdefghijklmnopqrstuvwxyz")).to.equal(true);
			expect(allowedChars.test("Z")).to.equal(false);
			expect(allowedChars.test("9")).to.equal(false);
			expect(allowedChars.test("@")).to.equal(false);
		});
		it("confirm", () => {
			const config = PasswordConfig.from({ confirm: false });
			expect(config.confirm()).to.equal(false);
			expect(config.confirm()).to.not.equal(PasswordConfig.defaults().confirm);
		});
		it("blacklist", () => {
			const config = PasswordConfig.from();
			const list = ["passwOrd", "12345678"];
			const message = () => "failed";
			const ruleLen = config.rules().length;
			const rules = config.blacklist({ list, message });
			expect(rules).to.have.lengthOf(ruleLen + 1);
		});
	});

	describe("rules", () => {
		it("comes with a rules checker", () => {
			const config = PasswordConfig.from();
			expect(config.rules()).to.have.lengthOf(3);
			expect(config.check(Random.id())).to.equal(undefined);
			expect(config.check(Random.id())).to.equal(undefined);
			expect(config.check("")).to.have.lengthOf(2);
			expect(config.check(null)).to.have.lengthOf(2);
			expect(config.check(1)).to.have.lengthOf(2);
		});
	});
});
