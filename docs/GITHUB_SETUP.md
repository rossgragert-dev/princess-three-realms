> **v0.1b: use `docs/DEPLOY_GITHUB_PAGES.md`** (no Actions needed; publish the `gh-pages` branch or upload `site/`). The steps below describe the older Vite/Actions route.

# Publishing to GitHub (exact commands)

The authoring session could not create repositories (GitHub GraphQL and `POST /user/repos` are blocked; the session is bound to
other repositories), so nothing was pushed and no existing repository was touched. The project is a clean local Git repository on `main`.

```bash
# 1. Get the repo onto a machine where you are signed in to GitHub (gh auth login)
git clone princess-three-realms.bundle princess-three-realms     # the bundle delivered with this milestone
cd princess-three-realms

# 2. Create the NEW repository and push (public: free GitHub Pages needs a public repo)
gh repo create princess-three-realms --public --description "Princess of Three Realms - cozy pixel-art storybook adventure (Phaser 3 + TypeScript)" --source=. --remote=origin --push

# 3. Let GitHub Actions deploy Pages, then push once more to trigger it
OWNER=$(gh api user -q .login)
gh api -X POST repos/$OWNER/princess-three-realms/pages -f build_type=workflow
git commit --allow-empty -m "Trigger first Pages deploy" && git push

# 4. Watch the runs
gh run watch
echo "Preview: https://$OWNER.github.io/princess-three-realms/"
```

Private repo instead? Replace `--public` with `--private`; Pages then needs a paid plan, and `pages.yml` will fail until enabled.

## What the first Actions run will do
`ci.yml`: `npm install` -> `npm run test:logic` -> `npm run build` (tsc with the real Phaser types + Vite + precache stamp) -> Playwright (iPad landscape/portrait + desktop).
`pages.yml`: the same test + build, then deploys `dist/` to Pages. The build uses a relative base, so the project sub-path works.
Hosted runners have normal npm access, so the first run should also surface any Vite/TypeScript issue this offline session could not reach. After it
succeeds, commit the generated `package-lock.json` (`git add package-lock.json`, or download it from the run) and switch the workflows to `npm ci`.
