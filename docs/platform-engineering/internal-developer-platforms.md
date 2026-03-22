---
sidebar_position: 1
---

# Internal Developer Platforms — Notes

## What Is an IDP?

An Internal Developer Platform is a self-service layer that abstracts infrastructure complexity from developers. It provides golden paths, templates, and automation so teams can deploy without filing tickets.

## Core Components

| Component | Purpose | Tools |
|-----------|---------|-------|
| Service Catalogue | Discover and understand services | Backstage, Port, OpsLevel |
| Scaffolding | Create new services from templates | Backstage Software Templates, Cookiecutter |
| Infrastructure Provisioning | Self-service infra | Terraform + automation, Crossplane |
| CI/CD | Build and deploy | GitHub Actions, Azure DevOps, ArgoCD |
| Observability | Monitor health | Prometheus, Grafana, New Relic, Datadog |
| Documentation | Single source of truth | Backstage TechDocs, mkdocs |

## Team Topologies & Platform Teams

- **Stream-aligned teams** = product/feature teams (consumers of the platform)
- **Platform team** = provides the IDP (internal product team)
- **Enabling team** = helps stream-aligned teams adopt the platform
- **Complicated subsystem team** = deep expertise (e.g., ML, data)

### Key Principle
> Treat the platform as a product. Developers are your users. Measure satisfaction.

## Metrics That Matter

- Time from code-complete to production
- Developer onboarding time (first commit)
- Self-service adoption rate
- Platform team support ticket volume (should decrease over time)
- Developer satisfaction score (quarterly survey)

---

*Expanding as I learn from Team Topologies, Platform Engineering on Kubernetes, and real-world experience.*
