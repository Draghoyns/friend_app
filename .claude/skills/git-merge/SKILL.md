---
name: git-merge
description: Squash-merge a finished feature branch into main and delete it, after the user has explicitly approved the merge. Use on "merge", "merge the branch", "merge into main", "finish the feature", "squash merge", "git ritual 2".
---

# Git merge ritual

Second phase of the workflow: land a reviewed branch on `main` so the history stays linear.
**Merge always means `git merge --squash`** — never a regular merge commit.

Optional argument: the branch to merge. Defaults to the current branch.

## Before anything: was this approved?

Only run this skill when the user has said to merge, in their own words. Finishing development is
not approval. Asking and getting no answer is not approval. If you are not sure, stop and ask.

## 1. Confirm you are on a feature branch

```bash
git branch --show-current
```

If it prints `main` (or `master`), stop and ask which branch to merge.

## 2. Check push status — only if there is a remote

```bash
git remote
```

- **No output** → this repo is local-only. Skip to step 3.
- **A remote exists** → check for unpushed commits:

  ```bash
  git log --oneline origin/main..HEAD
  ```

  - No output → fully pushed, proceed.
  - Commits listed → stop and tell the user, naming them:

    > "These commits aren't pushed yet: […]. Push the branch (`git push -u origin <branch>`) and
    > then ask me again."

    Never push on their behalf. Wait.

## 3. Merge

```bash
BRANCH=$(git branch --show-current)
git switch main
git pull                          # only if a remote exists
git merge --squash "$BRANCH"
```

`--squash` stages everything without committing, so you still choose the message.

## 4. Commit the squash

One message summarising the whole feature:

```bash
git commit -m "<type>(<scope>): <summary of the entire feature>"
```

Same type as the branch prefix, imperative, ≤ 72 chars.
Example: `feat(levels): set meetup rhythm per friendship level`

## 5. Verify and clean up

```bash
git log --oneline -5
git branch -d "$BRANCH"
```

Confirm the squash commit is on `main` with the right message, then delete the local branch.
Remote branch cleanup is the user's.

## Decision points

| Situation | Action |
|-----------|--------|
| Not explicitly approved | Stop. Do not merge. |
| Currently on `main` | Stop, ask which branch |
| Unpushed commits, remote exists | Stop, list them, ask the user to push |
| `wip:` commits in the branch log | Warn first — the branch may not be ready |
| Conflicts after `--squash` | Resolve, then `git commit` manually |
| Branch already gone from the remote | `-d` still works locally; skip remote cleanup |

## Checks

- [ ] The user explicitly approved this merge
- [ ] Started from a feature branch, not `main`
- [ ] Push check done, or skipped because there is no remote
- [ ] Squash commit message is typed and descriptive
- [ ] `git log --oneline -5` shows one clean commit on `main`
- [ ] Feature branch deleted locally
- [ ] No `git push` — the user handles that
