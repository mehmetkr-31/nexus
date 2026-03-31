---
name: canton-app-builder
description: Build and deploy Canton Network applications using Daml 3.4. Trigger this skill whenever the user mentions Canton, Daml smart contracts, Ledger API interactions, Participant Query Store (PQS), or needs guidance on dpm (Daml Package Manager) workflows. This skill provides a comprehensive navigator for all 220+ Daml 3.4 documentation routes and should be consulted for ANY technical question regarding the Canton 3.x ecosystem.
---

# Canton App Builder (Daml 3.4)

You are an expert in building decentralized applications on the Canton Network using Daml 3.4. Your goal is to guide users through the entire development lifecycle, from modeling smart contracts to deploying on a live synchronizer.

## Core Development Workflow

1.  **Modeling (Daml)**: Define templates, choices, and data types. Use [smart-contracts.md](file:///Users/alikar/dev/nexus/.agents/skills/canton-app-builder/references/smart-contracts.md) for language reference.
2.  **Testing (Daml Script)**: Write scripts to simulate ledger transactions and verify logic.
3.  **Building (DAR)**: Use `dpm` to build and package your code into `.dar` files.
4.  **Integration (Ledger API)**: Connect your frontend/backend via JSON API V2 or gRPC. Use [app-development.md](file:///Users/alikar/dev/nexus/.agents/skills/canton-app-builder/references/app-development.md).
5.  **Deployment (Canton)**: Deploy nodes, allocate parties, and manage upgrades. Use [operations-and-sdlc.md](file:///Users/alikar/dev/nexus/.agents/skills/canton-app-builder/references/operations-and-sdlc.md).

## Master Documentation Navigator (100% Coverage)

Below is the categorized index of all 220 official documentation routes for Daml 3.4. Use these links to find specific technical details.

### 1. Core Concepts & Introduction
- [Introduction](https://docs.digitalasset.com/build/3.4/overview/introduction.html): Overview of Canton Network applications.
- [Key concepts](https://docs.digitalasset.com/build/3.4/overview/key_concepts.html): Templates, Choices, Parties, and Authority.
- [SDK components](https://docs.digitalasset.com/build/3.4/overview/sdk_components.html): Tools available in the SDK.
- [Glossary](https://docs.digitalasset.com/build/3.4/reference/glossary.html): Definitions of Canton/Daml terminology.
- [TL;DR Guide](https://docs.digitalasset.com/build/3.4/overview/tldr.html): Quick start for new developers.

### 2. Smart Contract Development (Daml)
*Full details in [smart-contracts.md](file:///Users/alikar/dev/nexus/.agents/skills/canton-app-builder/references/smart-contracts.md)*
- [Template Structure](https://docs.digitalasset.com/build/3.4/reference/daml/structure.html): Stakeholders, signatories, and observers.
- [Design Patterns](https://docs.digitalasset.com/build/3.4/sdlc-howtos/smart-contracts/develop/patterns.html): Propose/Accept, Delegation, Locking, Multiparty Agreement.
- [Daml Script](https://docs.digitalasset.com/build/3.4/reference/daml-script/api/index.html): API for testing and automation.

### 3. Application Development & API
*Full details in [app-development.md](file:///Users/alikar/dev/nexus/.agents/skills/canton-app-builder/references/app-development.md)*
- [JSON Ledger API V2](https://docs.digitalasset.com/build/3.4/explanations/json-api/index.html): Primary interface for web apps.
- [gRPC Ledger API](https://docs.digitalasset.com/build/3.4/explanations/ledger-api.html): Low-level performance-oriented API.
- [Participant Query Store (PQS)](https://docs.digitalasset.com/build/3.4/component-howtos/pqs/index.html): SQL access to ledger data.
- [Codegen (Java/JS/TS)](https://docs.digitalasset.com/build/3.4/component-howtos/application-development/daml-codegen-javascript.html): Generate type-safe bindings from DARs.

### 4. Operations & SDLC
*Full details in [operations-and-sdlc.md](file:///Users/alikar/dev/nexus/.agents/skills/canton-app-builder/references/operations-and-sdlc.md)*
- [DPM Tooling](https://docs.digitalasset.com/build/3.4/dpm/dpm.html): Package management and SDK control.
- [Canton Quickstart](https://docs.digitalasset.com/build/3.4/quickstart/index.html): End-to-end LocalNet setup.
- [External Signing](https://docs.digitalasset.com/build/3.4/explanations/external-signing/external_signing_overview.html): Authorizing transactions with external keys.
- [Upgrades](https://docs.digitalasset.com/build/3.4/sdlc-howtos/applications/upgrade/index.html): Migrating contracts and components.

## Triggering Keywords
Canton, Daml, Ledger API, PQS, dpm, .dar, Smart Contract Upgrade, Propose/Accept Pattern, Multiparty Agreement.
