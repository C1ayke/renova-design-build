// OAuth proxy for Sveltia CMS, step 1: send the editor to GitHub's consent screen.
import { randomBytes } from 'node:crypto';

export default function handler(req, res) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('GitHub login is not configured.');
    return;
  }
  const state = randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: clientId,
    // The repo is public, so editors' tokens never need access to private repos.
    // Change to "repo" if the repo is ever made private.
    scope: 'public_repo',
    state,
  });
  res.setHeader('Set-Cookie', `cms_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=600`);
  res.setHeader('Cache-Control', 'no-store');
  res.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
}
