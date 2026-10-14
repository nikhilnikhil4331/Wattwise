# Security policy

Wattwise is an early-preview local desktop app, not a hardened or certified energy meter. There is no security response SLA or long-term support guarantee. Use the newest preview when reporting a problem and identify the exact version or commit.

## Report a vulnerability safely

Do **not** publish exploit details, credentials, private tracking data or full diagnostic archives in a public issue.

1. If GitHub displays **Security → Report a vulnerability**, use that private reporting flow.
2. If that option is unavailable, open an issue titled **Private security contact request**, without technical details or personal data. Ask the maintainer to arrange a private reporting channel before sharing the report.
3. Once a private channel is established, include the affected version, prerequisites, impact, minimal reproduction and a suggested mitigation if known.

Private reporting has not been assumed to be enabled. No security email address or response timeline is promised here.

## Security boundaries

- Electron's renderer is sandboxed, with context isolation and no Node integration.
- The restricted preload bridge exposes validated app operations, not arbitrary file, network or shell execution.
- The Windows reader uses a fixed, read-only PowerShell command. It does not request elevation or bypass execution policy.
- No custom kernel driver is installed. Secure Boot, VBS, SmartScreen and organization policies must remain respected.
- Energy state is stored locally; app-activity process names are held in memory only. Wattwise does not intentionally upload tracking data.
- Local storage is **not an encrypted vault**. OS account permissions and device security still matter.

## Downloads

Installers are currently **unsigned**. Download from this repository's [Releases](https://github.com/nikhilnikhil4331/Wattwise/releases), compare the matching SHA-256 checksum, and respect Windows warnings and organization policy. A checksum is not a code-signing certificate.

Do not disable Windows security, run unknown drivers, or bypass organizational controls to get a reading. Unsupported sensors should remain unavailable.

## Scope examples

Potential security reports include unexpected renderer access to files/shell commands, unvalidated IPC, unsafe parsing, dependency vulnerabilities with a reproducible impact, or accidental upload of private data. Unsupported battery readings and inaccurate estimates are normally [support issues](SUPPORT.md), unless there is a security impact.
