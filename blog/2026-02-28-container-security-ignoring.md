---
slug: container-security-ignoring
title: "Container Security: The 5 Things You're Probably Ignoring"
authors: [saikoushik]
tags: [kubernetes, cloud-security, containers]
---

Your containers are running. Your app is working. Your security posture? Probably has gaps you don't know about.

After securing containerised workloads across multiple enterprise environments, here are the 5 things I find teams consistently overlooking.

<!-- truncate -->

## 1. Base Image Vulnerability Scanning

You're probably using `node:18` or `python:3.11` as your base image. Do you know how many CVEs are in those images right now? Usually dozens.

**Fix**: Use distroless or Alpine-based images. Scan every build with Trivy, Snyk, or Microsoft Defender for Containers. Block deployment if critical CVEs are found. Automate this in your pipeline — not as a weekly report nobody reads.

## 2. Running as Root

The default for most containers: root. The default for production: absolutely not root.

**Fix**: Add these two lines to every Dockerfile:
```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```
Then enforce it cluster-wide with a Pod Security Standard.

## 3. No Resource Limits

A container without CPU and memory limits can consume an entire node. One runaway process and every other workload on that node degrades.

**Fix**: Set `requests` AND `limits` for every container. Use LimitRange objects to enforce defaults at the namespace level.

## 4. Secrets Mounted as Environment Variables

Environment variables are readable by anyone who can exec into the pod. They show up in logs, crash dumps, and process listings.

**Fix**: Mount secrets as files, not environment variables. Better yet, use a secrets operator (like External Secrets Operator) that fetches from Vault or Key Vault at runtime.

## 5. No Network Policies

By default, every pod can talk to every other pod. No segmentation. A compromised container has full network access to your entire cluster.

**Fix**: Apply a default-deny NetworkPolicy to every namespace, then explicitly allow required traffic. This alone would prevent a significant percentage of lateral movement attacks.

## The Pattern

All 5 of these share one thing: they're easy to skip when you're "just getting it working." But production security isn't about making it work — it's about making it safe. And the gap between those two is where incidents happen.

---

*Which of these is most commonly missed in your experience? [Let me know on LinkedIn](https://linkedin.com/in/saikoushikg).*
