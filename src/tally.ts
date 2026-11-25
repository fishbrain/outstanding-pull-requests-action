export interface CompareCommit {
  parents: readonly unknown[];
  commit: { message: string };
}

export interface Tally {
  pullRequests: number;
  commits: number;
}

// GitHub's default merge commit subject.
const PR_MERGE_SUBJECT = /^Merge pull request #\d+ /;
// Squash merges, and merge commits when the repository titles them after the pull request.
const PR_NUMBER_SUFFIX = /\(#\d+\)$/;

/**
 * Counts merged pull requests (merge commits and squash merges) and non-merge commits.
 * Rebase-merged pull requests leave no trace in the history and are counted only as commits.
 */
export function tally(commits: readonly CompareCommit[]): Tally {
  let pullRequests = 0;
  let nonMergeCommits = 0;

  for (const { parents, commit } of commits) {
    const subject = (commit.message.split('\n', 1)[0] ?? '').trimEnd();

    if (parents.length > 1) {
      if (PR_MERGE_SUBJECT.test(subject) || PR_NUMBER_SUFFIX.test(subject)) {
        pullRequests++;
      }
    } else {
      nonMergeCommits++;
      if (PR_NUMBER_SUFFIX.test(subject)) {
        pullRequests++;
      }
    }
  }

  return { pullRequests, commits: nonMergeCommits };
}
