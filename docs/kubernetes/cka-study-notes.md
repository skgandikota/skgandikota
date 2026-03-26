---
sidebar_position: 1
---

# CKA & CKAD Study Guide

Comprehensive study notes for both the **Certified Kubernetes Administrator (CKA)** and **Certified Kubernetes Application Developer (CKAD)** exams. Each page is tagged with exam relevance so you know what to focus on.

---

## Exam Overview

| | CKA | CKAD |
|---|---|---|
| **Focus** | Cluster administration, setup, maintenance | Application lifecycle, deployment, configuration |
| **Format** | Performance-based (live cluster) | Performance-based (live cluster) |
| **Duration** | 2 hours | 2 hours |
| **Passing Score** | 66% | 66% |
| **Questions** | ~17 tasks | ~16 tasks |
| **Kubernetes Version** | 1.31 (as of 2026) | 1.31 (as of 2026) |
| **Allowed Resources** | kubernetes.io/docs, kubernetes.io/blog, helm.sh/docs | kubernetes.io/docs, kubernetes.io/blog, helm.sh/docs |

---

## CKA Exam Domains

| Domain | Weight |
|--------|--------|
| Cluster Architecture, Installation & Configuration | 25% |
| Workloads & Scheduling | 15% |
| Services & Networking | 20% |
| Storage | 10% |
| Troubleshooting | 30% |

## CKAD Exam Domains

| Domain | Weight |
|--------|--------|
| Application Design and Build | 20% |
| Application Deployment | 20% |
| Application Observability and Maintenance | 15% |
| Application Environment, Configuration and Security | 25% |
| Services & Networking | 20% |

---

## Study Notes — Table of Contents

| # | Topic | CKA | CKAD | Key Concepts |
|---|-------|:---:|:----:|--------------|
| 01 | **Core Concepts** | ✅ | ✅ | Pods, Namespaces, API primitives, kubectl essentials |
| 02 | **Cluster Architecture** | ✅ | — | Control plane, etcd, kubelet, kube-proxy, kubeadm |
| 03 | **Workloads** | ✅ | ✅ | Deployments, ReplicaSets, DaemonSets, StatefulSets, Jobs, CronJobs |
| 04 | **Scheduling** | ✅ | ✅ | nodeSelector, affinity, taints, tolerations, resource limits, static pods |
| 05 | **Configuration** | ✅ | ✅ | ConfigMaps, Secrets, env vars, SecurityContext, ServiceAccounts |
| 06 | **Networking & Services** | ✅ | ✅ | Services, Ingress, NetworkPolicy, DNS, CNI |
| 07 | **Storage** | ✅ | ✅ | Volumes, PV, PVC, StorageClass, CSI |
| 08 | **Security & RBAC** | ✅ | ✅ | Roles, ClusterRoles, Bindings, Pod Security, Certificates |
| 09 | **Cluster Maintenance** | ✅ | — | Upgrades, etcd backup/restore, drain/cordon, OS maintenance |
| 10 | **Troubleshooting** | ✅ | ✅ | Debug pods, nodes, services, networking, cluster components |
| 11 | **Observability** | ✅ | ✅ | Probes, logging, monitoring, resource metrics |
| 12 | **Helm & Kustomize** | ✅ | ✅ | Helm install/upgrade/rollback, Kustomize overlays |
| 13 | **Exam Tips & Speed** | ✅ | ✅ | Aliases, shortcuts, time management, bookmarks |

---

## How to Use These Notes

1. **Read each page in order** — they build on each other
2. **Practice every command** — reading is not enough; type every `kubectl` command in a real cluster
3. **Use killer.sh** — you get 2 free sessions with each exam registration; do them in the final 2 weeks
4. **Bookmark kubernetes.io** — it's the only reference allowed; learn to navigate it fast
5. **Tag focus**: if you're only doing CKA, you can skip CKAD-only sections (but there aren't many — most overlap)
