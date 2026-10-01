// Copies the pinned browser builds of jsPsych and its plugins from node_modules into lib/.
// Run `npm run vendor` after upgrading a jsPsych package. Students never need to run this.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const lib = path.join(root, "lib");
fs.mkdirSync(lib, { recursive: true });

const copies = [
  ["jspsych/dist/index.browser.min.js", "jspsych.js"],
  ["jspsych/css/jspsych.css", "jspsych.css"],
  ["@jspsych/plugin-html-keyboard-response/dist/index.browser.min.js", "plugin-html-keyboard-response.js"],
  ["@jspsych/plugin-html-button-response/dist/index.browser.min.js", "plugin-html-button-response.js"],
  ["@jspsych/plugin-instructions/dist/index.browser.min.js", "plugin-instructions.js"],
  ["@jspsych/plugin-survey/dist/index.browser.min.js", "plugin-survey.js"],
  ["@jspsych/plugin-survey/css/survey.css", "plugin-survey.css"],
  ["@jspsych/plugin-survey-likert/dist/index.browser.min.js", "plugin-survey-likert.js"],
  ["@jspsych/plugin-survey-text/dist/index.browser.min.js", "plugin-survey-text.js"],
];

const versions = {};
for (const [from, to] of copies) {
  const src = path.join(root, "node_modules", from);
  // Strip sourceMappingURL comments: the .map files are not vendored, so they would 404 in
  // devtools, and they show up as phantom external references in security sweeps of lib/.
  const text = fs.readFileSync(src, "utf8").replace(/^\s*\/\/# sourceMappingURL=.*$/gm, "");
  fs.writeFileSync(path.join(lib, to), text);
  const pkgName = from.startsWith("@") ? from.split("/").slice(0, 2).join("/") : from.split("/")[0];
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "node_modules", pkgName, "package.json"), "utf8"));
  versions[pkgName] = pkg.version;
}
const fb = JSON.parse(fs.readFileSync(path.join(root, "node_modules", "firebase", "package.json"), "utf8"));
versions["firebase"] = fb.version;
fs.writeFileSync(path.join(lib, "VERSIONS.json"), JSON.stringify(versions, null, 2) + "\n");
console.log("Vendored:", versions);
