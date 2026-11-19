# Website editor (/admin) — setup and handover

The site's text and photos live in `content/*.json`. The build (`npm run build`) turns those files plus
the templates in `src/` into plain HTML in `public/`, which Vercel serves. The editor at `/admin` is
[Sveltia CMS](https://github.com/sveltia/sveltia-cms) (a lighter, drop-in replacement for Decap CMS).
It edits those same JSON files. Every **Save** in the editor is a commit to `main` on GitHub, and
Vercel then rebuilds and publishes the site, usually within a minute or two.

| Piece | Where |
| --- | --- |
| Editor page | `admin/index.html` (loads Sveltia CMS 0.249.1 from unpkg, `noindex`) |
| Editor forms (what the client can edit) | `admin/config.yml` |
| GitHub login (OAuth proxy) | `api/auth.js`, `api/callback.js` (Vercel functions) |
| Content | `content/*.json`, `content/projects/*.json` |
| Templates, SEO tags, schema (code-only) | `src/` |
| Build | `scripts/build.mjs` → `public/` (`vercel.json`: `npm run build`, output `public`) |

---

## Manual steps, in order

### 1. GitHub OAuth App

GitHub → **Settings → Developer settings → OAuth Apps**. The app is already created, so just check
these values:

| Field | Value |
| --- | --- |
| Application name | Renova Website Editor (anything works; the client sees this on the GitHub consent screen) |
| Homepage URL | `https://www.renovadesignbuild.com` |
| Authorization callback URL | `https://www.renovadesignbuild.com/api/callback` |
| Enable Device Flow | Off |

Copy the **Client ID**, then click **Generate a new client secret** and copy it straight away
(GitHub only shows it once).

> The login only works on `https://www.renovadesignbuild.com/admin/`. `api/callback.js` sends the token
> only to that exact address. If the bare domain (`renovadesignbuild.com`) is also connected in Vercel,
> it should redirect to `www`. Login won't work on Vercel preview URLs. That's intentional.

### 2. Vercel environment variables

Vercel → the project → **Settings → Environment Variables**. Add both for **Production**:

| Name | Value |
| --- | --- |
| `GITHUB_OAUTH_CLIENT_ID` | the Client ID from step 1 |
| `GITHUB_OAUTH_CLIENT_SECRET` | the client secret from step 1 (mark it **Sensitive**) |

Environment variables only take effect on a **new** deployment. After adding them, either push a
commit to `main` or use **Deployments → ⋯ → Redeploy** on the latest production deployment.

To check: open `https://www.renovadesignbuild.com/api/auth`. It should redirect to a GitHub page.
If it says "GitHub login is not configured.", the variables aren't in the current deployment.

### 3. Give the client access

The client needs a free GitHub account (github.com/signup). Then:

1. Open the repo `C1ayke/renova-design-build` → **Settings → Collaborators → Add people**.
2. Enter their GitHub username or email. On a personal-account repo like this one there is no role
   picker: collaborators automatically get Write access, which is what the editor needs. (If the repo
   ever moves to a GitHub organization, pick the **Write** role.)
3. They must **accept the email invitation** before they can log in to the editor.

To remove access later, delete them from the same Collaborators screen.

### 4. Send the client the guide below

---

## Client guide: how to edit your website

*(Plain-English version to send to the client.)*

**Logging in**

1. Go to **https://www.renovadesignbuild.com/admin/**
2. Click **Sign In with GitHub**. A small window opens. Sign in to GitHub if asked, and click
   **Authorize** the first time.
3. You'll see the **Renova Website Editor**.

**Changing text**

1. On the left, choose what you want to change:
   - **Pages**: Home, Services, About, Gallery, and Contact pages. Your phone number and email are
     on the **Contact Page**, and changing them there updates the footer too.
   - **Gallery Projects**: one entry per project, with its photos and videos.
   - **Site Layout**: menu labels, the "Get a Free Quote" button, and the footer.
2. Click into a box and type. The grey hint under each box explains where that text appears.
3. Click **Save** at the top. That's it. The change is live on the website in about **1–2 minutes**.
   Refresh the page to see it. (There is no separate "draft" step. Save publishes.)

**Swapping a photo**

1. Find the photo box and click the button to replace the photo.
2. Upload a photo from your computer (or drag it in), or choose one that's already on the site.
3. Fill in **Photo description**: one short sentence saying what's in the photo, for example
   "Finished cedar siding on a waterfront home in Surrey". Google and visually impaired visitors use it.
4. Click **Save**.

Large phone photos are fine. The editor shrinks them automatically. Please use JPG, PNG or WebP
(not iPhone HEIC; on an iPhone, set *Settings → Camera → Formats → Most Compatible*).

**Lists (projects, FAQs, services, team members, photos)**

- **Add**: click the **+ Add** button under the list.
- **Remove** or **reorder**: use the small menu on the item itself. The website shows items in the
  same order as the editor.

**Good to know**

- If something looks wrong after saving, change it back and save again. Every change is kept in
  history, so your web person can always restore an earlier version.
- The page layout, colours, and Google search settings can't be changed from the editor, so you
  can't accidentally break the design.
- If the site hasn't updated after 5 minutes, contact your web person. A save probably had a problem.

---

## Developer notes

**Testing locally.** Run `npm run dev`. It builds, serves the site on http://localhost:8080 and
rebuilds when anything in `content/`, `src/` or the assets changes. Open http://localhost:8080/admin/
in **Chrome or Edge**, click **Work with Local Repository** and pick this project folder. Edits are
written straight to `content/*.json` (and uploads to `images/`). Check them with `git diff`, then
commit or discard. Nothing touches GitHub. Sveltia doesn't use `decap-server` or `local_backend`
(it ignores that option), so there's nothing to switch off for production.

**What the CMS can't edit.** Page `<title>`s, meta descriptions, Open Graph tags and JSON-LD schema
live in `src/heads/*.html` and only change through code. The homepage schema
(`src/heads/index.html`) and the contact page meta description repeat the phone number and email. If
the client changes those on the Contact Page, update these two files by hand too.

**Login scope.** `api/auth.js` requests `public_repo`, the minimum for a public repo. If the repo is
ever made private, change it to `repo`, or the editor will fail to save.

**Upgrading Sveltia.** The CDN version is pinned in `admin/index.html`. Bump it deliberately and test
with `npm run dev` first.

**Content notes.** Open items from the original HTML comments (pending photos, unwired contact form)
are in `docs/content-notes.md`.
