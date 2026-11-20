# Security

Windowsill keeps each person's plants and photos private using Supabase row-level security and a
private storage bucket. If you find a way around that, or any other security problem, please
report it privately through GitHub's
[private vulnerability reporting](https://github.com/mfscifly/windowsill/security/advisories/new)
rather than opening a public issue.

## Keys

- The **anon public** key is designed to be shipped to browsers; row-level security is what
  protects the data.
- The **service_role** key bypasses those rules. It must never appear in the app, the build, an
  issue, or git. If you ever expose it, rotate it in your Supabase dashboard right away.
