---
slug: configuration-drift-silent-killer
title: "The Silent Killer of DevOps: Configuration Drift"
authors: [saikoushik]
tags: [devops, terraform, sre]
---

Your infrastructure was deployed with Terraform. It's version-controlled. It's reviewed. It's compliant.

Then someone SSH'd into a server and changed a config file. Someone used the Azure portal to add a firewall rule. Someone ran `kubectl edit` to patch a deployment in production.

Now your Terraform state says one thing. Reality says another. That gap is configuration drift — and it's the silent killer of reliable infrastructure.

<!-- truncate -->

## Why Drift Happens

Despite best intentions, drift is inevitable. Common causes:

1. **Emergency fixes** — "The site is down, just change it in the portal, we'll update Terraform later" (they never do)
2. **Knowledge gaps** — New team member doesn't know the Terraform workflow, uses the CLI directly
3. **Automation gaps** — Some resources aren't in Terraform yet ("we'll add it later")
4. **Third-party changes** — Cloud provider updates defaults, managed services change configurations

## Why It's Dangerous

Small drifts compound. Individual changes seem harmless.

- A manually added firewall rule that allows traffic from an unexpected source
- A resource with different tags, invisible to cost reporting
- A server with a different OS patch level, vulnerable to a known CVE

Then one day, `terraform plan` shows 47 changes you didn't expect, and nobody knows which ones are intentional.

## How to Fight It

### 1. Detect It
Schedule `terraform plan` daily against production. If the plan shows changes, investigate immediately. Tools like Spacelift, Env0, or even a simple cron job + Slack notification work.

### 2. Prevent It
- Lock down portal access for production (read-only for most users)
- Use Azure Policy to deny certain manual operations
- Kubernetes: use GitOps (ArgoCD/Flux) with auto-sync and drift detection
- Educate teams: if it's not in Terraform, it doesn't exist

### 3. Reconcile It
When drift is detected, you have two choices:
- **Reset to code**: `terraform apply` to force reality to match state
- **Import to code**: If the manual change is correct, `terraform import` and update the config

Never ignore drift. Never "fix it later." The longer it sits, the harder it is to resolve.

## The Culture Fix

Make "no manual changes to production" a team norm, not a policy. Celebrate when someone catches drift. Make the feedback loop fast: detect → alert → fix within hours, not weeks.

---

*How do you handle configuration drift in your org? [Let's compare strategies on LinkedIn](https://linkedin.com/in/saikoushikg).*
