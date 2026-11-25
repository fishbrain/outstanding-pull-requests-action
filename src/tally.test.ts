import assert from 'node:assert/strict';
import { test } from 'node:test';

import { tally, type CompareCommit } from './tally.ts';

const commit = (message: string, parentCount = 1): CompareCommit => ({
  parents: Array.from({ length: parentCount }),
  commit: { message },
});

test('counts merge commits from pull requests, but not as commits', () => {
  const result = tally([commit('Merge pull request #12 from fishbrain/feature\n\nAdd thing', 2)]);
  assert.deepEqual(result, { pullRequests: 1, commits: 0 });
});

test('counts merge commits titled after the pull request', () => {
  const result = tally([commit('Add thing (#12)\n\nMerged from fishbrain/feature', 2)]);
  assert.deepEqual(result, { pullRequests: 1, commits: 0 });
});

test('counts squash merges as both a pull request and a commit', () => {
  const result = tally([commit('Add thing (#12)\n\n* wip\n* more wip')]);
  assert.deepEqual(result, { pullRequests: 1, commits: 1 });
});

test('ignores merge commits that are not pull requests', () => {
  const result = tally([commit("Merge branch 'main' into develop", 2)]);
  assert.deepEqual(result, { pullRequests: 0, commits: 0 });
});

test('does not treat a PR reference mid-subject or in the body as a squash merge', () => {
  const result = tally([
    commit('Revert the change from (#12) partially'),
    commit('Fix typo\n\nFollow-up to (#12)'),
  ]);
  assert.deepEqual(result, { pullRequests: 0, commits: 2 });
});

test('ignores trailing whitespace and CRLF line endings in the subject', () => {
  const result = tally([commit('Add thing (#12)  '), commit('Add other thing (#13)\r\n\r\nBody')]);
  assert.deepEqual(result, { pullRequests: 2, commits: 2 });
});

test('does not count a merge-looking message on a single-parent commit as a merge', () => {
  const result = tally([commit('Merge pull request #12 from fishbrain/feature')]);
  assert.deepEqual(result, { pullRequests: 0, commits: 1 });
});

test('tallies a mixed history', () => {
  const result = tally([
    commit('Merge pull request #1 from fishbrain/a', 2),
    commit('Change a'),
    commit('Change b (#2)'),
    commit('Change c'),
  ]);
  assert.deepEqual(result, { pullRequests: 2, commits: 3 });
});
