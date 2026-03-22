---
slug: gitops-wont-save-you
title: "GitOps Won't Save You If Your Git Hygiene Is Broken"
authors: [saikoushik]
tags: [devops, kubernetes, ci-cd]
---

GitOps is elegant in theory: Git is the single source of truth, every change is auditable, infrastructure converges to the desired state automatically.

In practice? If your Git hygiene is broken, GitOps just automates the chaos faster.

<!-- truncate -->

## The Promise vs Reality

**Promise**: "We do GitOps — everything is version-controlled and auditable."

**Reality**: 47 open branches, merge conflicts in every PR, YAML files nobody understands, and a Flux/ArgoCD that's perpetually out of sync with manual hotfixes applied directly to the cluster.

## The 5 Git Hygiene Rules for GitOps

### 1. Branch Protection Is Non-Negotiable

Main branch requires PR reviews. No direct pushes. No force pushes. If your GitOps controller watches main, a broken push means a broken cluster.

### 2. Small, Focused Commits

One change per commit. "Updated deployment, service, configmap, ingress, and added new namespace" is not one change — it's five. When something breaks, you need to know which change caused it.

### 3. YAML Linting in CI

If malformed YAML reaches your main branch, your GitOps controller will fail silently or apply partial changes. Lint YAML in CI. Validate Kubernetes manifests with `kubeval` or `kubeconform`. Catch errors before they reach the cluster.

### 4. Meaningful Directory Structure

```
clusters/
├── production/
│   ├── namespaces/
│   ├── workloads/
│   └── policies/
├── staging/
│   └── ...
└── base/
    └── ... (shared resources)
```

Not: `k8s/stuff/`, `manifests/`, `deploy/`, `yaml-files/`

### 5. Drift Detection Alerts

If someone `kubectl apply`s directly to the cluster (and they will), your GitOps tool should detect the drift and alert. Configure ArgoCD or Flux to report on resources that don't match the Git state.

## The Uncomfortable Truth

GitOps is a workflow, not a tool. Installing ArgoCD doesn't give you GitOps any more than installing Jira gives you Agile. The discipline has to come first.

---

*What's your biggest GitOps challenge? [Let's troubleshoot together on LinkedIn](https://linkedin.com/in/saikoushikg).*
