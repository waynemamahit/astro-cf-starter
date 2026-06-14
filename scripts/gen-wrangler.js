import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const env = args[0] || "local"; // 'local', 'staging', 'production'
const varsFile = args[1] || ".dev.vars";

const CWD = process.cwd();
const WRANGLER_JSONC_PATH = path.resolve(CWD, "wrangler.jsonc");
const DEV_VARS_PATH = path.resolve(CWD, varsFile);

// Output paths
// - Root wrangler.json: used for local dev and `wrangler types`.
// - dist/server/wrangler.json: the deployment config that the Astro
//   Cloudflare adapter generates during build. `wrangler deploy` is
//   redirected here via `.wrangler/deploy/config.json`.
const BUILD_SERVER_PATH = path.resolve(CWD, "dist/server");
const WRANGLER_JSON_ROOT = path.resolve(CWD, "wrangler.json");
const WRANGLER_JSON_BUILD = path.resolve(BUILD_SERVER_PATH, "wrangler.json");

console.log(`Generating wrangler.json for environment: ${env}`);

// Remove JSONC comments while preserving strings
// We need to parse character by character to avoid removing // inside strings
function stripJsonComments(jsonc) {
	let result = "";
	let inString = false;
	let inSingleLineComment = false;
	let inMultiLineComment = false;
	let escapeNext = false;

	for (let i = 0; i < jsonc.length; i++) {
		const char = jsonc[i];
		const nextChar = jsonc[i + 1];

		// Handle escape sequences in strings
		if (inString && escapeNext) {
			result += char;
			escapeNext = false;
			continue;
		}

		if (inString && char === "\\") {
			result += char;
			escapeNext = true;
			continue;
		}

		// Toggle string state
		if (char === '"' && !inSingleLineComment && !inMultiLineComment) {
			inString = !inString;
			result += char;
			continue;
		}

		// Skip if we're in a string
		if (inString) {
			result += char;
			continue;
		}

		// Handle multi-line comment end
		if (inMultiLineComment) {
			if (char === "*" && nextChar === "/") {
				inMultiLineComment = false;
				i++; // Skip the '/'
			}
			continue;
		}

		// Handle single-line comment end
		if (inSingleLineComment) {
			if (char === "\n" || char === "\r") {
				inSingleLineComment = false;
				result += char; // Preserve the newline
			}
			continue;
		}

		// Check for comment starts
		if (char === "/") {
			if (nextChar === "/") {
				inSingleLineComment = true;
				i++; // Skip the second '/'
				continue;
			}
			if (nextChar === "*") {
				inMultiLineComment = true;
				i++; // Skip the '*'
				continue;
			}
		}

		// Regular character
		result += char;
	}

	return result;
}

function extractPlaceholders(content) {
	const placeholderRegex = /\$\{([A-Z0-9_]+)\}/g;
	const placeholders = new Set();
	let match = placeholderRegex.exec(content);
	while (match !== null) {
		placeholders.add(match[1]);
		match = placeholderRegex.exec(content);
	}
	return placeholders;
}

// Lazily-loaded local dev vars (only used when env === 'local')
let devVarsCache = null;
function loadDevVars() {
	if (devVarsCache) {
		return devVarsCache;
	}
	devVarsCache = {};
	if (fs.existsSync(DEV_VARS_PATH)) {
		const devVarsContent = fs.readFileSync(DEV_VARS_PATH, "utf-8");
		devVarsContent.split("\n").forEach((rawLine) => {
			const line = rawLine.trim();
			if (!line || line.startsWith("#")) {
				return;
			}
			const equalIndex = line.indexOf("=");
			if (equalIndex === -1) {
				return;
			}
			const key = line.substring(0, equalIndex).trim();
			const value = line.substring(equalIndex + 1).trim();
			if (key) {
				devVarsCache[key] = value;
			}
		});
	} else {
		console.warn(
			".dev.vars file not found. Placeholders might not be resolved.",
		);
	}
	return devVarsCache;
}

// Resolve a single placeholder for the current environment.
// local  -> read from .dev.vars
// ci/cd  -> read from process.env, preferring {ENV}_{KEY} over {KEY}
function resolveValue(key) {
	if (env === "local") {
		return loadDevVars()[key];
	}

	const prefix = `${env.toUpperCase()}_`;
	let value = process.env[`${prefix}${key}`] || process.env[key];

	if (value) {
		value = value.trim();
		// Guard against masked/placeholder values leaking from CI
		if (
			value === "" ||
			value === "***" ||
			value === "PLACEHOLDER" ||
			value.includes("***")
		) {
			console.warn(`⚠ Ignoring invalid value for ${key}: "${value}"`);
			return undefined;
		}
	}

	return value || undefined;
}

function escapeJsonString(str) {
	return str
		.replace(/\\/g, "\\\\") // Escape backslashes
		.replace(/"/g, '\\"') // Escape quotes
		.replace(/\n/g, "\\n") // Escape newlines
		.replace(/\r/g, "\\r") // Escape carriage returns
		.replace(/\t/g, "\\t") // Escape tabs
		.replace(/\f/g, "\\f"); // Escape form feeds
}

// Replace all ${PLACEHOLDER} tokens in a JSON string.
// Returns the substituted content plus the set of placeholders that
// could not be resolved for this environment.
function substitutePlaceholders(content) {
	const placeholders = extractPlaceholders(content);

	if (placeholders.size > 0) {
		console.log(`Placeholders found: ${Array.from(placeholders).join(", ")}`);
	}

	let finalContent = content;
	const unresolved = new Set();

	placeholders.forEach((key) => {
		const value = resolveValue(key);
		if (value !== undefined) {
			finalContent = finalContent
				.split(`\${${key}}`)
				.join(escapeJsonString(value));
			console.log(`✓ Resolved ${key} (value length: ${value.length})`);
		} else {
			console.warn(`Warning: Variable ${key} not found for environment ${env}`);
			unresolved.add(key);
		}
	});

	return { content: finalContent, unresolved };
}

// Drop bindings that still reference unresolved placeholders so that
// `wrangler deploy` does not fail on missing IDs in the target environment.
function removeUnresolvedBindings(content, unresolved) {
	if (unresolved.size === 0) {
		return content;
	}

	console.log(
		`\nRemoving bindings with unresolved placeholders: ${Array.from(unresolved).join(", ")}`,
	);

	let config;
	try {
		config = JSON.parse(content);
	} catch (e) {
		console.error(
			"Warning: Could not parse JSON to remove unresolved bindings:",
			e.message,
		);
		return content;
	}

	const hasUnresolvedPlaceholder = (binding) => {
		const bindingString = JSON.stringify(binding);
		for (const placeholder of unresolved) {
			if (bindingString.includes(`\${${placeholder}}`)) {
				return true;
			}
		}
		// Catch-all for any remaining ${...} pattern
		if (bindingString.match(/\$\{[A-Z0-9_]+\}/)) {
			return true;
		}
		return false;
	};

	// Array-style bindings keyed by their binding name for logging
	const arraySections = {
		kv_namespaces: "id",
		d1_databases: "database_id",
		hyperdrive: "id",
		vectorize: "index_name",
	};

	for (const [section, idField] of Object.entries(arraySections)) {
		if (!Array.isArray(config[section])) {
			continue;
		}
		const originalLength = config[section].length;
		config[section] = config[section].filter((binding) => {
			const unresolvedBinding = hasUnresolvedPlaceholder(binding);
			if (unresolvedBinding) {
				console.log(
					`  ✗ Removed ${section} binding: ${binding.binding} (${idField}: ${binding[idField]})`,
				);
			}
			return !unresolvedBinding;
		});
		if (config[section].length === 0) {
			delete config[section];
			console.log(
				`  ℹ Removed entire ${section} section (${originalLength} bindings removed)`,
			);
		}
	}

	// Environment variables referencing an unresolved placeholder
	if (config.vars) {
		const originalKeys = Object.keys(config.vars);
		Object.keys(config.vars).forEach((key) => {
			const value = config.vars[key];
			if (
				typeof value === "string" &&
				value.startsWith("${") &&
				value.endsWith("}")
			) {
				const placeholder = value.slice(2, -1);
				if (unresolved.has(placeholder)) {
					console.log(
						`  ✗ Removed environment variable: ${key} (value: ${value})`,
					);
					delete config.vars[key];
				}
			}
		});
		if (Object.keys(config.vars).length === 0) {
			delete config.vars;
			console.log(
				`  ℹ Removed entire vars section (${originalKeys.length} variables removed)`,
			);
		}
	}

	console.log("✓ Cleaned up bindings with unresolved placeholders\n");
	return JSON.stringify(config, null, 2);
}

// Resolve placeholders and strip unresolved bindings, returning a
// validated JSON string ready to be written to disk.
function processConfig(content) {
	const { content: substituted, unresolved } = substitutePlaceholders(content);
	const cleaned = removeUnresolvedBindings(substituted, unresolved);
	// Validate before returning
	JSON.parse(cleaned);
	return cleaned;
}

// 1. Root wrangler.json (local dev + `wrangler types`)
let rootContent = stripJsonComments(
	fs.readFileSync(WRANGLER_JSONC_PATH, "utf-8"),
);
// Remove trailing commas before closing braces/brackets
rootContent = rootContent.replace(/,(\s*[}\]])/g, "$1");

try {
	const rootFinal = processConfig(rootContent);
	fs.writeFileSync(WRANGLER_JSON_ROOT, rootFinal);
	console.log(`✓ Generated ${WRANGLER_JSON_ROOT}`);
} catch (e) {
	console.error("Error: Generated root content is not valid JSON.");
	console.error(e);
	process.exit(1);
}

// 2. dist/server/wrangler.json (deployment config)
// The Astro Cloudflare adapter already produced this file with the correct
// `main` entry point, `no_bundle`, module `rules`, and asset paths. We must
// NOT overwrite it with the root config — we only inject the resolved
// placeholder values so secrets/IDs are present at deploy time.
if (fs.existsSync(WRANGLER_JSON_BUILD)) {
	try {
		const buildContent = fs.readFileSync(WRANGLER_JSON_BUILD, "utf-8");
		const buildFinal = processConfig(buildContent);
		fs.writeFileSync(WRANGLER_JSON_BUILD, buildFinal);
		console.log(`✓ Updated ${WRANGLER_JSON_BUILD}`);
		console.log(`  main entry point: ${JSON.parse(buildFinal).main}`);
	} catch (e) {
		console.error("Error: Failed to process dist/server/wrangler.json.");
		console.error(e);
		process.exit(1);
	}
} else if (fs.existsSync(BUILD_SERVER_PATH)) {
	console.warn(
		`⚠ ${WRANGLER_JSON_BUILD} not found. Run the build before generating the deploy config.`,
	);
} else {
	console.log(
		`ℹ dist/server directory not found, skipping ${WRANGLER_JSON_BUILD}`,
	);
}

console.log("Successfully generated wrangler.json");
