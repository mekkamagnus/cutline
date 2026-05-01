# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 5. Installed CLI Tools (use these, not the defaults)

- `bun` is installed - prefer it over `node` and `npm`
- `ripgrep` (`rg`) is installed - prefer it over `grep`
- `jq` is installed - use for JSON processing
- `gh` is installed - use for GitHub interaction
- `playwright-cli` is installed - use for browser automation and verifying web app UI changes
- `tmux` is installed - use for completing task in terminal session windows (e.g `session-name:some-window`)

## 6. Learn From Corrections

Persistent lessons live in [`./docs/learnings.md`](./docs/learnings.md) - read it at the start of every task and follow every rule there.

When the user corrects a mistake you made:

!. Apply the correction. 2. Append a rule to `learnings.md` so the same mistake doesn't recur. 3. Show the user the new rule before continuing.

## 7. Further rules

- [`rules/`](./rules) - path-scoped rule files. Each declares its scope on the first line; read the ones that match what you're touching.
- Directory-level `Claude.md` files (e.g. [`apps/`](./apps/Claude.md), [`services/`](./services/Claude.md)) declare rules that apply to all files in that directory.

## 8. Verify Before Reporting Complete

Before reporting any task as complete, verify it actually works:

- Run the tests, execute the script, check the output yourself.
- For TypeScript: run `tsc --noEmit` and fix every type error.
- for builds: run the build command and confirm it succeeds.
- If you cannot verify (no test exists, can't run the code), say so explicitly. Don't imply success.
- Use `playwright-cli` to verify the web app UI changes.

Report outcomes faithfully:

- If test fail, say so with the relevant output. Never claim "all tests pass" when output shows failures.
- Never suppress, simplify, or skip a failing check (test, lint, type error) to manufacture a green result.
- Never characterize incomplete or broken work as done.
- When something did pass or work, state it plainly. Don't hedge confirmed results with disclaimers, and don't re-verify things you already checked.

The goal is an accurate report, not a defensive one.
