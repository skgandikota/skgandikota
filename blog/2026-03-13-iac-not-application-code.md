---
slug: iac-not-application-code
title: "Stop Treating Infrastructure as Code Like Application Code"
authors: [saikoushik]
tags: [terraform, iac, devops]
---

"We apply the same engineering practices to our Terraform as we do to our application code."

This sounds responsible. It's also why your infrastructure deployments take 3 weeks to get through code review.

Infrastructure as Code is code, yes. But it's a fundamentally different KIND of code. Treating it identically to application code creates more problems than it solves.

<!-- truncate -->

## Where the Analogy Breaks Down

### Testing Is Different

Application code: unit tests, integration tests, end-to-end tests. Clear, fast feedback loop.

Infrastructure code: `terraform plan` IS your test. You can lint with tflint, validate with OPA/Sentinel, but the real test is the plan output. Trying to build a unit test pyramid for Terraform is over-engineering.

### Code Review Is Different

Application code reviews focus on logic, performance, maintainability.

Infrastructure code reviews should focus on: **Will this break something? Does this comply with policy? Is the blast radius acceptable?** The reviewer needs to read the plan output, not just the HCL diff.

### Branching Strategy Is Different

Feature branches work for applications. For infrastructure, long-lived branches are dangerous — state drift makes merges painful or impossible.

**What works**: Short-lived branches, merge to main quickly, use workspaces or separate state files for isolation — not branches.

## What Actually Matters

1. **Plan before apply. Always.** No exceptions. Automated or manual, someone reads the plan.
2. **State is sacred.** Backup it. Lock it. Never manually edit it unless you absolutely know what you're doing.
3. **Blast radius control.** Split state files so a mistake in networking can't destroy your databases.
4. **Drift detection.** Schedule regular `terraform plan` runs against production. If there's drift, investigate before it compounds.

## The Bottom Line

Infrastructure code deserves engineering rigour. But that rigour should be **infrastructure-appropriate**, not copy-pasted from your application development playbook.

---

*How does your team handle IaC differently from app code? [Let's discuss on LinkedIn](https://linkedin.com/in/saikoushikg).*
