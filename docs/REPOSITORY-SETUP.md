# Maintainer repository setup

The branding, guides and templates are versioned in this repository. Some GitHub settings require separate repository-administration permissions. The Arena GitHub integration returned **HTTP 403** when attempting to change the About settings, so the values below are prepared for the repository owner to apply—not claimed as already configured.

## About panel

Open the repository → the gear icon beside **About**.

**Description**

> Local-first Windows energy tracker with live battery telemetry, charging diagnostics, app CPU activity, cost estimates and CSV reports. Built with Electron + React.

**Website**

```text
https://github.com/nikhilnikhil4331/Wattwise/releases
```

Use the release list, not `/releases/latest`: the current builds are prereleases.

**Topics**

```text
wattwise energy-monitoring battery-monitor windows-11 electron react local-first power-management desktop-app javascript
```

If using an authenticated GitHub CLI with permission to edit repository settings:

```bash
gh repo edit nikhilnikhil4331/Wattwise \
  --description "Local-first Windows energy tracker with live battery telemetry, charging diagnostics, app CPU activity, cost estimates and CSV reports. Built with Electron + React." \
  --homepage "https://github.com/nikhilnikhil4331/Wattwise/releases" \
  --add-topic wattwise --add-topic energy-monitoring --add-topic battery-monitor \
  --add-topic windows-11 --add-topic electron --add-topic react \
  --add-topic local-first --add-topic power-management --add-topic desktop-app \
  --add-topic javascript
```

Do not paste credentials into issues or chat. If granting settings access to the integration, manage it through GitHub/Arena's connection settings.

## Social preview

Upload [`assets/social-preview.png`](assets/social-preview.png) under **Settings → General → Social preview**. It is a 1280 × 640 PNG rendered from the project banner. This file does not upload itself when pushed.

## Licensing — decision required

No project license has been selected. Do not add an MIT/GPL badge or describe the project as licensed open source until the owner chooses terms and verifies their right to license all contributed code/assets. Third-party dependencies retain their own license obligations.

Once chosen, add the appropriate `LICENSE`, package metadata and README link in a reviewed change.

## Security and repository health

- Consider enabling **Private vulnerability reporting** under Settings → Code security, then update `SECURITY.md` to reflect the actual reporting channel.
- Review dependency alerts and any branch rules appropriate for your workflow. Do not claim these are enabled without checking GitHub.
- Pin the repository on your profile if desired. No stars, sponsorships, downloads or awards should be fabricated in the README.
- Publish default-branch documentation through a reviewed PR. Issue forms and community-health files are most discoverable once present on the default branch.
- The Windows release workflow currently targets the configured working branch. Deliberately review release triggers before changing them to `main` or tags; do not accidentally publish from untrusted PR code.
