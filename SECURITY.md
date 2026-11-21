# Security and privacy policy

Verbidoo is used by children, so security and privacy issues are treated as top priority.

## Reporting a vulnerability

**Please don't open a public issue.** Report it privately through GitHub: [Security → Report a vulnerability](https://github.com/oscarandrespabonestrella/verbidoo/security/advisories/new).

Include what you found, how to reproduce it and what it could expose. You'll get an answer within 7 days. Once it's fixed you'll be credited in the advisory, unless you prefer otherwise.

Especially relevant:

- anything that lets one parent account read or change another family's data (Supabase row-level security in `supabase/cloud.sql`)
- anything that sends a child's data somewhere other than the parent's own Supabase project
- bypasses of the grown-up check that guards the parent area
- a secret or API key committed to the repository

## Supported versions

Only the latest version on `main` (deployed at <https://verbidoo.quest>) receives fixes.

## Keys in this repository

The Supabase **anon / publishable** key is public by design; row-level security protects the data. Text-to-speech keys (`GOOGLE_TTS_API_KEY`, `AZURE_SPEECH_KEY`) are only read from environment variables by the recording scripts and must never be committed.
