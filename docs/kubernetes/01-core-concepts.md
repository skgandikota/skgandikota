---
sidebar_position: 2
title: "01 · Core Concepts"
---

# Core Concepts

> **Exam relevance**: CKA ✅ | CKAD ✅ — This is foundational for everything else.

---

## What is Kubernetes?

Kubernetes is a **container orchestration platform**. It takes your containers and decides:
- **Where** to run them (which node)
- **How many** to run (scaling)
- **What happens** when they fail (self-healing)
- **How** they communicate (networking)
- **How** they access data (storage)

You describe your **desired state** in YAML. Kubernetes continuously works to make the **actual state** match the desired state. This is called the **reconciliation loop**.

---

## The Kubernetes API — Everything is a Resource

Every object in Kubernetes is an **API resource**. When you run `kubectl create deployment myapp`, you are making an HTTP POST to the Kubernetes API server with a JSON/YAML payload.

Every resource has:
```yaml
apiVersion: apps/v1        # Which API group and version
kind: Deployment            # What type of resource
metadata:                   # Name, namespace, labels, annotations
  name: myapp
  namespace: default
  labels:
    app: myapp
spec:                       # The desired state YOU define
  replicas: 3
  ...
status:                     # The actual state KUBERNETES reports (read-only)
  availableReplicas: 3
  ...
```

### API Groups

| API Group | Resources | apiVersion |
|-----------|-----------|------------|
| Core (legacy) | Pod, Service, ConfigMap, Secret, Namespace, Node, PersistentVolume | `v1` |
| apps | Deployment, ReplicaSet, DaemonSet, StatefulSet | `apps/v1` |
| batch | Job, CronJob | `batch/v1` |
| networking.k8s.io | NetworkPolicy, Ingress, IngressClass | `networking.k8s.io/v1` |
| rbac.authorization.k8s.io | Role, ClusterRole, RoleBinding, ClusterRoleBinding | `rbac.authorization.k8s.io/v1` |
| storage.k8s.io | StorageClass, CSIDriver | `storage.k8s.io/v1` |

**Exam tip**: If you forget the apiVersion, use:
```bash
kubectl api-resources | grep -i deployment
```

---

## Pods — The Smallest Deployable Unit

A **Pod** is one or more containers that share:
- The same **network namespace** (same IP address, can talk via `localhost`)
- The same **storage volumes** (can share files)
- The same **lifecycle** (created and destroyed together)

### Why Pods and Not Just Containers?

Because some containers need to work as a unit. Example:
- Main app container serves HTTP traffic
- Sidecar container collects logs and ships them to Elasticsearch
- Both need access to the same log files → same volume
- Both need to communicate cheaply → localhost

### Pod YAML — Understand Every Field

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
  namespace: default
  labels:                    # Key-value pairs for selection/grouping
    app: myapp
    tier: frontend
  annotations:               # Metadata, not used for selection
    description: "My application pod"
spec:
  containers:
  - name: app                # Container name (unique within pod)
    image: nginx:1.25        # Container image
    ports:
    - containerPort: 80      # Informational — does NOT open the port
    env:                     # Environment variables
    - name: ENV
      value: "production"
    resources:               # Resource requests and limits
      requests:
        cpu: "100m"          # Minimum CPU guaranteed
        memory: "128Mi"      # Minimum memory guaranteed
      limits:
        cpu: "500m"          # Maximum CPU allowed
        memory: "256Mi"      # Maximum memory — OOMKilled if exceeded
    volumeMounts:            # Where to mount volumes inside container
    - name: data
      mountPath: /app/data
  volumes:                   # Volume definitions (pod level)
  - name: data
    emptyDir: {}             # Temp storage, deleted when pod dies
  restartPolicy: Always      # Always | OnFailure | Never
```

### Pod Lifecycle Phases

| Phase | Meaning |
|-------|---------|
| `Pending` | Pod accepted but not yet scheduled or images pulling |
| `Running` | At least one container is running |
| `Succeeded` | All containers terminated successfully (exit code 0) |
| `Failed` | All containers terminated, at least one failed |
| `Unknown` | Node communication lost |

### Multi-Container Pod Patterns

These appear frequently in CKAD:

**Sidecar**: Helper container that enhances the main container
```yaml
spec:
  containers:
  - name: app
    image: myapp:v1
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
  - name: log-shipper           # Sidecar: ships logs to external system
    image: fluentd:latest
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
  volumes:
  - name: logs
    emptyDir: {}
```

**Init Container**: Runs to completion BEFORE the main containers start
```yaml
spec:
  initContainers:               # Runs first, must succeed
  - name: wait-for-db
    image: busybox
    command: ['sh', '-c', 'until nc -z db-service 5432; do sleep 2; done']
  containers:
  - name: app
    image: myapp:v1
```

**Ambassador**: Proxy container that handles external communication
```yaml
spec:
  containers:
  - name: app
    image: myapp:v1              # App talks to localhost:6379
  - name: redis-proxy
    image: redis-ambassador       # Proxy routes to actual Redis cluster
    ports:
    - containerPort: 6379
```

**Adapter**: Transforms output of the main container
```yaml
spec:
  containers:
  - name: app
    image: myapp:v1              # Outputs logs in custom format
    volumeMounts:
    - name: logs
      mountPath: /var/log
  - name: log-adapter
    image: log-transformer        # Converts to standard format
    volumeMounts:
    - name: logs
      mountPath: /var/log
```

---

## Namespaces — Virtual Clusters

Namespaces partition a cluster into logical groups. They provide:
- **Scope** for resource names (two pods can have the same name in different namespaces)
- **Resource quotas** (limit CPU/memory per namespace)
- **RBAC boundaries** (grant access per namespace)
- **Network policy boundaries**

### Default Namespaces

| Namespace | Purpose |
|-----------|---------|
| `default` | Where resources go if you don't specify a namespace |
| `kube-system` | Kubernetes system components (API server, scheduler, coredns, etc.) |
| `kube-public` | Publicly accessible data (rarely used) |
| `kube-node-lease` | Node heartbeat leases (health checking) |

### Working with Namespaces

```bash
# Create namespace
kubectl create namespace dev

# List all namespaces
kubectl get namespaces

# Get pods in a specific namespace
kubectl get pods -n kube-system

# Get pods in ALL namespaces
kubectl get pods -A

# Set default namespace for current context (EXAM CRITICAL)
kubectl config set-context --current --namespace=dev

# Check which namespace you're in
kubectl config view --minify | grep namespace
```

**Exam critical**: At the start of EVERY question, check which namespace you should be working in. Many people lose marks by creating resources in the wrong namespace.

### Cross-Namespace Communication

Services can be reached across namespaces using their **FQDN**:
```
<service-name>.<namespace>.svc.cluster.local
```

Example: A service `db-service` in namespace `database` is reachable at:
```
db-service.database.svc.cluster.local
```

---

## Labels and Selectors — How Kubernetes Connects Things

Labels are key-value pairs attached to resources. Selectors find resources by their labels. This is how Kubernetes **links objects together**.

```
Deployment (selector: app=myapp) → ReplicaSet (selector: app=myapp) → Pods (label: app=myapp)
Service (selector: app=myapp) → Pods (label: app=myapp)
```

### Setting Labels

```bash
# Add label
kubectl label pod myapp tier=frontend

# Overwrite existing label
kubectl label pod myapp tier=backend --overwrite

# Remove label
kubectl label pod myapp tier-

# Show labels
kubectl get pods --show-labels
```

### Selecting by Labels

```bash
# Equality-based
kubectl get pods -l app=myapp
kubectl get pods -l app=myapp,tier=frontend

# Set-based
kubectl get pods -l 'app in (myapp, yourapp)'
kubectl get pods -l 'tier notin (backend)'
kubectl get pods -l 'app'            # Has the label
kubectl get pods -l '!app'           # Does NOT have the label
```

### In YAML (matchLabels and matchExpressions)

```yaml
# Simple selector (used in Services)
selector:
  app: myapp

# matchLabels (used in Deployments, ReplicaSets)
selector:
  matchLabels:
    app: myapp

# matchExpressions (more powerful)
selector:
  matchExpressions:
  - key: tier
    operator: In         # In, NotIn, Exists, DoesNotExist
    values:
    - frontend
    - backend
```

---

## Annotations

Annotations are key-value pairs for **metadata that is NOT used for selection**. They store arbitrary data for tools, humans, or other systems.

```yaml
metadata:
  annotations:
    kubernetes.io/change-cause: "Updated to v2.1"
    prometheus.io/scrape: "true"
    prometheus.io/port: "9090"
```

Common uses:
- Recording deployment change causes (for rollback history)
- Configuring Ingress controllers
- Prometheus scrape configuration
- Build/version information

---

## Essential kubectl Commands

These commands must be **muscle memory** for the exam:

### Create Resources Fast

```bash
# Pod
kubectl run nginx --image=nginx

# Pod with specific restart policy
kubectl run nginx --image=nginx --restart=Never

# Generate YAML without creating (THE most used pattern in exams)
kubectl run nginx --image=nginx --dry-run=client -o yaml > pod.yaml

# Deployment
kubectl create deployment myapp --image=nginx --replicas=3

# Service (expose existing deployment)
kubectl expose deployment myapp --port=80 --target-port=8080 --type=NodePort

# Job
kubectl create job my-job --image=busybox -- echo "hello"

# CronJob
kubectl create cronjob my-cron --image=busybox --schedule="*/5 * * * *" -- echo "hello"

# ConfigMap
kubectl create configmap myconfig --from-literal=key1=value1 --from-literal=key2=value2

# Secret
kubectl create secret generic mysecret --from-literal=password=s3cret

# Namespace
kubectl create namespace dev

# ServiceAccount
kubectl create serviceaccount mysa
```

### View & Inspect

```bash
# List resources
kubectl get pods
kubectl get pods -o wide              # Show node, IP
kubectl get pods -o yaml              # Full YAML output
kubectl get pods -o json              # Full JSON output
kubectl get all                       # Pods, services, deployments, replicasets

# Describe (events, conditions — CRITICAL for troubleshooting)
kubectl describe pod myapp

# Get specific fields with jsonpath
kubectl get pod myapp -o jsonpath='{.status.podIP}'
kubectl get nodes -o jsonpath='{.items[*].metadata.name}'

# Sort by a field
kubectl get pods --sort-by=.metadata.creationTimestamp

# Custom columns
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase
```

### Edit & Update

```bash
# Edit in-place (opens editor)
kubectl edit deployment myapp

# Apply from file
kubectl apply -f deployment.yaml

# Replace (destructive — deletes and recreates)
kubectl replace -f deployment.yaml

# Patch (partial update)
kubectl patch deployment myapp -p '{"spec":{"replicas":5}}'

# Scale
kubectl scale deployment myapp --replicas=5

# Set image (triggers rolling update)
kubectl set image deployment/myapp app=nginx:1.26
```

### Delete

```bash
# Delete by name
kubectl delete pod myapp

# Delete by file
kubectl delete -f pod.yaml

# Delete by label
kubectl delete pods -l app=myapp

# Force delete (stuck pods)
kubectl delete pod myapp --grace-period=0 --force

# Delete all pods in namespace
kubectl delete pods --all -n dev
```

### Debug

```bash
# Logs
kubectl logs myapp                     # Current logs
kubectl logs myapp -c sidecar          # Specific container
kubectl logs myapp --previous          # Previous (crashed) container
kubectl logs myapp -f                  # Follow/stream
kubectl logs -l app=myapp              # All pods with label

# Exec into container
kubectl exec -it myapp -- /bin/sh
kubectl exec -it myapp -c sidecar -- /bin/sh

# Port forward for testing
kubectl port-forward pod/myapp 8080:80
kubectl port-forward svc/myservice 8080:80

# Copy files
kubectl cp myapp:/var/log/app.log ./app.log
```

---

## Understanding `kubectl explain` — Your In-Exam Reference

When you forget a field name or structure during the exam:

```bash
# Top-level fields of a resource
kubectl explain pod
kubectl explain deployment

# Drill into nested fields
kubectl explain pod.spec
kubectl explain pod.spec.containers
kubectl explain pod.spec.containers.resources
kubectl explain pod.spec.containers.livenessProbe

# Recursive — show ALL fields at once
kubectl explain pod --recursive
```

This is faster than searching kubernetes.io docs for simple field references.

---

## Quick Reference: Resource Short Names

| Full Name | Short Name |
|-----------|------------|
| pods | po |
| services | svc |
| deployments | deploy |
| replicasets | rs |
| daemonsets | ds |
| statefulsets | sts |
| namespaces | ns |
| nodes | no |
| persistentvolumes | pv |
| persistentvolumeclaims | pvc |
| configmaps | cm |
| secrets | (none) |
| serviceaccounts | sa |
| ingresses | ing |
| networkpolicies | netpol |
| storageclasses | sc |
| endpoints | ep |

---

## Key Takeaways

1. **Everything is a resource** with apiVersion, kind, metadata, spec, and status
2. **Labels + selectors** are how Kubernetes ties objects together — understand this deeply
3. **Namespaces** scope resources — always check which namespace a question asks for
4. **`kubectl explain`** is your in-exam documentation — faster than searching the web UI
5. **`--dry-run=client -o yaml`** is the fastest way to generate YAML scaffolds in the exam
6. **Pod is the atomic unit** — even Deployments ultimately create Pods
