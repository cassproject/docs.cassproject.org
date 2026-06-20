# Developer Overview

The **Competency and Skills System (CaSS)** is an open-source platform for managing, tracking, and exchanging competency and skills data using [Open Linked Data](https://www.w3.org/standards/semanticweb/data). CaSS gives organizations a standards-based backbone for competency frameworks, learner assertions, crosswalks, and analytics — while keeping sensitive records private through client-side encryption and key-based access control.

This page provides a bird's-eye view of the system for developers who want to integrate with, extend, or self-host CaSS.

## Architecture

CaSS is composed of four major subsystems that can be deployed and scaled independently.

- **CaSS Server** — A Node.js 24 / Express 5 REST API backed by Elasticsearch 9.x. The server stores, indexes, and serves JSON-LD objects, enforces key-based access control (KBAC), and hosts pluggable protocol adapters.
- **CaSS Library** — A JavaScript SDK distributed as the [`cassproject`](https://www.npmjs.com/package/cassproject) npm package (v5.0.x). The library provides data-model classes, RSA/AES cryptographic identity, assertion processing, and interoperability helpers for both browser and Node.js environments.
- **CaSS Editor** — A Vue 3 single-page application for framework authoring, competency crosswalks, bulk import/export, and user management. The editor communicates with the server exclusively through the CaSS Library.
- **Protocol Adapters** — Pluggable cartridges that expose or consume external standards. Built-in adapters include CTDL-ASN, IMS CASE, ASN, Open Badges, xAPI, PNA, Ollama, MCP, JSON-LD, Replication, and SCD.

::: tip
Each subsystem lives in its own repository under [github.com/cassproject](https://github.com/cassproject). You can run the full stack with a single `docker compose up`, or deploy components individually.
:::

## Technology Stack

| Component | Technology |
|---|---|
| Server Runtime | Node.js 24 |
| Web Framework | Express 5 |
| Database | Elasticsearch 9.x |
| Client Library | `cassproject` 5.0.x (npm) |
| Editor Frontend | Vue 3 + Pinia + Vite 7 |
| Event Processing | RxJS 7.8 |
| Transport | HTTP/1.1, HTTP/2, WebSocket |
| Security | RSA / AES (KBAC), OIDC, JWT, mTLS, FIPS 140-3 |
| Container | Docker (Debian, Alpine, Distroless) |
| Orchestration | Kubernetes, Docker Compose |

## Data Model

All CaSS objects are [JSON-LD](https://json-ld.org/) documents. Every object carries a standard set of metadata fields:

| Field | Purpose |
|---|---|
| `@id` | Globally unique URL identifier |
| `@type` | JSON-LD type (e.g. `Framework`, `Competency`) |
| `@context` | Schema context URL |
| `@owner[]` | Public keys of entities allowed to write |
| `@reader[]` | Public keys of entities allowed to decrypt |
| `@signature[]` | RSA signatures proving provenance |
| `@version` | Monotonically increasing version counter |

### Key Types

- **Framework** — A collection of competencies with metadata such as name, description, source, and date created.
- **Competency** — An individual knowledge, skill, or ability described with a name, description, and optional coded notation.
- **Relation** — A typed link between two competencies. Supported relation types include `narrows`, `requires`, `desires`, `isEnabledBy`, `isRelatedTo`, `isEquivalentTo`, and `implies`.
- **Assertion** — An encrypted claim about a person's competency level, always encrypted before leaving the browser.
- **Level** — A named performance level within a framework (e.g. *Beginner*, *Intermediate*, *Expert*).
- **Directory** — A curated collection of frameworks.
- **Person** — A user identity, referenced by public key.
- **ConceptScheme / Concept** — Taxonomy and vocabulary structures used alongside frameworks.

::: tip
The full CaSS schema reference is published at [schema.cassproject.org](http://schema.cassproject.org/).
:::

## Security Model

CaSS implements a **No-Knowledge** security architecture: the server never has access to unencrypted private data or user credentials.

### Key-Based Access Control (KBAC)

Every authenticated request carries a **Signature Sheet** — a signed, timestamped token generated from the user's RSA key pair. The server verifies the signature without ever seeing the private key.

- **`@owner`** — Public keys of entities permitted to modify or delete the object.
- **`@reader`** — Public keys of entities permitted to decrypt the object. If empty, the object is public.
- **`@signature`** — One or more RSA signatures proving the object has not been tampered with.

### Client-Side Encryption

Assertions and other sensitive objects are encrypted in the browser (or Node.js client) using AES before transmission. Only holders of the corresponding private key can decrypt the data.

### FIPS 140-3 Compliance

CaSS defaults to SHA-256 for hashing and supports the OpenSSL FIPS provider module for deployments that require FIPS 140-3 validated cryptography.

### External Identity Providers

In addition to built-in key management, CaSS supports federated login through **OpenID Connect (OIDC)** and **JWT** bearer tokens, with optional **mTLS** for service-to-service communication.

::: warning
The built-in username/password identity store is intended for development and testing. Production deployments should integrate an external identity provider.
:::

## API Overview

The CaSS Server exposes several interfaces for interacting with competency data.

### REST API

The primary interface is a RESTful JSON-LD API rooted at `/api/`. Standard HTTP verbs map to CRUD operations:

```text
GET    /api/data/{id}          — Read an object
POST   /api/data/{id}          — Create or update an object
DELETE /api/data/{id}          — Delete an object
GET    /api/data?q={query}     — Search (Elasticsearch Simple Query String)
```

### Interactive Documentation

Swagger / OpenAPI documentation is available at `/api/swagger/` on any running CaSS server.

### WebSocket

A WebSocket endpoint provides real-time push notifications for object changes, enabling live-updating dashboards and collaborative editing.

### MCP Endpoint

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) endpoint at `/api/mcp` allows AI agents and large language models to query and manipulate CaSS data programmatically.

### Health Check

A lightweight health probe is available for container orchestrators:

```text
GET /api/ping    — Returns 200 OK when the server is ready
```

## Getting Started

Ready to dive in? The following pages walk through setup and first steps:

- **[Installation](../cass-installation/)** — Run CaSS locally with Docker, npm, or from source.
- **[Configuration](../cass-configuration/)** — Environment variables, Elasticsearch tuning, TLS, and OIDC setup.
- **[Hello World](../cass-library-hello-world/)** — Create your first framework and competency with the CaSS Library in JavaScript, Node.js, Java, C#, or PHP.
- **[Design Principles](../design-principles/)** — Understand the architectural philosophy behind CaSS.
- **[Fundamentals](../fundamentals/)** — Deep dives into CaSS objects, the repository API, identity, and assertion processing.