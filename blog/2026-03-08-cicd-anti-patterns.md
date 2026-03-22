---
slug: cicd-anti-patterns
title: "The 3 CI/CD Anti-Patterns I See in Every Organisation"
authors: [saikoushik]
tags: [devops, ci-cd, platform-engineering]
---

I've helped build or fix CI/CD pipelines at 4 organisations across retail, insurance, and financial services. The technology changes — Jenkins, Azure DevOps, GitHub Actions — but the anti-patterns are always the same.

<!-- truncate -->

## Anti-Pattern 1: The 45-Minute Pipeline

The pipeline does EVERYTHING: lint, test, build, scan, package, deploy to dev, run integration tests, deploy to staging, run smoke tests, wait for approval, deploy to prod.

One pipeline. One run. 45 minutes if nothing fails.

**The fix**: Split it. Build pipeline and deploy pipeline are separate. Build once, promote the artifact. Each stage should be independently re-runnable. If the smoke tests fail in staging, you shouldn't need to rebuild from scratch.

## Anti-Pattern 2: Secrets in the Pipeline Definition

Environment variables with database passwords. AWS keys stored as pipeline variables. "Temporary" credentials that have been there for 2 years.

**The fix**: External secret management. Azure Key Vault, HashiCorp Vault, AWS Secrets Manager — pick one. The pipeline FETCHES secrets at runtime. No secrets in YAML files. No secrets in environment variables. Ever.

## Anti-Pattern 3: The Snowflake Pipeline

Team A uses a completely custom pipeline they built from scratch. Team B copied it and modified it. Team C built something entirely different. Now you have 15 pipelines, all slightly broken in different ways.

**The fix**: Pipeline templates. A shared library of reusable pipeline stages maintained by the platform team. Teams compose from templates, don't build from scratch.

```yaml
# Instead of 200 lines of custom YAML
stages:
  - template: templates/build-dotnet.yml
  - template: templates/scan-container.yml
  - template: templates/deploy-aks.yml
    parameters:
      environment: production
```

## The Meta-Pattern

All three anti-patterns share a root cause: **no one owns the CI/CD experience**. When pipelines are each team's problem, every team solves it differently and usually incompletely.

A platform team that owns pipeline templates, enforces security standards, and optimises build times will save more engineering hours than almost any other investment.

---

*Which CI/CD anti-pattern is most painful in your org? [Let me know on LinkedIn](https://linkedin.com/in/saikoushikg).*
