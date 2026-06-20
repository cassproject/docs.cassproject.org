# CaSS Configuration

CaSS v1.6 is configured through **environment variables**, a **persistent volume** (`etc/`), and optional **TLS certificate files**. This page is a comprehensive reference for all available configuration options.

::: tip Quick Start
At minimum, you need three environment variables to get CaSS running:

```yaml
environment:
  CASS_LOOPBACK: "https://cass.example.org/api/"
  ELASTICSEARCH_ENDPOINT: "http://elasticsearch:9200"
  PORT: 80
```
:::

## Configuration Surfaces

CaSS reads configuration from three sources, in order of precedence:

| Source | Purpose | Examples |
|--------|---------|----------|
| **Environment Variables** | Primary configuration mechanism. Set via Docker Compose `environment:` block, systemd unit files, or shell exports. | `CASS_LOOPBACK`, `HTTPS` |
| **Persistent Volume (`etc/`)** | Auto-generated keys, salts, and secrets. Persisted across container restarts. Mount as a Docker volume. | `skyId.pem`, `skyId.secret` |
| **TLS Certificate Files** | Certificate chain and private key for HTTPS termination within CaSS. Mounted into the container. | `ca.crt`, `cass.crt`, `cass.key` |

::: warning
In v1.6, the Docker container runs as **user 1000** (non-root). Ensure that mounted volumes and certificate files are readable by UID 1000. This is a **breaking change** from v1.5.
:::

---

## Persistent Volume (`etc/`)

When CaSS starts for the first time, it auto-generates cryptographic material into the `etc/` directory. **Back up this directory** — losing it means losing the ability to decrypt data encrypted by this instance.

| File | Purpose |
|------|---------|
| `skyId.pem` | Server identity keypair (RSA PEM) |
| `skyId.secret` | Secret used for backup/restore authentication |
| `skyId.salt` | Salt for internal key derivation |
| `skyId.username.public.salt` | Salt for username-based public key derivation |
| `skyId.password.public.salt` | Salt for password-based public key derivation |
| `skyId.secret.public.salt` | Salt for secret-based public key derivation |
| `skyAdmin2.pem` | Administrator keypair |
| `adapter.xapi.json` | xAPI adapter credential store (alternative to env vars) |
| `adapter.case.private.pem` | CASE adapter signing key |
| `adapter.openbadges.private.pem` | Open Badges adapter signing key |
| `xapiAdapter.pem` | xAPI adapter identity keypair |
| `replicateAdapter.pem` | Replication adapter identity keypair |

```yaml
# Docker Compose volume mount example
services:
  cass:
    image: cassproject/cass:1.6
    volumes:
      - cass_etc:/app/etc
volumes:
  cass_etc:
```

---

## Core Settings

These variables control fundamental server behavior.

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the CaSS server listens on inside the container. | `80` |
| `CASS_LOOPBACK` | Public URL for the CaSS API. All created object identifiers use this as their base. | `http://localhost/api/` or `https://localhost/api/` |
| `CASS_LOOPBACK_PROXY` | Internal loopback URL when CaSS talks to itself through a different address than its public endpoint (e.g., `http://localhost/api/`). | — |
| `CASS_EXTERNAL_ENDPOINT` | URL of an external CaSS instance to use as the endpoint for creating alignments/relations instead of this instance. | — |
| `MAX_CONNECTIONS` | Maximum number of concurrent connections to the CaSS server. Integer value. | — |
| `NODEV` | Set to `true` to disable development features in production. | — |
| `PRODUCTION` | Set to `true` to enable production-mode optimizations and reduce log verbosity. | `false` |

---

## Elasticsearch

CaSS uses Elasticsearch as its backing data store. v1.6 adds compatibility with **Elasticsearch 9.x**.

| Variable | Description | Default |
|----------|-------------|---------|
| `ELASTICSEARCH_ENDPOINT` | URL of the Elasticsearch service. | `http://localhost:9200` |
| `ELASTICSEARCH_AUTHORIZATION` | Value for the `Authorization` header when connecting to Elasticsearch (e.g., `Basic dXNlcjpwYXNz` or `ApiKey ...`). | — |

```yaml
environment:
  ELASTICSEARCH_ENDPOINT: "http://elasticsearch:9200"
  # For secured Elasticsearch clusters:
  ELASTICSEARCH_AUTHORIZATION: "Basic dXNlcjpwYXNzd29yZA=="
```

---

## TLS / HTTPS

CaSS can terminate TLS directly. Place certificate files where the container can read them and set the variables below.

| Variable | Description | Default |
|----------|-------------|---------|
| `HTTPS` | Enable HTTPS on the CaSS server. | `false` |
| `HTTP2_SERVER` | Enable HTTP/2 support (requires `HTTPS=true`). | `false` |
| `NODE_EXTRA_CA_CERTS` | Path to a CA bundle file for trusting custom certificate authorities. | — |
| `HTTPS_REJECT_UNAUTHORIZED` | Set to `false` to disable TLS certificate validation for outbound requests. **Development only.** | `true` |

### Client Certificate Authentication

| Variable | Description | Default |
|----------|-------------|---------|
| `REQUEST_CLIENT_SIDE_CERTIFICATE` | Request (but do not require) a client certificate from connecting clients. | `false` |
| `CLIENT_SIDE_CERTIFICATE_ONLY` | Require a valid client certificate for all connections. Implies `REQUEST_CLIENT_SIDE_CERTIFICATE`. | `false` |
| `CRL_LISTS` | Comma-separated list of URLs to Certificate Revocation Lists (CRLs) for client certificate validation. | — |

```yaml
# Example: HTTPS with client certificate authentication
environment:
  HTTPS: "true"
  HTTP2_SERVER: "true"
  REQUEST_CLIENT_SIDE_CERTIFICATE: "true"
  NODE_EXTRA_CA_CERTS: "/certs/ca.crt"
volumes:
  - ./certs/ca.crt:/certs/ca.crt:ro
  - ./certs/cass.crt:/certs/cass.crt:ro
  - ./certs/cass.key:/certs/cass.key:ro
```

---

## Authentication

CaSS supports multiple authentication modes. **Only one mode should be active at a time.**

### Key-Based Authentication (Default)

The default mode. Users authenticate using public/private keypairs managed by the CaSS client libraries. No additional configuration is required.

### OIDC / SSO (Keycloak)

Connect CaSS to an OpenID Connect provider such as Keycloak for single sign-on.

| Variable | Description | Default |
|----------|-------------|---------|
| `CASS_OIDC_ENABLED` | Enable OpenID Connect authentication. | `false` |
| `CASS_OIDC_ISSUER_BASE_URL` | URL of the OIDC issuer (e.g., Keycloak realm URL). | `https://dev.keycloak.eduworks.com/auth/realms/test-realm/` |
| `CASS_OIDC_CLIENT_ID` | OIDC client ID registered with the provider. | `cass` |
| `CASS_OIDC_SECRET` | OIDC client secret. | — |
| `CASS_OIDC_BASE_URL` | Base URL for login/logout API endpoints. | `http://localhost/` |

```yaml
environment:
  CASS_OIDC_ENABLED: "true"
  CASS_OIDC_ISSUER_BASE_URL: "https://keycloak.example.org/auth/realms/my-realm/"
  CASS_OIDC_CLIENT_ID: "cass"
  CASS_OIDC_SECRET: "my-client-secret"
  CASS_OIDC_BASE_URL: "https://cass.example.org/"
```

### JWT Bearer Token

Authenticate API requests using signed JWT bearer tokens.

| Variable | Description | Default |
|----------|-------------|---------|
| `CASS_JWT_ENABLED` | Enable JWT bearer token authentication. | `false` |
| `CASS_JWT_SECRET` | Shared secret or key for JWT signature verification. | `cass` |
| `CASS_JWT_ALGORITHM` | JWT signing algorithm (`HS256`, `RS256`, etc.). | `HS256` |

```yaml
environment:
  CASS_JWT_ENABLED: "true"
  CASS_JWT_SECRET: "my-jwt-secret-key"
  CASS_JWT_ALGORITHM: "HS256"
```

### Platform One

Enable authentication through Platform One's identity provider.

| Variable | Description | Default |
|----------|-------------|---------|
| `CASS_PLATFORM_ONE_AUTH_ENABLED` | Enable Platform One authentication. | `false` |

::: tip
Platform One authentication may require additional variables depending on the specific P1 environment. Consult your P1 administrator for the required issuer URLs and client configuration.
:::

---

## Access Control

### IP Allowlisting

Restrict access to the CaSS server by client IP address.

| Variable | Description | Default |
|----------|-------------|---------|
| `CASS_IP_ALLOW` | Comma-separated list of allowed IP addresses or CIDR ranges. When set, only listed IPs may connect. | — |
| `CASS_IP_DENIED_REDIRECT` | URL to redirect denied clients to (e.g., an access-denied page). | — |

### Environment-Based Admins

Grant administrative privileges to specific users identified by email address, without requiring key-based admin enrollment.

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_ALLOW_ENV_ADMINS` | Enable environment-variable-based admin assignment. | `false` |
| `AUTH_ENV_ADMIN_EMAILS` | Comma-separated list of email addresses to grant admin privileges. | — |

### Federated Identity / Keystore

| Variable | Description | Default |
|----------|-------------|---------|
| `CASS_ELASTIC_KEYSTORE` | Enable the Elasticsearch-backed federated identity keystore. | `false` |
| `CASS_ELASTIC_KEYSTORE_ENDPOINT` | Endpoint for the federated identity keystore Elasticsearch index. | — |

---

## Adapters

Adapters extend CaSS with import/export capabilities and integrations. Disable unwanted adapters to reduce attack surface and startup time.

| Variable | Description | Default |
|----------|-------------|---------|
| `DISABLED_ADAPTERS` | Comma-separated list of adapters to disable. Valid values include: `asn`, `case`, `ceasn`, `jsonld`, `badge`, `xapi`, `profile`, `ollama`, `pna`, `scd`. | — |

```yaml
# Disable adapters you don't need
environment:
  DISABLED_ADAPTERS: "ollama,pna,scd"
```

### xAPI Adapter

Push or pull xAPI statements to/from an LRS.

| Variable | Description | Default |
|----------|-------------|---------|
| `XAPI_ENABLED` | Enable the xAPI adapter. | `false` |
| `XAPI_ENDPOINT` | URL of the xAPI (LRS) endpoint. | — |
| `XAPI_AUTH` | Authorization header value for the xAPI endpoint. | — |

Alternatively, configure xAPI credentials via the file `etc/adapter.xapi.json`:

```json
{
  "endpoint": "https://lrs.example.org/xapi/",
  "auth": "Basic dXNlcjpwYXNz"
}
```

::: tip New in v1.6
xAPI adapter settings can now be fully configured through environment variables, removing the need for the JSON file in most deployments.
:::

### PNA Adapter (AWS S3)

The PNA adapter enables integration with AWS S3 storage for performance needs analysis data.

| Variable | Description | Default |
|----------|-------------|---------|
| `PNA_DIRECTORY` | Local directory or S3 prefix for PNA data. | — |
| `PNA_AWS_REGION` | AWS region for the S3 bucket. | — |
| `PNA_AWS_BUCKET` | Name of the S3 bucket. | — |

### Replication Adapter

Replicate data to another CaSS instance for redundancy or federation.

| Variable | Description | Default |
|----------|-------------|---------|
| `CASS_REPLICATION_ENDPOINT` | URL of the target CaSS instance to replicate data to. | — |
| `CASS_REPLICATION_PPK` | Private key (PEM) for authenticating with the replication target. | — |

### Ollama Adapter <Badge text="New in 1.6" type="tip"/>

A proof-of-concept adapter for integrating with [Ollama](https://ollama.ai/) local LLM inference.

::: tip
Disable with `DISABLED_ADAPTERS=ollama` if not in use.
:::

---

## UI Customization

These variables control the appearance and behavior of the CaSS Editor web interface.

### Banner

Display a persistent banner message along the top and bottom of the CaSS Editor.

| Variable | Description | Default |
|----------|-------------|---------|
| `CASS_BANNER_MESSAGE` | Text to display in the banner. Leave unset to hide the banner. | — |
| `CASS_BANNER_TEXT_COLOR` | CSS color for the banner text. | Editor theme default |
| `CASS_BANNER_BACKGROUND_COLOR` | CSS color for the banner background. | Editor theme default |

```yaml
# Example: DoD-style classification banner
environment:
  CASS_BANNER_MESSAGE: "CUI - Controlled Unclassified Information"
  CASS_BANNER_TEXT_COLOR: "#FFFFFF"
  CASS_BANNER_BACKGROUND_COLOR: "#502B85"
```

### Message of the Day

Display a one-time popup dialog when users open the CaSS Editor.

| Variable | Description | Default |
|----------|-------------|---------|
| `MOTD_TITLE` | Title of the popup dialog. | — |
| `MOTD_MESSAGE` | Body text of the popup dialog. | — |

### Editor & Plugins

| Variable | Description | Default |
|----------|-------------|---------|
| `DISABLED_EDITOR` | Set to `true` to disable the built-in CaSS Editor UI. The API remains available. | `false` |
| `DEFAULT_PLUGINS` | JSON array of URLs to plugins for the CaSS Editor. Relative paths are resolved against the CaSS base URL: `["/my-feature"]` → `https://cass.example.org/my-feature`. | — |

---

## Profile Computation

CaSS can compute competency profiles for users. These settings control the performance and caching behavior of profile computation.

| Variable | Description | Default |
|----------|-------------|---------|
| `PROFILE_PPK` | Private key (PEM) for CaSS to use when querying for profile data. | — |
| `PROFILE_CACHE` | Enable in-memory caching of computed profiles. | `false` |
| `PROFILE_REPOSITORY_CACHE` | Cache computed profiles to the repository (Elasticsearch). | `false` |
| `PROFILE_TTL` | Time-to-live for cached profiles, in milliseconds. | `2592000000` (30 days) |
| `WORKER_MAX_MEMORY` | Maximum memory (in MB) allocated to profile computation worker threads. | `1024` |

---

## Logging & Monitoring

### Log Filtering

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_HEADERS` | Log HTTP request headers for debugging. | `false` |
| `LOG_FILTERED_CATEGORIES` | Comma-separated list of log categories to suppress. Values: `sys`, `auth`, `msg`, `fs`, `net`, `stor`, `adap`, `prof`. | — |
| `LOG_FILTERED_SEVERITIES` | Comma-separated list of log severities to suppress. Values: `EMERGENCY`, `ALERT`, `CRITICAL`, `ERROR`, `WARNING`, `NOTICE`, `INFO`, `DEBUG`. | — |
| `LOG_FILTERED_MESSAGES` | Comma-separated list of specific log message strings to suppress. | — |

### Email Alerts (SMTP)

CaSS can send emergency email notifications when critical events occur.

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname. | — |
| `SMTP_PORT` | SMTP server port. | `587` |
| `SMTP_USER` | SMTP authentication username. | — |
| `SMTP_PASS` | SMTP authentication password. | — |
| `SMTP_RECIPIENTS` | Comma-separated list of email addresses to receive alerts. | — |

```yaml
environment:
  SMTP_HOST: "smtp.example.org"
  SMTP_PORT: "587"
  SMTP_USER: "alerts@example.org"
  SMTP_PASS: "smtp-password"
  SMTP_RECIPIENTS: "admin@example.org,ops@example.org"
```

---

## Network & Fetch Control

| Variable | Description | Default |
|----------|-------------|---------|
| `FETCH_ALLOW_LIST` | Comma-separated list of allowed hostnames or URL patterns that CaSS may fetch from. Use to restrict outbound requests in locked-down environments. | — |

::: tip New in v1.6
`FETCH_ALLOW_LIST` is new in v1.6 and is recommended for production deployments to limit which external resources CaSS can retrieve.
:::

---

## Testing & Development

::: danger
These variables are intended for development and testing **only**. Do not use them in production environments.
:::

| Variable | Description | Default |
|----------|-------------|---------|
| `KILL` | Set to the contents of `skyId.secret` to enable the remote kill endpoint for graceful shutdown. | — |
| `AUTH_OVERRIDE` | Set to `true` to bypass all authentication checks. | `false` |
| `AUTH_OVERRIDE_KEY` | When `AUTH_OVERRIDE` is enabled, use this key for all operations. | — |
| `VALIDATE_RESPONSES` | Enable response validation against JSON-LD schemas. Useful for debugging. | `false` |
| `SKYREPO_DEBUG` | Enable verbose Elasticsearch query logging. | `false` |
| `HTTPS_REJECT_UNAUTHORIZED` | Set to `false` to accept self-signed certificates on outbound HTTPS. | `true` |
| `NODEV` | Set to `true` to disable development-mode features. | — |

---

## New in v1.6

This section summarizes major configuration-relevant changes introduced in CaSS v1.6. See the [changelog](https://github.com/cassproject/CASS/releases) for the full release notes.

| Feature | Details |
|---------|---------|
| **Distroless Docker Image** | The default Docker image is now based on a distroless base, reducing the attack surface. No shell is available inside the container. |
| **Container Runs as User 1000** | **Breaking change.** The container no longer runs as root. Ensure volumes are accessible by UID 1000. |
| **Elasticsearch 9.x Support** | CaSS v1.6 is compatible with Elasticsearch 9.x in addition to 7.x and 8.x. |
| **OpenAPI / Swagger** | API documentation is available at `/api/swagger/` on any running CaSS instance. |
| **FIPS Compliance** | Built-in FIPS 140-2 compliant cryptographic operations. |
| **`FETCH_ALLOW_LIST`** | New environment variable to restrict outbound fetch targets. |
| **Reactive Processing (RxJS)** | Internal event processing now uses reactive streams for improved throughput. |
| **Ephemeral Storage with TTL** | Support for time-limited data that is automatically purged after expiration. |
| **Multidelete** | Batch delete API support for removing multiple objects in a single request. |
| **Ollama Adapter (POC)** | Proof-of-concept adapter for local LLM inference via Ollama. Disable with `DISABLED_ADAPTERS=ollama`. |
| **Implies Relation** | Support for the `implies` relation type in competency frameworks. |
| **xAPI Env Var Overrides** | xAPI adapter can now be fully configured through environment variables. |

---

## Complete Environment Variable Reference

The table below lists every environment variable recognized by CaSS v1.6 in alphabetical order.

| Variable | Category | Default |
|----------|----------|---------|
| `AUTH_ALLOW_ENV_ADMINS` | Access Control | `false` |
| `AUTH_ENV_ADMIN_EMAILS` | Access Control | — |
| `AUTH_OVERRIDE` | Testing | `false` |
| `AUTH_OVERRIDE_KEY` | Testing | — |
| `CASS_BANNER_BACKGROUND_COLOR` | UI | Theme default |
| `CASS_BANNER_MESSAGE` | UI | — |
| `CASS_BANNER_TEXT_COLOR` | UI | Theme default |
| `CASS_ELASTIC_KEYSTORE` | Access Control | `false` |
| `CASS_ELASTIC_KEYSTORE_ENDPOINT` | Access Control | — |
| `CASS_EXTERNAL_ENDPOINT` | Core | — |
| `CASS_IP_ALLOW` | Access Control | — |
| `CASS_IP_DENIED_REDIRECT` | Access Control | — |
| `CASS_JWT_ALGORITHM` | Auth | `HS256` |
| `CASS_JWT_ENABLED` | Auth | `false` |
| `CASS_JWT_SECRET` | Auth | `cass` |
| `CASS_LOOPBACK` | Core | `http://localhost/api/` |
| `CASS_LOOPBACK_PROXY` | Core | — |
| `CASS_OIDC_BASE_URL` | Auth | `http://localhost/` |
| `CASS_OIDC_CLIENT_ID` | Auth | `cass` |
| `CASS_OIDC_ENABLED` | Auth | `false` |
| `CASS_OIDC_ISSUER_BASE_URL` | Auth | — |
| `CASS_OIDC_SECRET` | Auth | — |
| `CASS_PLATFORM_ONE_AUTH_ENABLED` | Auth | `false` |
| `CASS_REPLICATION_ENDPOINT` | Adapter | — |
| `CASS_REPLICATION_PPK` | Adapter | — |
| `CLIENT_SIDE_CERTIFICATE_ONLY` | TLS | `false` |
| `CRL_LISTS` | TLS | — |
| `DEFAULT_PLUGINS` | UI | — |
| `DISABLED_ADAPTERS` | Adapter | — |
| `DISABLED_EDITOR` | UI | `false` |
| `ELASTICSEARCH_AUTHORIZATION` | Elasticsearch | — |
| `ELASTICSEARCH_ENDPOINT` | Elasticsearch | `http://localhost:9200` |
| `FETCH_ALLOW_LIST` | Network | — |
| `HTTP2_SERVER` | TLS | `false` |
| `HTTPS` | TLS | `false` |
| `HTTPS_REJECT_UNAUTHORIZED` | Testing | `true` |
| `KILL` | Testing | — |
| `LOG_FILTERED_CATEGORIES` | Logging | — |
| `LOG_FILTERED_MESSAGES` | Logging | — |
| `LOG_FILTERED_SEVERITIES` | Logging | — |
| `LOG_HEADERS` | Logging | `false` |
| `MAX_CONNECTIONS` | Core | — |
| `MOTD_MESSAGE` | UI | — |
| `MOTD_TITLE` | UI | — |
| `NODE_EXTRA_CA_CERTS` | TLS | — |
| `NODEV` | Testing | — |
| `PNA_AWS_BUCKET` | Adapter | — |
| `PNA_AWS_REGION` | Adapter | — |
| `PNA_DIRECTORY` | Adapter | — |
| `PORT` | Core | `80` |
| `PRODUCTION` | Core | `false` |
| `PROFILE_CACHE` | Profile | `false` |
| `PROFILE_PPK` | Profile | — |
| `PROFILE_REPOSITORY_CACHE` | Profile | `false` |
| `PROFILE_TTL` | Profile | `2592000000` |
| `REQUEST_CLIENT_SIDE_CERTIFICATE` | TLS | `false` |
| `SKYREPO_DEBUG` | Testing | `false` |
| `SMTP_HOST` | Logging | — |
| `SMTP_PASS` | Logging | — |
| `SMTP_PORT` | Logging | `587` |
| `SMTP_RECIPIENTS` | Logging | — |
| `SMTP_USER` | Logging | — |
| `VALIDATE_RESPONSES` | Testing | `false` |
| `WORKER_MAX_MEMORY` | Profile | `1024` |
| `XAPI_AUTH` | Adapter | — |
| `XAPI_ENABLED` | Adapter | `false` |
| `XAPI_ENDPOINT` | Adapter | — |
