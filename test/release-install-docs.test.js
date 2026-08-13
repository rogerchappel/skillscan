import assert from "node:assert/strict";
import test from "node:test";
import { assertInstallDocumentation } from "../scripts/release-install-docs-lib.mjs";

const sourceInstall = `
The package has not been published to npm yet.
git clone https://github.com/rogerchappel/skillscan.git
npm install --global ./skillscan
After the first release is visible on npm:
npm install --global @rogerchappel/skillscan
`;

test("accepts a source install while the package is unpublished", () => {
  assert.doesNotThrow(() => assertInstallDocumentation(sourceInstall, false));
});

test("rejects an advertised registry install while the package is unpublished", () => {
  assert.throws(
    () => assertInstallDocumentation("npm install --global @rogerchappel/skillscan", false),
    /not yet published/,
  );
});

test("requires the registry command after publication", () => {
  assert.throws(() => assertInstallDocumentation("Install skillscan.", true), /published package/);
  assert.doesNotThrow(() => assertInstallDocumentation(sourceInstall, true));
});
