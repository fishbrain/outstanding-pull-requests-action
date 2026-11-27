import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { WebClient } from '@slack/web-api';

import { tally, type CompareCommit } from './tally.ts';

const PER_PAGE = 100;
const DEFAULT_THRESHOLD = 5;

function readThreshold(): number {
  // commitThreshold is the deprecated name for pullRequestThreshold; the new name wins if both are set.
  for (const name of ['pullRequestThreshold', 'commitThreshold']) {
    const raw = core.getInput(name);
    if (raw === '') {
      continue;
    }
    const threshold = /^\d+$/.test(raw) ? Number(raw) : 0;
    if (threshold < 1) {
      throw new Error(`${name} must be a positive integer, got "${raw}".`);
    }
    return threshold;
  }
  return DEFAULT_THRESHOLD;
}

async function compare(
  octokit: ReturnType<typeof getOctokit>,
  params: { owner: string; repo: string; basehead: string },
): Promise<{ url: string; commits: CompareCommit[] }> {
  const commits: CompareCommit[] = [];

  for (let page = 1; ; page++) {
    const { data } = await octokit.rest.repos.compareCommitsWithBasehead({
      ...params,
      per_page: PER_PAGE,
      page,
    });
    commits.push(...data.commits);

    if (data.commits.length < PER_PAGE || commits.length >= data.total_commits) {
      return { url: data.html_url, commits };
    }
  }
}

async function run(): Promise<void> {
  const threshold = readThreshold();
  const owner = core.getInput('owner') || context.repo.owner;
  const repo = core.getInput('repository') || context.repo.repo;
  const basehead = core.getInput('basehead', { required: true });
  const octokit = getOctokit(core.getInput('token', { required: true }));

  const { url, commits } = await compare(octokit, { owner, repo, basehead });
  const { pullRequests, commits: commitCount } = tally(commits);

  core.info(
    `${owner}/${repo} ${basehead}: ${pullRequests} pull requests, ${commitCount} commits (threshold: ${threshold}).`,
  );
  if (pullRequests < threshold) {
    return;
  }

  // The default retry policy can keep the step running for about 30 minutes during a Slack outage.
  const slack = new WebClient(core.getInput('slackToken', { required: true }), {
    retryConfig: { retries: 2 },
  });
  await slack.chat.postMessage({
    channel: core.getInput('slackChannel', { required: true }),
    text: `${repo}: There are *${pullRequests} outstanding pull requests* _(${commitCount} commits)_ in \`${basehead}\`. <${url}|View the diff>`,
    unfurl_links: false,
  });
  core.info('Posted to Slack.');
}

try {
  await run();
} catch (e) {
  core.setFailed(e instanceof Error ? e.message : String(e));
}
