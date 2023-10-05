"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@octokit/rest");
const web_api_1 = require("@slack/web-api");
const core_1 = require("@actions/core");
const repo = (0, core_1.getInput)('repository', { required: true });
const owner = (0, core_1.getInput)('owner', { required: true });
const basehead = (0, core_1.getInput)('basehead');
const slackToken = (0, core_1.getInput)('slackToken', { required: true });
const slackChannel = (0, core_1.getInput)('slackChannel', { required: true });
const commitThreshold = parseInt((0, core_1.getInput)('commitThreshold'));
const octokit = new rest_1.Octokit({ auth: process.env.GITHUB_TOKEN });
const slackWebClient = new web_api_1.WebClient(slackToken);
function tallyCommitTypes(commits) {
    return commits.reduce(([prs, cs], { commit: { message } }) => {
        const isMerge = message.startsWith('Merge pull request');
        const isSquash = /^.+\(#\d+\)(?:\n\n)?/.test(message);
        return [prs + (isMerge || isSquash ? 1 : 0), cs + (isMerge ? 0 : 1)];
    }, [0, 0]);
}
async function sendSlackMessage(messageWithAttachments) {
    await slackWebClient.chat.postMessage({
        channel: slackChannel,
        ...messageWithAttachments,
    });
}
async function checkOutstandingPrs() {
    const { data: { html_url: htmlUrl, commits }, } = await octokit.repos.compareCommitsWithBasehead({
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
    .then(() => (0, core_1.info)('Finished check.'))
    .catch(e => (0, core_1.error)(e));
