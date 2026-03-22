---
slug: platform-engineering-not-about-kubernetes
title: "Platform Engineering Isn't About Kubernetes — It's About Removing Friction"
authors: [saikoushik]
tags: [platform-engineering, kubernetes, devops]
---

Most teams don't need a "DevOps transformation." They need three things:

1. A working CI/CD pipeline they didn't have to build from scratch
2. An environment they can spin up without filing a ticket
3. Documentation that's actually current

<!-- truncate -->

## The Real Problem

Over the past few years, I've helped onboard 90+ engineering teams onto a shared platform. The biggest win wasn't the technology — Kubernetes, Terraform, or Backstage. It was **removing the 2-week wait for infrastructure.**

Before the platform, a new team joining the organisation had to:
- File an infrastructure request
- Wait for approvals across 2-3 teams
- Get network configs, namespaces, and CI/CD set up manually
- Debug why their deployment wasn't working in the new environment

After? They use a scaffolding template. Pick their stack → auto-provisioned infra → deployed in hours. Same security. Same compliance. Zero waiting.

## What Platform Engineering Actually Is

It's not about running Kubernetes clusters. It's about **making the right thing the easy thing**.

- **Golden paths** over gatekeeping — give teams a paved road, not a gate to pass through
- **Self-service** over ticket queues — infrastructure should be a product, not a request
- **Secure by default** over security reviews — bake compliance into the template, not the approval process

## The Mindset Shift

The hardest part isn't technical. It's convincing an organisation to treat infrastructure as a **product** rather than a **cost centre**. When you start thinking "who are my users and what's their experience?", everything changes.

Platform engineering isn't about Kubernetes. It's about removing friction.

---

*What's the biggest bottleneck your engineering teams face today? I'd love to hear your experience — connect with me on [LinkedIn](https://linkedin.com/in/saikoushikg).*
