---
slug: multi-cloud-enterprise-scale
title: "What I Learned Managing Multi-Cloud Infrastructure at Enterprise Scale"
authors: [saikoushik]
tags: [platform-engineering, azure, devops]
---

"We're multi-cloud." In most organisations, this really means "we use AWS for some things and Azure for others, and nobody has a unified view of either."

True multi-cloud at enterprise scale is hard. Here's what I learned doing it — and what I'd do differently.

<!-- truncate -->

## What Multi-Cloud Actually Means at Scale

It's not "we have accounts on multiple clouds." It's:
- Consistent governance across clouds
- Unified identity management
- Cross-cloud networking
- Single-pane observability
- Consistent deployment patterns
- One team that understands ALL of it

That last point is where most orgs fail. You end up with "the AWS team" and "the Azure team" who don't talk to each other, using different tools, different patterns, and different security standards.

## The Hard Lessons

### 1. Terraform Is the Lingua Franca

If you're multi-cloud, Terraform is the only IaC tool that works consistently across providers. Bicep is Azure-only. CloudFormation is AWS-only. Terraform modules can abstract provider differences and give teams a consistent interface.

But abstractions leak. An Azure VNet is not the same as an AWS VPC. Don't pretend they are. Build provider-specific modules with a consistent interface pattern.

### 2. Identity Federation Is Non-Negotiable

One identity provider. Azure AD / Entra ID or Okta — pick one. Federate it to both clouds. If engineers have separate AWS and Azure credentials, you've already lost the security battle.

### 3. Cost Visibility Needs a Third-Party Tool

Azure Cost Management doesn't know about your AWS bill. AWS Cost Explorer doesn't know about Azure. You need a tool like CloudHealth, Apptio, or even a custom dashboard that aggregates both.

### 4. Developers Shouldn't Know Which Cloud They're On

The ultimate platform engineering goal: developers deploy to "the platform." Whether that's AKS or EKS, Azure SQL or RDS — they don't care, and they shouldn't have to. The platform abstracts the cloud.

We're not there yet in most orgs. But it's the north star.

## When Multi-Cloud Is Worth It

- **Regulatory requirements** — data residency in regions only one provider covers
- **Best-of-breed services** — Azure for enterprise integration, AWS for ML services
- **Vendor negotiation leverage** — credible ability to shift workloads
- **M&A** — acquired company uses a different cloud

## When It's Not Worth It

If you're choosing multi-cloud for "avoiding vendor lock-in" without a specific scenario that requires it, the operational complexity will cost more than the theoretical savings.

---

*Is your org truly multi-cloud or just multi-bill? [Tell me honestly on LinkedIn](https://linkedin.com/in/saikoushikg).*
