// OAuth proxy for Sveltia CMS, step 2: swap GitHub's code for a token and hand it to /admin.
const CMS_ORIGIN = 'https://www.renovadesignbuild.com';

// Popup handshake used by Netlify/Decap/Sveltia. The token only ever goes to CMS_ORIGIN.
function popupPage(result) {
  const message = JSON.stringify(`authorization:github:${result.token ? 'success' : 'error'}:${JSON.stringify({ provider: 'github', ...result })}`).replace(/</g, '\\u003c');
  return `<!doctype html><meta charset="utf-8"><title>Signing in…</title><body><p>Signing in…</p><script>
    const origin = ${JSON.stringify(CMS_ORIGIN)};
    window.addEventListener('message', (e) => {
      if (e.origin !== origin || e.data !== 'authorizing:github') return;
      e.source.postMessage(${message}, origin);
    });
    if (window.opener) window.opener.postMessage('authorizing:github', origin);
    else document.querySelector('p').textContent = 'Please start the sign-in from the website editor.';
  </script>`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Set-Cookie', 'cms_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=0');

  const { code, state } = req.query;
  const expected = /(?:^|;\s*)cms_oauth_state=([0-9a-f]{32})/.exec(req.headers.cookie || '')?.[1];
  if (!code || !state || state !== expected) {
    res.status(400).send(popupPage({ error: 'Sign-in expired. Please try again.' }));
    return;
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
        code,
      }),
    });
    const { access_token: token, error_description: error } = await response.json();
    res.status(200).send(popupPage(token ? { token } : { error: error || 'GitHub did not return a token.' }));
  } catch {
    res.status(502).send(popupPage({ error: 'Could not reach GitHub. Please try again.' }));
  }
}
