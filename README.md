# outstanding-pull-requests-action

Send a Slack message when too many pull requests are merged into one branch (say `develop`) but not yet into another (say `main`).

It counts merged pull requests in `BASE...HEAD`: merge commits titled `Merge pull request #N ...`, and squash merges or merge commits whose subject ends in `(#N)`. Rebase-merged pull requests can't be detected and count only as commits. A pull request that merges `BASE` back into `HEAD` also counts as outstanding.

## Inputs

| Input                  | Required | Default                  | Description                                                                                                                                   |
| ---------------------- | -------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `slackToken`           | Yes      |                          | A Slack bot token that can post to `slackChannel`.                                                                                            |
| `slackChannel`         | Yes      |                          | The channel to post to, for example `#releases` or a channel ID.                                                                              |
| `basehead`             | No       | `main...develop`         | The branches to compare, as `BASE...HEAD`.                                                                                                    |
| `pullRequestThreshold` | No       | `5`                      | Post when **at least** this many pull requests are outstanding. Must be a positive integer.                                                   |
| `commitThreshold`      | No       |                          | Deprecated alias for `pullRequestThreshold`, with the same **at least** rule. Despite the name, it always counted pull requests, not commits. |
| `token`                | No       | `${{ github.token }}`    | A GitHub token with read access to the repository. Replaces the `GITHUB_TOKEN` env var that v1.0.x read.                                      |
| `owner`                | No       | Current repository owner | The repository owner.                                                                                                                         |
| `repository`           | No       | Current repository name  | The repository name.                                                                                                                          |

## Example usage

```yml
on:
  push:
    branches: [develop]

jobs:
  outstanding-prs:
    runs-on: ubuntu-latest
    steps:
      - uses: fishbrain/outstanding-pull-requests-action@<commit SHA> # v2.0.0
        with:
          slackToken: ${{ secrets.SLACK_BOT_TOKEN }}
          slackChannel: '#releases'
          basehead: main...develop
          pullRequestThreshold: 10
```

## Developing

Requires Node 24.

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build   # writes dist/, which is gitignored
```

`dist/` is never committed to `main`. It is built and committed only on `release/vX.Y.Z` branches, one per release.

## Releasing

1. In a pull request, bump `version` in `package.json` (and `package-lock.json`, via `npm version <x.y.z> --no-git-tag-version`). Merge it.
2. Run the **Release** workflow on `main` (Actions → Release → Run workflow, or `gh workflow run release.yml --ref main`).
   It tests and builds the action, commits `dist/` on top of `main` on a new `release/vX.Y.Z` branch, tags that commit `vX.Y.Z`, and creates the GitHub release.
   Nobody should commit to `release/*` branches by hand.
   If only the last step (creating the GitHub release) fails, re-running won't work because the tag already exists. Finish by hand with `gh release create vX.Y.Z --verify-tag --generate-notes`.
3. Copy the commit SHA from the workflow run's summary and update the pinned SHA in the terraform repo (`repositories/assets/outstanding-prs.yml`). Consumer workflows are generated from there, so editing them directly gets overwritten.
