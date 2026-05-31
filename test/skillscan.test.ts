import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { test } from "node:test";
import { loadConfig, scanPath, shouldFail } from "../src/index.js";

const execFileAsync = promisify(execFile);

test("scanPath finds risky directives and secrets in skill files", () => {
  const result = scanPath("test/fixtures/risky-skill");

  assert.equal(result.summary.filesScanned, 1);
  assert.equal(result.summary.errors, 2);
  assert.equal(result.summary.warnings, 1);
  assert.ok(result.findings.some((finding) => finding.ruleId === "destructive.unbounded-delete"));
  assert.ok(result.findings.some((finding) => finding.ruleId === "secret.token-literal"));
  assert.ok(result.findings.some((finding) => finding.ruleId === "external-action.unconfirmed-send"));
});

test("safe skill files pass without findings", () => {
  const result = scanPath("test/fixtures/safe-skill");

  assert.equal(result.summary.findings, 0);
  assert.equal(shouldFail(result, "warning"), false);
});

test("config can suppress noisy rules while preserving hard failures", () => {
  const config = loadConfig("test/fixtures/risky-skill", "test/configs/skillscan.config.jsonc");
  const result = scanPath("test/fixtures/risky-skill", {
    configPath: "test/configs/skillscan.config.jsonc"
  });

  assert.equal(config.failOn, "error");
  assert.equal(result.summary.warnings, 0);
  assert.equal(result.summary.errors, 2);
  assert.equal(shouldFail(result, config.failOn), true);
});

test("CLI emits stable JSON for automation", async () => {
  await assert.rejects(
    execFileAsync("node", ["dist/src/cli.js", "json", "test/fixtures/risky-skill"]),
    (error: unknown) => {
      const failure = error as { code?: number; stdout?: string };
      assert.equal(failure.code, 1);
      const result = JSON.parse(failure.stdout ?? "");
      assert.equal(result.tool, "skillscan");
      assert.equal(result.summary.findings, 3);
      return true;
    }
  );
});
