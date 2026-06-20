# CaSS Documentation

This is the documentation site for [CaSS (Competency and Skills System)](https://cassproject.org). It is built with [VuePress](https://vuepress.vuejs.org/) and deployed to [docs.cassproject.org](https://docs.cassproject.org) via GitHub Pages.

## Versioned Documentation

Documentation is maintained for multiple CaSS versions:

- **[v1.6](https://docs.cassproject.org/v1.6/)** — Current
- **[v1.5](https://docs.cassproject.org/v1.5/)** — Previous
- **[v1.4](https://docs.cassproject.org/v1.4/)** — Legacy
- **[v1.3](https://docs.cassproject.org/v1.3/)** — Legacy

## Project Setup

```bash
npm install
```

### Development (hot-reload)

```bash
# Develop a specific version
npm run docs:dev:v1.6

# Default (currently v1.6)
npm run docs:dev
```

### Build for Production

```bash
# Build all versions
npm run docs:buildAll

# Build a specific version
npm run docs:v1.6
```

### Deployment

Deployment is automated via GitHub Actions. Pushing to the `master` branch triggers a build of all documentation versions and deploys the output to GitHub Pages.

## Related Repositories

- [CASS](https://github.com/cassproject/CASS) — CaSS Server
- [cass-npm](https://github.com/cassproject/cass-npm) — CaSS JavaScript Library
- [cass-editor](https://github.com/cassproject/cass-editor) — CaSS Authoring Tool

## License

See [LICENSE](LICENSE) for details.
