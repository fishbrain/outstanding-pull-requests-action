# outstanding-pull-requests-action

Send a Slack message when two branches of a repository diverge by a certain number of commits.

## Inputs

### `owner`

**Required**. The repository owner.

### `repository`

**Required**. The repository name.

### `slackToken`

**Required**. A Slack web client token.

### `slackChannel`

**Required**. The name of a Slack channel accessible with the provided token.

### `basehead`

The base and head branches to measure against, in the format "BASE...HEAD". Default: `main...develop`.

### `commitThreshold`

The difference in commits needed before sending a message in Slack. Default: `5`.

## Example usage

```yml
uses: fishbrain/outstanding-pull-requests-action@v1.0.0
with:
  owner: fishbrain
  repository: outstanding-pull-requests-action
  slackToken: "some_token"
  slackChannel: "#some-channel"
  basehead: "master...develop"
  commitThreshold: 10
```

## Developing

To deploy new changes:

- Make changes and update all references to the package version.
- Run `npm run build` to update action script.
- Push changes to `main` branch.
- Check CI passed.
- Create a new release on Github matching the new version.
