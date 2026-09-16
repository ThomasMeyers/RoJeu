# ADR 0005 - Hide the finale behind base64, not encryption

## Status

Accepted (15/09/2026)

## Context

The `ending_unlock` talent opens a finale: a three-line riddle, then a long personal speech. The
player gets the game by cloning the private repository, so anything written in clear in the source
(the riddle answers, the speech) is one file browse or one `grep` away from being spoiled.

Three options were weighed:

- **Plain text** in a catalog: simplest to edit, but spoils the finale for anyone opening `src/game/`.
- **Base64 obfuscation**: the text is unreadable at a glance, but anyone can decode it.
- **Encryption keyed on the answers** (store answer hashes, derive a key from the three answers to
  decrypt the speech): actually hides the content, at the cost of async WebCrypto, key derivation and
  a more fragile encode step.

## Decision

Base64. The recipient is a friend, not an adversary: the goal is to avoid an accidental spoiler, not
to resist a determined reader.

- The clear text lives in `finale.local.json` at the project root, ignored by git.
- `npm run encode-finale` (`scripts/encode-finale.mjs`) validates it and writes
  `src/game/finaleSecret.ts`, a single UTF-8 base64 blob.
- `decodeFinaleSecret()` in `src/game/finaleCatalog.ts` decodes it at runtime.
- Riddle prompts, wrong-answer quips and UI labels stay in clear in `finaleCatalog.ts`: they give
  nothing away.

## Consequences

- Browsing or grepping the code reveals neither the answers nor the speech; decoding the blob does.
- Editing the finale always takes the encode step. A hand edit of `finaleSecret.ts` is lost on the next run.
- `finale.local.json` exists only on the author's machine. If it is lost, decode `FINALE_SECRET`
  (`atob` + UTF-8) to get it back.
- The real answers must never appear in clear anywhere versioned: tests use stand-in answers, and
  docs and commit messages do not quote them.
- The prompt count is duplicated between `FINALE_RIDDLE_PROMPTS` and the script's `PROMPT_COUNT`;
  `finaleCatalog.test.ts` fails if the committed secret no longer matches the prompts.
