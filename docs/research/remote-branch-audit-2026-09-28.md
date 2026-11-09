# Remote branch audit — 2026-09-28

Checked against GitHub at **2026-09-28 15:10 UTC**. Repository: `Imbustai/imbustai-app`. This report records a read-only audit; it does not claim that the cleanup has been executed.

## Finding

Both remote branches other than `main` are safe to delete at their recorded tips. **All their commits are already reachable from `main`; no merge or cherry-pick is needed.** There are no branches requiring a content-preservation decision. GitHub currently lists exactly three branches, and all three pull requests in the repository are merged. Sources: [branches API](https://api.github.com/repos/Imbustai/imbustai-app/branches?per_page=100), [all pull requests API](https://api.github.com/repos/Imbustai/imbustai-app/pulls?state=all&per_page=100).

## Preserved remote state

| Branch | Remote tip SHA | Commits unique to branch vs main | Commits behind main | Integration evidence | Action |
| --- | --- | ---: | ---: | --- | --- |
| `main` | `7faf45ed6bf43bdb92e9b82649da63b3c6daaf58` | — | — | Current main | Keep |
| `design-system` | `08d6cc3152a1ab9dd55ec7ece7c9d58235885ce3` | 0 | 3 | [PR #8](https://github.com/Imbustai/imbustai-app/pull/8), merged 2026-07-21; merge commit [`97bafd44a88d2f673bdf1d34141216f851685d8c`](https://github.com/Imbustai/imbustai-app/commit/97bafd44a88d2f673bdf1d34141216f851685d8c) is on main | Delete remote branch |
| `feat/story-platform` | `17b0364cc0bdef728656c15630d427ad8f532350` | 0 | 17 | [PR #2](https://github.com/Imbustai/imbustai-app/pull/2), merged 2026-06-21; merge commit [`4b8247363bd40252c018fb9c03ec524dab9193ae`](https://github.com/Imbustai/imbustai-app/commit/4b8247363bd40252c018fb9c03ec524dab9193ae) is on main | Delete remote branch |

GitHub's comparisons independently report `ahead_by: 0`, with the branch tip itself as the merge base: [main vs design-system](https://github.com/Imbustai/imbustai-app/compare/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58...08d6cc3152a1ab9dd55ec7ece7c9d58235885ce3), [main vs feat/story-platform](https://github.com/Imbustai/imbustai-app/compare/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58...17b0364cc0bdef728656c15630d427ad8f532350). These are ordinary ancestry-preserving merges, so squash-equivalent patch analysis is unnecessary. Local `git cherry origin/main <branch>` also returned no commits for either branch.

The earlier [PR #1](https://github.com/Imbustai/imbustai-app/pull/1), also from `feat/story-platform`, merged on 2026-06-20 at [`2812e5313673c609925fcfc28ab15e96a7590dcf`](https://github.com/Imbustai/imbustai-app/commit/2812e5313673c609925fcfc28ab15e96a7590dcf). PR #2 subsequently incorporated the branch's final three commits. There is no open PR to preserve. Neither candidate branch is protected according to the branches API.

## Checks observed

Both recorded branch tips have successful Vercel deployment statuses for `imbustai-app` and `imbustai-app-tryout`, plus a successful `Vercel Preview Comments` check. Sources: [design-system statuses](https://api.github.com/repos/Imbustai/imbustai-app/commits/08d6cc3152a1ab9dd55ec7ece7c9d58235885ce3/status), [design-system check runs](https://api.github.com/repos/Imbustai/imbustai-app/commits/08d6cc3152a1ab9dd55ec7ece7c9d58235885ce3/check-runs), [story-platform statuses](https://api.github.com/repos/Imbustai/imbustai-app/commits/17b0364cc0bdef728656c15630d427ad8f532350/status), [story-platform check runs](https://api.github.com/repos/Imbustai/imbustai-app/commits/17b0364cc0bdef728656c15630d427ad8f532350/check-runs). These deployment/check results are historical evidence, not a claim that the current dirty worktree has passed tests. Deleting already merged references introduces no code to test.

## Verification performed

The local remote-tracking SHAs matched the live GitHub API exactly, so no fetch or checkout change was needed. Both `git merge-base --is-ancestor <branch> origin/main` commands succeeded. `git rev-list --left-right --count origin/main...<branch>` returned `3 0` for `design-system` and `17 0` for `feat/story-platform`. The checked-out branch remained `main`; existing user modifications to README, package files, local setup, and development tooling were left untouched.

## Exact cleanup action

Before acting, recheck the branches API (or `git ls-remote --heads origin`) and confirm main still retains the recorded commits. The explicit leases below reject deletion if either candidate branch has moved since this audit. `--atomic` requires both deletions to succeed together. A changed tip should be audited again before deletion.

```bash
git push --atomic \
  --force-with-lease=refs/heads/design-system:08d6cc3152a1ab9dd55ec7ece7c9d58235885ce3 \
  --force-with-lease=refs/heads/feat/story-platform:17b0364cc0bdef728656c15630d427ad8f532350 \
  origin \
  :refs/heads/design-system \
  :refs/heads/feat/story-platform
```

Then verify only main remains using `gh api --paginate 'repos/Imbustai/imbustai-app/branches?per_page=100'`. No history rewrite, merge, local branch deletion, or modification of the dirty worktree is required. Both branch tips remain in main's history after deleting their names; the table above preserves their exact SHAs if a branch name needs to be restored later.
