# CaSS Installation

This is the installation guide for a CaSS v1.6 instance. If you're just looking to work with an existing CaSS instance, you may be looking for the CaSS Library. See the [Links](/dev/links-and-references) section for more information.

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Node.js** | 24+ | Latest LTS |
| **Elasticsearch** | 9.x (or OpenSearch) | 9.x |
| **RAM** | 4 GB | 8 GB+ |
| **Disk** | 8 GB | 20 GB+ |

::: tip
CaSS v1.6 includes built-in FIPS compatibility via OpenSSL 3.1.2. No additional configuration is required for FIPS-compliant deployments.
:::

## Docker (Recommended)

Docker is the primary and recommended way to deploy CaSS. Images are published to Docker Hub under [cassproject/cass](https://hub.docker.com/r/cassproject/cass).

### Quick Start

The fastest way to get CaSS running is with Docker Compose. This starts CaSS alongside Elasticsearch with sensible defaults:

```bash
git clone https://github.com/cassproject/CASS.git
cd CASS
docker compose up -d
```

CaSS will be available at `http://localhost` (port 80) and `https://localhost` (port 443).

::: warning
By default, data is stored inside the container. To persist data across container restarts, you **must** configure Docker volumes. The `docker-compose.yml` in the repository includes volume mounts for Elasticsearch data — review it before deploying to production.
:::

### Running a Standalone Container

If you prefer to manage Elasticsearch separately, you can run the CaSS container on its own:

```bash
docker run -d \
  -p 80:80 \
  -p 443:443 \
  -e ELASTICSEARCH_ENDPOINT=http://your-elasticsearch:9200 \
  cassproject/cass
```

### Docker Image Variants

CaSS publishes multiple image variants to suit different deployment needs:

| Image Tag | Base Image | Use Case |
|-----------|-----------|----------|
| `cassproject/cass` | `node:24-slim` (Debian) | Default — broadest compatibility |
| `cassproject/cass:alpine` | `node:24-alpine` | Smaller image size, musl-based |
| `cassproject/cass:distroless` | `gcr.io/distroless/nodejs24` | Minimal attack surface, no shell |
| `cassproject/cass:opensearch` | `node:24-slim` (Debian) | Pre-configured for OpenSearch |

::: tip
The `distroless` variant contains only the Node.js runtime and application code — no shell, package manager, or unnecessary OS utilities. This is ideal for security-hardened production environments.
:::

### Health Check

All Docker images expose a health check endpoint:

```
GET /api/ping
```

A `200 OK` response indicates the service is running and connected to its data store.

## Local Development

For contributors and developers who want to run CaSS from source.

### Prerequisites

- **Node.js 24+** — install via [nvm](https://github.com/nvm-sh/nvm) or [nodejs.org](https://nodejs.org/)
- **Elasticsearch 9.x** — easiest to run via Docker (see below)
- **Git**

### 1. Start Elasticsearch

Use Docker to run a local Elasticsearch instance:

```bash
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:9.0.0
```

### 2. Clone and Install

```bash
git clone https://github.com/cassproject/CASS.git
cd CASS
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

CaSS will start on `http://localhost` by default. The `ELASTICSEARCH_ENDPOINT` environment variable defaults to `http://localhost:9200`.

::: tip
See the [CaSS Configuration](/dev/cass-configuration) page for all available environment variables, including `CASS_LOOPBACK`, `HTTPS`, and authentication settings.
:::

## Kubernetes

CaSS v1.6 includes support for Kubernetes deployments. High-level steps:

1. Choose a CaSS Docker image variant (see [Docker Image Variants](#docker-image-variants) above).
2. Create a `Deployment` and `Service` for CaSS.
3. Deploy Elasticsearch 9.x as a `StatefulSet` or use a managed service (e.g., Elastic Cloud, Amazon OpenSearch).
4. Set the `ELASTICSEARCH_ENDPOINT` environment variable on the CaSS pod to point to your Elasticsearch service.
5. Configure an `Ingress` or `LoadBalancer` for external access.
6. Use the `/api/ping` endpoint for liveness and readiness probes.

Example liveness probe configuration:

```yaml
livenessProbe:
  httpGet:
    path: /api/ping
    port: 80
  initialDelaySeconds: 30
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /api/ping
    port: 80
  initialDelaySeconds: 10
  periodSeconds: 5
```

::: tip
Full Kubernetes manifests and Helm chart examples are available in the [CASS repository](https://github.com/cassproject/CASS).
:::

## Legacy Installation

::: warning
The following installation methods are carried over from CaSS v1.5 and earlier. They are still functional but are **no longer the recommended approach**. Docker or local development (above) are preferred for new deployments.
:::

### Linux (Debian, Ubuntu, Amazon and other Fedora derivatives)

CaSS can be installed on Linux through the Bash install script:

```bash
wget https://raw.githubusercontent.com/cassproject/CASS/master/scripts/cassInstall.sh
chmod +x cassInstall.sh
sudo ./cassInstall.sh
```

### Windows (Chocolatey)

Windows installation uses [Chocolatey](https://chocolatey.org/) as a package manager. Chocolatey will install all required CaSS dependencies.

[CASS Package on Chocolatey](https://chocolatey.org/packages/cass)

#### First-Time Install

From an elevated PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
refreshenv
choco install -y cass
refreshenv
```

Go to services, start `elasticsearch-service-x64` and set it to start automatically.

#### Upgrade

Before upgrading, copy out the `etc` folder from the root directory of the CaSS installation. From an elevated command line:

```powershell
choco install -y cass
```

Then copy the `etc` folder back in.

## Post-Installation Checklist

1. **Verify the health endpoint** — confirm that `GET /api/ping` returns a `200 OK` response.
2. **Verify the API is reachable** — navigate to `http://<your-cass-host>/api/custom/` and confirm a response.
3. **Verify the web interface** — navigate to `http://<your-cass-host>/` and confirm the CaSS Editor loads.
4. **Set your endpoint** — all CaSS objects encode the server endpoint in their permanent locator (`@id`). Ensure `CASS_LOOPBACK` is set correctly before creating production data.
5. **Configure HTTPS** — for production, set up TLS termination via a reverse proxy (e.g., Nginx, Traefik) or set the `HTTPS` environment variable to `true` with appropriate certificates.
6. **Test user login** — create a new user, log in, and verify that the sidebar shows your initials and additional capabilities appear (Assertions, Configuration → Users and Groups).
7. **Test framework CRUD** — create a framework, add a competency, then delete both to verify full read/write functionality.

## Troubleshooting

### Elasticsearch Issues

1. **Is Elasticsearch running?**
   - Run `curl http://localhost:9200` (or open in a browser). You should see a JSON response with the cluster name and version.
   - If using Docker: `docker ps` to confirm the container is running; `docker logs <container>` to check for errors.

2. **Elasticsearch version mismatch**
   - CaSS v1.6 requires Elasticsearch **9.x** or OpenSearch. Older versions (5.x, 6.x, 7.x) are not supported.

### CaSS Server Issues

3. **Does `/api/ping` respond?**
   - If it does not respond, check that the CaSS process is running and that ports 80/443 are not blocked or in use by another service.

4. **API requests hang or time out**
   - This typically indicates CaSS cannot reach Elasticsearch. Verify the `ELASTICSEARCH_ENDPOINT` environment variable is correct and that Elasticsearch is accepting connections.

5. **Port conflicts**
   - CaSS v1.6 binds to ports **80** (HTTP) and **443** (HTTPS) by default. If another service is using these ports, either stop that service or remap CaSS ports (e.g., `-p 8080:80` in Docker).

### Docker Issues

6. **Container exits immediately**
   - Run `docker logs <container>` to inspect the error. Common causes: Elasticsearch not reachable, port already in use, insufficient memory.

7. **Data lost after container restart**
   - Ensure you have configured persistent volumes. See the `docker-compose.yml` in the CASS repository for volume mount examples.

### Browser / Client Issues

8. **Most errors are connectivity related** — use browser Developer Tools (Network tab) to ensure requests are reaching the correct CaSS endpoint.

9. **Cannot create or modify data** — verify that the `CASS_LOOPBACK` environment variable matches the URL you are accessing CaSS from.

10. **Login does not persist or capabilities do not appear** — repeat the login with Developer Tools open and inspect the `login`, `create`, and `commit` requests for errors.
