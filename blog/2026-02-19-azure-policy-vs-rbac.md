---
slug: azure-policy-vs-rbac
title: "Azure Policy vs Azure RBAC: When to Use What"
authors: [saikoushik]
tags: [azure, cloud-security]
---

Two of the most powerful governance tools in Azure, and two of the most confused. I've seen teams use RBAC when they need Policy, and Policy when they need RBAC. Here's the clear distinction.

<!-- truncate -->

## The One-Line Difference

- **RBAC** = WHO can do WHAT (identity → action)
- **Policy** = WHAT can be done, regardless of who (action → rules)

A Contributor role (RBAC) lets you create any VM. A Policy can restrict you to only creating VMs in UK South with specific SKUs and mandatory tags — even if RBAC says you CAN create VMs.

## When to Use RBAC

| Scenario | RBAC Role |
|----------|-----------|
| Dev team needs to deploy to their resource group | Contributor (scoped to RG) |
| Security team needs read access everywhere | Reader (scoped to subscription) |
| Platform team needs to manage all networking | Network Contributor (scoped to networking RG) |
| CI/CD pipeline needs to deploy | Contributor with conditions |

**Rule of thumb**: If the question is "should this person/service be ALLOWED to do this action?" → RBAC.

## When to Use Azure Policy

| Scenario | Policy |
|----------|--------|
| All resources must have a cost-centre tag | Require tag (Deny) |
| VMs can only be created in UK South and UK West | Allowed locations (Deny) |
| Storage accounts must use HTTPS | Enforce HTTPS (Deny) |
| All subnets must have an NSG | Audit NSG association (Audit) |

**Rule of thumb**: If the question is "should this CONFIGURATION be allowed in our environment?" → Policy.

## The Power Combo

The real magic is using them together:

1. **RBAC**: Dev team gets Contributor on their resource group
2. **Policy at subscription level**: No public IPs, mandatory tags, allowed regions only, approved SKUs only
3. **Result**: Teams have freedom to build, but within guardrails

This is the foundation of a landing zone. RBAC gives autonomy. Policy gives governance. Together, they give you **secure self-service**.

## Common Mistakes

- Using custom RBAC roles to restrict resource types → Use Policy instead
- Using Policy to control who can deploy → Use RBAC instead
- Applying policies in "Deny" mode without testing in "Audit" first → Guaranteed production incident
- Creating overly broad RBAC assignments → Principle of least privilege, always

---

*How do you combine RBAC and Policy in your environment? [Share your approach on LinkedIn](https://linkedin.com/in/saikoushikg).*
