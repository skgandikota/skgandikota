---
slug: every-platform-team-needs-service-catalogue
title: "Why Every Platform Team Needs a Service Catalogue"
authors: [saikoushik]
tags: [platform-engineering, devops]
---

"Who owns this service?"

If answering that question requires Slack messages, tribal knowledge, or archaeology through Git blame — you need a service catalogue.

<!-- truncate -->

## The Problem at Scale

At 10 services, everyone knows who owns what. At 50, it gets fuzzy. At 200+, it's chaos.

Questions that should take 5 seconds:
- Who owns the payment-api?
- What does the inventory-service depend on?
- When was the last deployment to auth-service?
- Is this service compliant with our security policies?

Without a catalogue, each answer requires a Slack thread, a meeting, or guessing.

## What Goes in a Service Catalogue

At minimum:

| Field | Example |
|-------|---------|
| Service name | payment-api |
| Owner (team) | Payments Squad |
| Tech stack | Node.js, PostgreSQL |
| Repository | github.com/org/payment-api |
| Runbook | confluence.org/payment-api-runbook |
| Dependencies | auth-service, inventory-service |
| SLA/SLO | 99.9% availability, P95 < 500ms |
| Last deploy | 2026-03-15 14:32 |
| Security tier | Tier 1 (PCI) |

## Tools That Work

- **Backstage** (Spotify) — the most popular. Extensible. Plugin ecosystem. Steep initial setup but worth it at scale.
- **Port** — SaaS alternative. Faster to set up. Less customisable.
- **OpsLevel** — Good for maturity scoring.
- **Custom** — A Git repo with YAML files per service. Surprisingly effective for smaller orgs.

## The Backstage Approach

We implemented Backstage with a simple rule: **every new service must have a `catalog-info.yaml` in its root**. No file, no deployment pipeline.

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payment-api
  description: Handles payment processing
  annotations:
    github.com/project-slug: org/payment-api
spec:
  type: service
  lifecycle: production
  owner: payments-squad
  dependsOn:
    - component:auth-service
    - resource:payments-db
```

Within 3 months, we had 100% coverage. Not because teams loved filling in YAML — because they couldn't deploy without it.

## The Real Value

A service catalogue isn't about documentation. It's about **making the invisible visible**. During incidents, it turns "who owns this?" from a 20-minute Slack hunt into a 5-second lookup. That speed saves real money and real stress.

---

*Does your org have a service catalogue? What tool did you pick? [Let me know on LinkedIn](https://linkedin.com/in/saikoushikg).*
