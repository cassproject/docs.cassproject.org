# What's New in CaSS v1.6

CaSS v1.6 is a major release that modernizes the platform across the board — from the server runtime and data layer to the client library and editor. This release introduces reactive event processing with RxJS, migrates the CaSS Editor to Vue 3, adds AI-powered features via Ollama and Model Context Protocol (MCP), hardens security with FIPS compliance and SSRF protections, and delivers significant performance improvements to profile calculation and cryptographic operations.

If upgrading from v1.5, read the [Breaking Changes](#breaking-changes) section carefully before proceeding.

## Breaking Changes

::: danger
The following changes may require updates to the existing deployment, custom adapters, or downstream code. Review each item before upgrading.
:::

### 1. Reactive Processing with RxJS (1.6.0)

The server has been refactored to use [RxJS](https://rxjs.dev/) for reactive event processing. If the user have custom `server.js` overrides, they will need to be updated to work with the new event bus model. See [Reactive Event Bus](#reactive-event-bus-rxjs) below for details on the new event system.

### 2. Adapter Directory Restructure (1.6.1)

Adapters have been moved from `adapter/*/*` to `cartridge/adapter/*`. Any custom adapters or scripts that reference the old directory structure must be updated:

```diff
- adapter/xapi/xapi.js
+ cartridge/adapter/xapi/xapi.js
```

### 3. Container Runs as User 1000 (1.6.11)

The Docker container now runs as non-root user `1000` instead of `root`. Downstream Dockerfiles that `FROM` the CaSS image must accommodate this change — for example, file permissions and volume mounts may need adjustment.

```dockerfile
# If your downstream Dockerfile needs root temporarily:
USER root
RUN apt-get install -y some-package
USER 1000
```

### 4. Node.js 24 (1.6.5)

CaSS now runs on **Node.js 24**, upgraded from previous Node versions. Verify that any native modules or custom server extensions are compatible with Node.js 24.

### 5. Elasticsearch 9.x (1.6.5 / 1.6.7)

The data layer has been upgraded from Elasticsearch 8.x to **Elasticsearch 9.x**. Existing Elasticsearch clusters must be upgraded accordingly. The bundled Docker Compose configuration includes the updated Elasticsearch version.

### 6. skyRepo.js Refactored (1.6.3)

The monolithic `skyRepo.js` file has been refactored into multiple smaller files for maintainability. If the user have custom patches or overrides that reference `skyRepo.js` directly, they will need to be updated to target the appropriate new file(s).

### 7. CaSS Library Version Jump

The `cassproject` npm package has been renamed from version **1.5.x** to **5.0.x** to comply with [Semantic Versioning](https://semver.org/). Update the `package.json` dependency accordingly:

```diff
- "cassproject": "^1.5.0"
+ "cassproject": "^5.0.0"
```

## New Features

### Reactive Event Bus (RxJS)

CaSS v1.6 introduces a reactive event bus powered by RxJS. Four event streams are available for subscribing to system events:

| Event Stream | Description |
|---|---|
| `events.server` | Server lifecycle events (startup, shutdown, requests) |
| `events.database` | Database operations (reads, writes, deletes) |
| `events.person` | Person/identity events (login, logout, key operations) |
| `events.data` | Data change events (create, update, delete of any object) |

```js
import { events } from 'cassproject';

events.data.subscribe((event) => {
    console.log('Data changed:', event.type, event.id);
});
```

::: tip
The reactive event bus enables powerful integrations — for example, triggering profile recalculation when assertions change, or notifying external systems when frameworks are updated.
:::

### Ephemeral Storage

A new **TTL-based temporary data storage** system allows data to be stored with an automatic expiration. This is used internally for profile caching but is available for custom use cases as well.

### Multidelete

CaSS now supports **batch delete operations** on both the server and client library. This is significantly more efficient than deleting objects one at a time.

```js
await EcRepository.multidelete(repo, arrayOfIds);
```

### Ollama Adapter (Proof of Concept)

A proof-of-concept adapter integrates with [Ollama](https://ollama.ai/) to provide **AI-assisted competency framework generation**. This enables large language models running locally to assist in authoring competency frameworks.

::: warning
The Ollama adapter is a proof of concept and may change significantly in future releases.
:::

### Implies Relation

A new **implies** relation type has been added. When competency A *implies* competency B, positive assertions on A can transfer to B. This enables more expressive competency modeling and richer assertion processing.

### Distroless Docker Image

A **distroless** Docker image variant is now available, providing a minimal attack surface with no shell, package manager, or unnecessary system utilities. This is recommended for production deployments with strict security requirements.

### OpenAPI Documentation

Comprehensive **OpenAPI / Swagger** documentation is now available at `/api/swagger/` on any CaSS instance. The API specification is validated at startup to ensure accuracy.

::: tip
Visit `https://the-cass-instance/api/swagger/` to explore the API interactively.
:::

### MCP Server

CaSS now exposes a **Model Context Protocol (MCP)** server at `/api/mcp`, enabling AI agents and tools to interact with CaSS programmatically. This allows large language model workflows to query, create, and manage competency data.

### FETCH_ALLOW_LIST

A new `FETCH_ALLOW_LIST` environment variable provides **SSRF (Server-Side Request Forgery) prevention** by restricting which external URLs the CaSS server is allowed to fetch.

```bash
FETCH_ALLOW_LIST=https://trusted-domain.com,https://another-domain.org
```

### Path Traversal Attack Detection

The server now includes **path traversal attack detection**, rejecting requests that attempt to access files outside the expected directories.

### Alpine FIPS Support

CaSS now supports **FIPS 140-3** compliance via a hybrid OpenSSL configuration with the FIPS module on Alpine Linux (OpenSSL 3.1.2). This is critical for deployments in government and regulated environments.

### Kubernetes Deployment Support

Full **Kubernetes manifests** are now provided for deploying CaSS in K8s clusters, including deployments, services, configmaps, and persistent volume claims.

## CaSS Library (cassproject npm) Changes

The CaSS JavaScript library has received a major update alongside the server:

- **Version 5.0.x** — adopts [Semantic Versioning](https://semver.org/) (previously 1.5.x)
- **Multidelete API** — `EcRepository.multidelete()` for batch deletions
- **Implies relation support** — new relation type for assertion transfer
- **Native WebCrypto** — AES encryption and JWK export now use the browser/Node.js native WebCrypto API, resulting in **4–10x faster** cryptographic operations
- **Removed heavy dependencies** — `forge`, `pem-jwk`, and `rdf-canonize` have been removed, significantly reducing bundle size
- **Improved CTDL-ASN import/export** — better compliance with the Credential Transparency Description Language
- **Better encrypted data handling** — more robust decryption and error recovery
- **Assertion deduplication** — prevents duplicate assertions from accumulating

::: tip
The move to native WebCrypto is the single largest performance improvement in the library. If the user were previously bottlenecked on assertion decryption or key operations, expect a significant speedup.
:::

## CaSS Editor Changes

The CaSS Editor (cass-editor) has been substantially modernized:

| Area | Before (v1.5) | After (v1.6) |
|---|---|---|
| Framework | Vue 2 | **Vue 3** |
| State Management | Vuex | **Pinia** |
| Build Tooling | Webpack | **Vite 7** |
| Module System | CommonJS | **ES Modules** |
| Documentation | — | **VitePress** |

Additional editor improvements:

- **Progression Model views** — new visualization for competency progression
- **Improved Copy Framework** — more reliable framework duplication
- **ES Module support** — the editor is now fully ESM-compatible

::: warning
If the user have custom CaSS Editor plugins built against Vue 2 / Vuex, they will need to be migrated to Vue 3 / Pinia.
:::

## xAPI Adapter Improvements (1.6.9)

The xAPI adapter has been significantly enhanced:

- **Environment variable overrides** — xAPI configuration can now be set via environment variables, making containerized deployments easier
- **Improved pagination** — uses the Fetch API for more reliable pagination of large xAPI statement sets
- **Group performance parsing** — xAPI group results are now parsed into individual assertions
- **Reactive profile cache invalidation** — profile caches are automatically invalidated when new xAPI data arrives, using the reactive event bus

## Security Improvements

CaSS v1.6 includes several important security enhancements:

| Improvement | Description |
|---|---|
| Path traversal detection | Rejects requests attempting directory traversal attacks |
| `FETCH_ALLOW_LIST` | Prevents SSRF by restricting outbound fetch URLs |
| FIPS 140-3 compliance | OpenSSL 3.1.2 with FIPS module on Alpine |
| Distroless container | Minimal image with no shell or package manager |
| Non-root container | Runs as user `1000` instead of `root` |
| `qs` dependency update | Security patch for query string parsing |

::: tip
For maximum security hardening, combine the distroless image with `FETCH_ALLOW_LIST`, FIPS mode, and Kubernetes network policies.
:::

## Performance Improvements

Several areas have seen measurable performance gains:

- **Profile caching with 30-day TTL** — computed profiles are cached using [ephemeral storage](#ephemeral-storage) with a configurable TTL (default 30 days), avoiding redundant recalculation
- **1 GB worker memory for profile calculation** — dedicated memory allocation prevents out-of-memory errors during large profile computations
- **SkyRepo cull methods** — new `cull` and `cullFast` methods reclaim disk space by removing old versions of objects from Elasticsearch
- **Improved `cullFast` performance** — optimized for faster execution on large datasets
- **Library crypto 4–10x faster** — native WebCrypto replaces the JavaScript-based `forge` library for AES and key operations

## Full Changelog

The full changelog is available in the [CASS GitHub repository](https://github.com/cassproject/CASS/blob/master/CHANGELOG.md).

### v1.6.13
- Bug fixes and stability improvements

### v1.6.12
- Bug fixes and stability improvements

### v1.6.11
- Container now runs as non-root user `1000`
- Security hardening for production deployments

### v1.6.10
- Bug fixes and minor improvements

### v1.6.9
- xAPI adapter: environment variable overrides for configuration
- xAPI adapter: improved pagination with Fetch API
- xAPI adapter: group performance parsing into assertions
- Reactive profile cache invalidation

### v1.6.8
- Bug fixes and stability improvements

### v1.6.7
- Elasticsearch 9.x compatibility finalized
- Additional stability improvements

### v1.6.6
- Bug fixes and minor improvements

### v1.6.5
- **Node.js 24** upgrade
- **Elasticsearch 9.x** initial support
- Performance improvements

### v1.6.4
- Bug fixes and stability improvements

### v1.6.3
- **skyRepo.js refactored** into multiple files
- SkyRepo cull methods for disk space reclamation
- Improved `cullFast` performance

### v1.6.2
- Bug fixes and minor improvements

### v1.6.1
- **Adapter directory restructure** — moved to `cartridge/adapter/*`
- OpenAPI / Swagger documentation at `/api/swagger/`
- MCP server at `/api/mcp`

### v1.6.0
- **Reactive event bus** with RxJS (`events.server`, `events.database`, `events.person`, `events.data`)
- **Ephemeral storage** with TTL-based expiration
- **Multidelete** support (server and library)
- **Ollama adapter** (proof of concept)
- **Implies relation** type
- **Distroless Docker image** variant
- **FETCH_ALLOW_LIST** for SSRF prevention
- **Path traversal attack detection**
- **Alpine FIPS support** with OpenSSL 3.1.2
- **Kubernetes deployment** manifests
- CaSS Library upgraded to **5.0.x** (SemVer compliance)
