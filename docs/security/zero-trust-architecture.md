---
sidebar_position: 1
---

# Zero Trust Architecture — Notes

## Core Principles

1. **Never trust, always verify** — authenticate every request regardless of source
2. **Least privilege access** — grant minimum permissions required
3. **Assume breach** — design systems assuming attackers are already inside

## Zero Trust on Azure — Building Blocks

### Identity
- Entra ID (Azure AD) as the identity plane
- Conditional Access policies (MFA, compliant devices, location)
- Managed Identities for service-to-service (no passwords)
- Privileged Identity Management (PIM) for just-in-time admin access

### Network
- Private Endpoints for all PaaS services
- NSGs as secondary controls
- Azure Firewall for east-west inspection
- No public IPs on VMs

### Data
- Encryption at rest (platform-managed or customer-managed keys)
- Encryption in transit (TLS everywhere)
- Azure Key Vault for secret management
- Data classification and labelling

### Monitoring
- Microsoft Defender for Cloud
- Microsoft Sentinel (SIEM)
- Log Analytics workspace
- Diagnostic settings on all resources

## Implementation Order

1. **Month 1**: Managed identities + private endpoints for new workloads
2. **Month 2**: Conditional access + PIM for admin accounts
3. **Month 3**: Azure Policy enforcement (audit → deny)
4. **Month 4-6**: Retrofit existing workloads, Defender, Sentinel

---

*Notes from implementing Zero Trust patterns in enterprise environments.*
