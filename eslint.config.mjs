import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import ts from "typescript-eslint";
import jest from "eslint-plugin-jest";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";

const unicornRules = {
	"unicorn/empty-brace-spaces": "off",
	"unicorn/no-await-expression-member": "off",
	"unicorn/no-null": "off",
	"unicorn/no-array-sort": "off",
	"unicorn/no-process-exit": "off",
	"unicorn/no-useless-promise-resolve-reject": "off",
	"unicorn/no-useless-undefined": "off",
	"unicorn/prefer-top-level-await": "off",
	"unicorn/prefer-module": "off",

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
	"@stylistic/semi": "error",
	"@stylistic/indent": ["error", "tab"],
	"@stylistic/operator-linebreak": ["error", "after"],
	"@stylistic/comma-dangle": ["error", "never"],
	"@stylistic/quote-props": ["error", "consistent"],
	"@stylistic/type-annotation-spacing": "error",
	"@stylistic/linebreak-style": ["error", "unix"],
	"@stylistic/arrow-parens": ["error", "as-needed", { requireForBlockBody: false }]
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
			stylistic.configs.customize({
				indent: "tab",
				quotes: "single",
				braceStyle: "1tbs",
				semi: true,
				arrowParens: false,
				commaDangle: "never",
				jsx: false
			})
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
			stylistic.configs.customize({
				indent: "tab",
				quotes: "single",
				braceStyle: "1tbs",
				semi: true,
				arrowParens: false,
				commaDangle: "never",
				jsx: false
			})
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
			stylistic.configs.customize({
				indent: "tab",
				quotes: "double",
				braceStyle: "1tbs",
				semi: true,
				arrowParens: false,
				commaDangle: "never",
				jsx: false
			})
		],
		languageOptions: {
			globals: globals.node
		},
		rules: {
			...unicornRules,
			"arrow-body-style": ["error", "as-needed"],
			"arrow-parens": ["error", "as-needed"],
			"brace-style": ["error", "1tbs"],
			"comma-dangle": "error",
			"complexity": ["error", { max: 20 }],
			"default-case": "error",
			"max-classes-per-file": ["error", 2],
			"max-len": ["error", { code: 240 }],
			"max-lines": ["error", 1000],
			"newline-per-chained-call": "off",
			"no-duplicate-case": "error",
			"no-duplicate-imports": "error",
			"no-empty": "error",
			"no-extra-bind": "error",
			"no-invalid-this": "error",
			"no-multiple-empty-lines": ["error", { max: 1 }],
			"no-new-func": "error",
			"no-param-reassign": "error",
			"no-redeclare": "error",
			"no-return-await": "error",
			"no-sequences": "error",
			"no-sparse-arrays": "error",
			"no-template-curly-in-string": "error",
			"no-void": "error",
			"prefer-const": "error",
			"prefer-object-spread": "error",
			"prefer-template": "error",
			"space-in-parens": ["error", "never"],
			"yoda": "error"
		}
	},
	{
		ignores: [
			"local",
			"dist"
		]
	}
);
