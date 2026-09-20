---
name: git-ritual
description: Branch and commit the working tree the way this repo expects — one feature branch, then small atomic commits grouped by concern, and never a push. Use when starting a feature, fix or refactor, or when asked to "commit my changes", "apply the git ritual", "start a feature", "new branch", "stage and commit".
---

# Git ritual

One branch per feature or fix; commits grouped by logical concern, not by "everything I did".

Optional argument: a short description of the work (e.g. "add dark mode toggle"), used to name
the branch. Without one, read the diff and name it yourself.

## 1. Name and create the branch

- `feat/<description>` — new capability or UI change
- `fix/<description>` — bug fix or regression
- `refactor/<description>` — internal restructure, no behaviour change
- `chore/<description>` — tooling, deps, config

Lowercase, hyphens only, ≤ 40 characters. Example: `feat/dark-mode-toggle`.

```bash
git switch -c <branch-name>
```

Already on a feature branch? Skip to step 2.

## 2. Survey before staging

Run `git status` and read the actual diff — `git diff` for tracked changes, and `git diff` against
`/dev/null` or a plain read for new files. Then group the changed files into commits, each one a
coherent unit of work: "reshape the model", "add the new tab", "update the docs".

Never stage the whole tree as one blob unless the diff genuinely is one atomic change.

**Ordering matters.** Put foundation changes (types, store, shared helpers) before the UI that
depends on them, so the history reads forwards.

## 3. Commit each group

```bash
git add <file> <file> …          # only the files in this group
git commit -m "<type>(<scope>): <imperative summary>"
```

- Type: `feat`, `fix`, `refactor`, `style`, `test`, `chore`, `docs`
- Scope (optional): the area touched — `(model)`, `(ui)`, `(levels)`, `(orbit)`
- Summary: imperative, ≤ 72 chars, no trailing period
- Example: `feat(meetups): tag meetups with the kind of hangout`

Repeat until `git status` is clean.

### When one file carries two concerns

`git add -p` is interactive and unavailable here, so hunk-level staging is not an option. Either:

- put the file in the commit whose concern dominates it, and say so in the report; or
- if the two concerns really must be separate commits, split them in the editor first — make the
  file contain only the first concern, commit, then add the second.

Do not silently bury a second concern in an unrelated commit.

## 4. Verify

```bash
git log --oneline -10
git status
```

Each commit should stand on its own and read as one clear step. The tree should be clean.

## 5. Stop

Do **not** push. Do **not** merge. Report which branch the work is on, what each commit covers,
and what the user should test. Merging waits for their explicit word — see `git-merge`.

## Checks

- [ ] Branch prefixed `feat/`, `fix/`, `refactor/` or `chore/`
- [ ] No commit mixes unrelated changes without that being stated
- [ ] Every message is imperative, typed, ≤ 72 chars
- [ ] Foundation commits come before the UI that needs them
- [ ] `git status` clean at the end
- [ ] No `git push`, no merge to main
