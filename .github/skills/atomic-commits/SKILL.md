# Atomic Commits & Conventional Commits Skill

## When to use this skill
Use this skill whenever the user asks you to write a commit message, review changes for committing, or organize a `git commit` process.

## Objective
To ensure that all commits are **atomic** (one logical change per commit) and follow the **Conventional Commits** specification for automated tools, semantic versioning, and clear history.

## Process
1. **Analyze the Diff/Changes**
   - Review the current staged changes or the provided diff.
   - **Enforce Atomicity**: If the diff contains multiple unrelated changes (e.g., a bug fix AND a new feature, or refactoring alongside new logic), ask the user if they want to split the changes into multiple commits. Do not lump unrelated changes into one commit.
2. **Determine the Commit Type**
   - `feat`: Introduces a new feature.
   - `fix`: Patches a bug in the codebase.
   - `docs`: Documentation-only changes.
   - `style`: Formatting, missing semi-colons, etc; no code change.
   - `refactor`: Refactoring production code, e.g. renaming a variable.
   - `perf`: Code improvements for performance.
   - `test`: Adding missing tests, refactoring tests.
   - `build`: Build system or external dependencies.
   - `ci`: CI configuration files and scripts.
   - `chore`: Updating grunt tasks etc; no production code change.
   - `revert`: Reverts a previous commit.
3. **Determine the Scope (Optional)**
   - Provide a noun describing the section of the codebase surrounded by parenthesis (e.g., `(parser)`, `(api)`, `(lang)`).
4. **Draft the Description**
   - A short, imperative summary of the code changes.
   - Do not capitalize the first letter.
   - Do not end with a period.
5. **Check for Breaking Changes**
   - If the commit introduces a breaking API change (MAJOR in SemVer), append a `!` after the type/scope (e.g., `feat(api)!: ...`) AND/OR include a `BREAKING CHANGE:` footer.
6. **Draft the Body and Footers (Optional)**
   - Leave one blank line after the description.
   - Body: Provide additional contextual information (what and why, not how).
   - Footers: Include references to issues, PRs, or breaking changes (e.g., `Refs: #123`, `BREAKING CHANGE: <description>`).

## Format Requirement
Ensure the final output strictly adheres to this structure:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Example Outputs
- `feat(auth): add OAuth2 login support`
- `fix: prevent racing of requests`
- `feat!: drop support for Node 6`

## Quality Criteria
- The commit type is valid.
- The change is singular and focused (atomic).
- The description accurately reflects the change.
- Breaking changes are clearly marked.