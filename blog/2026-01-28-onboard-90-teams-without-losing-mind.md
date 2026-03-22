---
slug: onboard-90-teams-without-losing-mind
title: "How to Onboard 90+ Teams Without Losing Your Mind"
authors: [saikoushik]
tags: [platform-engineering, leadership]
---

In my current role, I've helped onboard over 90 engineering teams onto a shared platform. Not 90 developers — 90 TEAMS. Each with their own tech stack, their own expectations, and their own definition of "it should just work."

Here's what I learned about doing this at scale.

<!-- truncate -->

## The Mistake: Treating Every Team as Custom

When we started, each onboarding was bespoke. Platform engineer pairs with the team, understands their needs, configures their environment, walks them through the process. Beautiful. Personal. Completely unscalable.

At team 15, we were drowning. Each onboarding took 2 weeks of platform engineer time. We had 3 platform engineers. The maths didn't work.

## The Fix: Productise the Onboarding

We treated onboarding like a product launch:

### 1. Self-Service Portal
Teams fill out a form: team name, tech stack, compliance tier, resource requirements. Behind the form, Terraform provisions everything: namespace, RBAC, CI/CD pipeline, monitoring dashboards, network policies.

**Time to onboard: 30 minutes instead of 2 weeks.**

### 2. Tiered Support
- **Tier 1 (self-service)**: Documentation, FAQs, recorded walkthroughs
- **Tier 2 (Slack channel)**: Platform team answers questions within 4 hours
- **Tier 3 (dedicated session)**: Only for complex migrations, by appointment

80% of teams never needed Tier 3.

### 3. Opinionated Defaults, Escape Hatches

Every team gets the same base configuration. Same pipeline structure. Same monitoring setup. Same security policies. If they need something custom, there's a process — but the default works for 90% of cases.

### 4. Feedback Loops

After every onboarding, a 3-question survey:
1. How easy was it? (1-5)
2. What was confusing?
3. What would you change?

We tracked the score monthly. Started at 3.2. Ended at 4.4. Every improvement came from team feedback, not our assumptions.

## The Key Insight

Platform engineering at scale is not infrastructure engineering. It's **product management**. Your users are developers. Your product is the platform. Treat it accordingly: measure satisfaction, iterate on feedback, and ruthlessly prioritise the common case.

---

*Scaling a platform team? I've been through the growing pains — [let's talk on LinkedIn](https://linkedin.com/in/saikoushikg).*
