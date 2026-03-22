---
slug: kubernetes-rbac-not-optional
title: "Kubernetes RBAC Is Not Optional — It's Your First Line of Defence"
authors: [saikoushik]
tags: [kubernetes, cloud-security]
---

"We'll add RBAC later."

I've heard this sentence on 4 different projects. "Later" usually means "after the security audit finds it" or "after an incident."

RBAC isn't a nice-to-have. In a shared Kubernetes cluster, it's the difference between teams coexisting safely and one team accidentally deleting another's production workloads.

<!-- truncate -->

## The Default Is Dangerous

Out-of-the-box Kubernetes gives the default service account in every namespace far more permissions than it should have. If you haven't explicitly configured RBAC, your pods can likely:

- List secrets across namespaces
- Create and delete deployments they shouldn't touch
- Access the Kubernetes API with cluster-wide permissions

That's not a hypothetical. I've seen a CI/CD pipeline with cluster-admin because "it was easier to set up."

## The Minimum Viable RBAC

### 1. Namespace Isolation

Every team gets their own namespace. No cross-namespace access by default.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-alpha-access
  namespace: team-alpha
subjects:
  - kind: Group
    name: team-alpha
roleRef:
  kind: ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
```

### 2. Service Account Per Workload

Don't share service accounts. Each workload gets its own with minimum required permissions.

### 3. No Cluster-Admin for Humans

Use `admin` or `edit` roles scoped to namespaces. Reserve `cluster-admin` for automation accounts with audit trails.

### 4. Audit Logging

Enable Kubernetes audit logs. You need to know WHO did WHAT and WHEN. Without this, RBAC is security theatre.

## The Platform Engineering Angle

At scale, you don't manually create RBAC configs for each team. You **template it**. New namespace request → auto-generated RBAC → team gets access to their namespace only. This is what a platform team enables.

## The One Rule

If someone says "just give it cluster-admin for now," push back. Every. Single. Time. The security debt compounds faster than you think.

---

*How do you manage RBAC at scale? [Share your approach on LinkedIn](https://linkedin.com/in/saikoushikg).*
