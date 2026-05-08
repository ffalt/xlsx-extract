import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import ts from "typescript-eslint";
import jest from "eslint-plugin-jest";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";

const unicornRules = {
	"unicorn/empty-brace-spaces": "off",
	"unicorn/no-await-expression-member": "off",
	"unicorn/no-null": "error",
	"unicorn/no-array-sort": "off",
	"unicorn/no-process-exit": "off",
	"unicorn/no-useless-promise-resolve-reject": "off",
	"unicorn/no-useless-undefined": "off",
	"unicorn/prefer-top-level-await": "off",
	"unicorn/prefer-number-properties": "off",

	"unicorn/prevent-abbreviations": ["error", {
		replacements: {
			docs: false, req: false, res: false, env: false, dir: false, db: false, obj: false, utils: false
		}
	}],
	"unicorn/prefer-at": ["error", { checkAllIndexAccess: true }]
};

const tsRules = {
	"@typescript-eslint/no-explicit-any": "off",
	"@typescript-eslint/consistent-type-definitions": ["error", "interface"],
	"@typescript-eslint/member-ordering": ["error", {
		default: ["static-field", "instance-field", "static-method", "instance-method"]
	}],
	"@typescript-eslint/no-inferrable-types": ["error", { ignoreParameters: true }],
	"@typescript-eslint/no-misused-new": "error",
	"@typescript-eslint/no-non-null-assertion": "error",
	"@typescript-eslint/prefer-function-type": "error",
	"@typescript-eslint/unified-signatures": "error"
};

const stylisticRules = {
	"@stylistic/semi": ["error", "always"],
	"@stylistic/comma-dangle": ["error", "never"],
	"@stylistic/arrow-parens": ["error", "as-needed"],
	"@stylistic/indent": ["error", "tab"],
	"@stylistic/no-tabs": ["error", { allowIndentationTabs: true }],
	"@stylistic/member-delimiter-style": ["error", {
		"multiline": { "delimiter": "semi", "requireLast": true },
		"singleline": { "delimiter": "semi", "requireLast": false },
		"multilineDetection": "brackets"
	}],
	"@stylistic/quote-props": ["error", "consistent"],
	"@stylistic/brace-style": ["error", "1tbs", { "allowSingleLine": true }],
	"@stylistic/operator-linebreak": ["error", "after"],
	"@stylistic/type-annotation-spacing": "error",
	"@stylistic/linebreak-style": ["error", "unix"],
	"@stylistic/no-trailing-spaces": "error"
};

const commonRules = {
	"arrow-body-style": "error",
	"curly": "error",
	"eol-last": "error",
	"guard-for-in": "error",
	"max-len": ["error", { code: 400 }],
	"no-caller": "error",
	"no-bitwise": "error",
	"no-console": ["warn", { allow: ["warn", "error"] }],
	"no-debugger": "error",
	"no-eval": "error",
	"no-fallthrough": "error",
	"no-labels": "error",
	"no-new-wrappers": "error",
	"no-shadow": "error",
	"no-trailing-spaces": "error",
	"no-undef-init": "error",
	"no-unused-expressions": "error",
	"no-var": "error",
	"prefer-const": "error",
	"quotes": ["error", "single"],
	"radix": "error",
	"semi": ["error", "always"],
	"eqeqeq": ["error", "always", { null: "ignore" }],
	"spaced-comment": ["error", "always"]
};

export default ts.config(
	{
		files: ["**/*.ts"],
		ignores: ["**/test/**"],
		extends: [
			js.configs.recommended,
			...ts.configs.strictTypeChecked,
			...ts.configs.recommendedTypeChecked,
			...ts.configs.stylisticTypeChecked,
			unicorn.configs.recommended,
			stylistic.configs.recommended
		],
		languageOptions: {
			parserOptions: {
				project: "tsconfig.json"
			}
		},
		rules: {
			...commonRules,
			...tsRules,
			...stylisticRules,
			...unicornRules
		}
	},
	{
		files: [
			"**/test.ts"
		],
		extends: [
			js.configs.recommended,
			...ts.configs.strictTypeChecked,
			...ts.configs.recommendedTypeChecked,
			...ts.configs.stylisticTypeChecked,
			jest.configs["flat/recommended"],
			unicorn.configs.recommended,
			stylistic.configs.recommended
		],
		plugins: {
			jest
		},
		languageOptions: {
			globals: jest.environments.globals.globals,
			parserOptions: {
				project: "tsconfig.jest.json"
			}
		},
		rules: {
			...unicornRules,
			...stylisticRules,
			...tsRules,

			"unicorn/consistent-function-scoping": "off",
			"unicorn/prefer-string-raw": "off",
			"unicorn/prefer-at": "off",

			"@typescript-eslint/no-useless-constructor": "off",
			"@typescript-eslint/no-misused-promises": "off",
			"@typescript-eslint/dot-notation": "off",
			"@typescript-eslint/unbound-method": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-argument": "off",

			"jest/valid-expect": "off",
			"jest/prefer-each": "error",
			"jest/no-conditional-expect": "off",
			"jest/expect-expect": "off",
			"jest/no-done-callback": "off"
		}
	},
	{
		files: ["**/*.{js,mjs,cjs}"],
		extends: [
			js.configs.recommended,
			unicorn.configs.recommended,
			stylistic.configs.recommended
		],
		languageOptions: {
			globals: globals.node
		},
		rules: {
			...commonRules,
			...unicornRules,
			...stylisticRules,
			"no-console": ["off"],
			"quotes": ["error", "double"],
			"@stylistic/quotes": ["error", "double"]
		}
	},
	{
		ignores: [
			"local",
			"dist"
		]
	}
);
