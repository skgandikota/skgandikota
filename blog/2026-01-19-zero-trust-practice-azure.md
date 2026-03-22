---
slug: zero-trust-practice-azure
title: "Zero Trust in Practice: What It Actually Looks Like on Azure"
authors: [saikoushik]
tags: [azure, cloud-security]
---

"We follow Zero Trust principles."

I hear this in every security architecture review. But when I ask "show me," the reality is usually a VPN, some network segmentation, and hope.

Zero Trust isn't a product you buy. It's an architecture you build. Here's what it actually looks like when implemented on Azure.

<!-- truncate -->

## The Core Principle

**Never trust, always verify.** Every request — regardless of where it comes from — must be authenticated, authorised, and encrypted. No implicit trust based on network location.

## The Building Blocks on Azure

### 1. Identity Is the New Perimeter

Forget network boundaries. Identity is your control plane.

- **Azure AD / Entra ID** as the single identity provider
- **Conditional Access policies**: require MFA, compliant devices, specific locations
- **Managed Identities** for service-to-service communication — no passwords, no keys
- **Privileged Identity Management (PIM)**: just-in-time, time-bound access for admin roles

### 2. Network Segmentation (Still Matters)

Zero Trust doesn't mean "no network security." It means don't RELY on network security alone.

- **Private Endpoints** for all PaaS services — no public endpoints for databases, storage, key vaults
- **NSGs** as a secondary control — defence in depth
- **Azure Firewall** for east-west traffic inspection
- **No public IP addresses** on VMs unless absolutely required (and it rarely is)

### 3. Least Privilege Everywhere

- **RBAC** scoped to the narrowest possible level (resource group, not subscription)
- **JIT VM access** (Azure Security Centre) — SSH/RDP ports closed by default, opened temporarily on request
- **Service principals** with minimum required permissions, no Contributor-on-subscription

### 4. Continuous Verification

- **Azure Policy** enforcing compliance continuously, not just at deployment
- **Microsoft Defender for Cloud** scanning for misconfigurations
- **Log Analytics + Sentinel** for threat detection and response
- **Workbook dashboards** showing real-time compliance posture

## The Implementation Order

Don't try to do everything at once. This order works:

1. **Month 1**: Managed identities + private endpoints for new workloads
2. **Month 2**: Conditional access + PIM for admin accounts
3. **Month 3**: Azure Policy enforcement (audit mode → deny mode)
4. **Month 4-6**: Retrofit existing workloads, enable Defender, set up Sentinel

## The Reality Check

100% Zero Trust is aspirational. Start with your highest-risk workloads. Protect the crown jewels first. Perfect is the enemy of secure.

---

*How far along is your Zero Trust journey? [Let's compare notes on LinkedIn](https://linkedin.com/in/saikoushikg).*
