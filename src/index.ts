import { Octokit } from '@octokit/rest';
import { WebClient } from '@slack/web-api';
import { error, getInput, info } from '@actions/core';

const repo = getInput('repository', { required: true });
const owner = getInput('owner', { required: true });
const basehead = getInput('basehead');
const slackToken = getInput('slackToken', { required: true });
const slackChannel = getInput('slackChannel', { required: true });
const commitThreshold = parseInt(getInput('commitThreshold'));

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const slackWebClient = new WebClient(slackToken);

function tallyCommitTypes(commits: { commit: { message: string } }[]): [number, number] {
  return commits.reduce(
    ([prs, cs], { commit: { message } }) => {
      const isMerge = message.startsWith('Merge pull request');
      const isSquash = /^.+\(#\d+\)(?:\n\n)?/.test(message);
      return [prs + (isMerge || isSquash ? 1 : 0), cs + (isMerge ? 0 : 1)];
    },
    [0, 0],
  );
}

async function sendSlackMessage(messageWithAttachments: {
  text: string;
  attachments: {
    text: string;
  }[];
}) {
  await slackWebClient.chat.postMessage({
    channel: slackChannel,
    ...messageWithAttachments,
  });
}

async function checkOutstandingPrs() {
  const {
    data: { html_url: htmlUrl, commits },
  } = await octokit.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead,
    per_page: 100,
  });

  const [pullRequestsCount, commitsCount] = tallyCommitTypes(commits);

  if (pullRequestsCount > commitThreshold) {
    const message = `${repo}: There are *${pullRequestsCount} outstanding pull requests* _(${commitsCount} commits)_ in \`${basehead}\`.`;
    const messageWithAttachments = {
      text: message,
      attachments: [
        {
          text: htmlUrl,
        },
      ],
    };

    await sendSlackMessage(messageWithAttachments);
  }
}

checkOutstandingPrs()
  .then(() => info('Finished check.'))
  .catch(e => error(e));
