---
slug: finops-not-cutting-costs
title: "FinOps Isn't About Cutting Costs — It's About Making Informed Decisions"
authors: [saikoushik]
tags: [azure, finops, devops]
---

When leadership says "we need FinOps," what they usually mean is "our cloud bill is too high — make it smaller."

But FinOps isn't about spending less. It's about spending right. Sometimes that means spending MORE — on reserved instances, on better architecture, on tools that prevent waste at scale.

<!-- truncate -->

## The First Thing I Do on Any FinOps Engagement

**Tag everything.**

Not after. Not "when we have time." Before anything else.

Without consistent tags, you cannot answer the most basic question: "Which team is responsible for this cost?" If you can't answer that, every other FinOps practice is guessing.

Minimum tag set:
- `team` — who owns this
- `environment` — dev/staging/prod
- `project` — what business initiative
- `cost-centre` — who pays

## The Quick Wins (First 30 Days)

### 1. Kill the Zombies
Resources running with no traffic, no connections, no purpose. Every Azure subscription has them. Orphaned disks, unused public IPs, empty App Service plans.

**Typical saving**: 15-25% of the monthly bill.

### 2. Right-Size Compute
That D4s_v3 running at 8% CPU utilisation? It should be a B2ms. Azure Advisor literally tells you this. Most teams ignore it.

**Typical saving**: 10-20% on compute costs.

### 3. Reserved Instances for Steady-State
If a workload has been running 24/7 for 6 months, it's not going away. Buy a 1-year reservation. 

**Typical saving**: 30-40% vs pay-as-you-go.

## The Culture Shift

The real FinOps transformation isn't tooling. It's making cost a first-class engineering metric. Every sprint review should include: "What does this feature cost to run?"

When engineers see the cost of their decisions, behaviour changes naturally. You don't need approval gates — you need visibility.

## The Dashboard That Changed Behaviour

We built a simple dashboard: cost per team per day, with a 7-day trend. Published it in the weekly engineering newsletter. Within 2 months, teams were proactively right-sizing and cleaning up resources — no mandates required.

Sunlight is the best disinfectant. And the best cost optimiser.

---

*How does your org handle cloud cost visibility? [Let's compare notes on LinkedIn](https://linkedin.com/in/saikoushikg).*
