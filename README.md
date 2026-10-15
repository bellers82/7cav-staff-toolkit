# 7Cav Staff Response Toolkit

A Tampermonkey userscript for inserting standard LOI responses into 7Cav private conversation replies. **It never sends a message automatically.**

## Install
1. Install the Tampermonkey browser extension.
2. Open `7cav-staff-toolkit.user.js` using its GitHub **Raw** URL, or create a new Tampermonkey script and paste the file's contents.
3. Save and enable the script.
4. Open a 7Cav private conversation, open its reply editor, and choose a template from **LOI Reply** near the toolbar.
5. Review and manually submit the message.

## Important
- The forum hostname and page markup need verification on a live conversation page. This is a starting implementation, not a confirmed compatible release.
- The script does not transmit messages or applicant information to third parties.
- Only install scripts from maintainers you trust: browser userscripts can access pages they run on.

## Updating through GitHub
After creating a repository, replace the `@namespace` with your repository URL and add these two metadata lines (with your real GitHub username and repo name):

```javascript
// @updateURL    https://raw.githubusercontent.com/USERNAME/REPO/main/7cav-staff-toolkit.user.js
// @downloadURL  https://raw.githubusercontent.com/USERNAME/REPO/main/7cav-staff-toolkit.user.js
```

Commit each change and increment `@version` (e.g. `0.1.1`) for Tampermonkey to recognize an update. Update checks depend on users' Tampermonkey settings and are not necessarily immediate.
