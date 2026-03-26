---
sidebar_position: 5
title: "04 · Scheduling"
---

# Scheduling

> **Exam relevance**: CKA ✅ (Workloads & Scheduling — 15%) | CKAD ✅ (Application Environment — 25%)

---

## How the Scheduler Works (Recap)

When a Pod has no `nodeName`, the scheduler:

1. **Filters** — eliminates nodes that can't run the pod
2. **Scores** — ranks remaining nodes by preference
3. **Binds** — assigns the pod to the best node (sets `nodeName`)

You can influence every step of this process.

---

## nodeSelector — Simple Node Selection

The simplest way to constrain a pod to specific nodes. Match nodes by their labels.

```bash
# Add label to a node
kubectl label node worker-1 disktype=ssd

# Verify
kubectl get nodes --show-labels
kubectl get nodes -l disktype=ssd
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: fast-app
spec:
  nodeSelector:
    disktype: ssd                    # Only schedule on nodes with this label
  containers:
  - name: app
    image: nginx
```

If no node matches, the pod stays `Pending`.

---

## Node Affinity — Advanced Node Selection

Node affinity is a more expressive version of `nodeSelector`. It supports:
- **Required** rules (must match — hard constraint)
- **Preferred** rules (try to match — soft constraint)
- **Set-based operators** (In, NotIn, Exists, DoesNotExist, Gt, Lt)

### requiredDuringSchedulingIgnoredDuringExecution

Pod MUST be scheduled on a matching node. If no node matches, pod stays `Pending`.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-app
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: gpu
            operator: In
            values:
            - "true"
            - "yes"
  containers:
  - name: app
    image: tensorflow/tensorflow:latest-gpu
```

### preferredDuringSchedulingIgnoredDuringExecution

Scheduler TRIES to place pod on matching node, but will place it elsewhere if no match.

```yaml
spec:
  affinity:
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 80                     # Higher weight = stronger preference (1-100)
        preference:
          matchExpressions:
          - key: zone
            operator: In
            values:
            - us-east-1a
      - weight: 20
        preference:
          matchExpressions:
          - key: zone
            operator: In
            values:
            - us-east-1b
```

### Operators

| Operator | Meaning |
|----------|---------|
| `In` | Label value is in the list |
| `NotIn` | Label value is NOT in the list |
| `Exists` | Label key exists (any value) |
| `DoesNotExist` | Label key does NOT exist |
| `Gt` | Label value is greater than (numeric) |
| `Lt` | Label value is less than (numeric) |

### "IgnoredDuringExecution" — What Does It Mean?

If a node's labels change AFTER a pod is already running, the pod is NOT evicted. The rule only applies at scheduling time. (There is a planned `RequiredDuringExecution` that would evict — not yet stable.)

---

## Taints and Tolerations

Taints are applied to **nodes**. They **repel** pods unless the pod has a matching toleration.

Think of it as: nodes say "stay away unless you can tolerate me."

### Applying Taints

```bash
# Taint a node
kubectl taint nodes worker-1 key=value:NoSchedule

# Examples
kubectl taint nodes worker-1 env=production:NoSchedule
kubectl taint nodes worker-1 gpu=true:NoExecute

# Remove a taint (add - at the end)
kubectl taint nodes worker-1 env=production:NoSchedule-

# View taints on a node
kubectl describe node worker-1 | grep Taints
```

### Taint Effects

| Effect | Behavior |
|--------|----------|
| `NoSchedule` | New pods without toleration won't be scheduled here. Existing pods stay. |
| `PreferNoSchedule` | Scheduler avoids this node but will use it as last resort. |
| `NoExecute` | New pods won't schedule AND existing pods without toleration are evicted. |

### Adding Tolerations to Pods

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: production-app
spec:
  tolerations:
  - key: "env"
    operator: "Equal"          # key=value must match exactly
    value: "production"
    effect: "NoSchedule"
  containers:
  - name: app
    image: nginx
```

### Toleration Operators

| Operator | Meaning |
|----------|---------|
| `Equal` | Key and value must match exactly |
| `Exists` | Only the key needs to exist (value is ignored) |

### Special Tolerations

```yaml
# Tolerate ALL taints with a specific key (any value, any effect)
tolerations:
- key: "env"
  operator: "Exists"

# Tolerate EVERYTHING (run anywhere — used by DaemonSets)
tolerations:
- operator: "Exists"
```

### Built-in Taints

Kubernetes automatically adds these taints:

| Taint | When |
|-------|------|
| `node.kubernetes.io/not-ready` | Node is not ready |
| `node.kubernetes.io/unreachable` | Node is unreachable |
| `node.kubernetes.io/memory-pressure` | Node is low on memory |
| `node.kubernetes.io/disk-pressure` | Node is low on disk |
| `node.kubernetes.io/pid-pressure` | Node has too many processes |
| `node.kubernetes.io/unschedulable` | Node is cordoned |
| `node-role.kubernetes.io/control-plane:NoSchedule` | Control plane node |

### Taints + Tolerations vs Node Affinity

**They solve different problems:**

| Mechanism | Who decides? | What it does |
|-----------|-------------|--------------|
| Taints/Tolerations | Node says "keep out" | Repels pods FROM a node |
| Node Affinity | Pod says "I want that node" | Attracts pods TO a node |

**To guarantee a pod runs ONLY on specific nodes, use both:**
1. Taint the nodes → keeps other pods away
2. Add toleration + nodeAffinity on your pod → ensures it goes there AND can tolerate the taint

---

## Pod Affinity and Anti-Affinity

Pod affinity/anti-affinity schedules pods based on **which other pods are already running on a node**.

### Pod Affinity — "Schedule near this pod"

```yaml
spec:
  affinity:
    podAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - cache
        topologyKey: kubernetes.io/hostname    # Same node
```

This says: "Schedule this pod on a node that already has a pod with label `app=cache`."

### Pod Anti-Affinity — "Schedule away from this pod"

```yaml
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - webapp
        topologyKey: kubernetes.io/hostname    # Different node
```

This says: "Don't schedule this pod on any node that already has a pod with label `app=webapp`." Common for spreading replicas across nodes for high availability.

### topologyKey

Defines the "zone" for affinity rules:

| topologyKey | Meaning |
|-------------|---------|
| `kubernetes.io/hostname` | Same/different node |
| `topology.kubernetes.io/zone` | Same/different availability zone |
| `topology.kubernetes.io/region` | Same/different region |

### Practical Example: Spread Web Pods Across Nodes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: webapp
  template:
    metadata:
      labels:
        app: webapp
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: webapp
              topologyKey: kubernetes.io/hostname
      containers:
      - name: webapp
        image: nginx
```

---

## Topology Spread Constraints

More fine-grained control over how pods are spread across topology domains.

```yaml
spec:
  topologySpreadConstraints:
  - maxSkew: 1                                  # Max difference in pod count between zones
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule            # or ScheduleAnyway
    labelSelector:
      matchLabels:
        app: webapp
```

- `maxSkew: 1` means the difference in pod count between any two zones can't exceed 1
- Ensures even distribution across zones

---

## Resource Requests and Limits

Resources affect scheduling — the scheduler uses **requests** to decide which node has capacity.

### How They Work

| | Requests | Limits |
|---|---------|--------|
| **CPU** | Guaranteed minimum. Scheduler uses this to find a node. | Maximum CPU. Pod gets throttled if exceeded. |
| **Memory** | Guaranteed minimum. Scheduler uses this. | Maximum memory. Pod gets **OOMKilled** if exceeded. |

```yaml
containers:
- name: app
  image: nginx
  resources:
    requests:
      cpu: "250m"         # 250 millicores = 0.25 CPU
      memory: "128Mi"     # 128 mebibytes
    limits:
      cpu: "500m"         # Throttled above this
      memory: "256Mi"     # OOMKilled above this
```

### CPU Units

| Value | Meaning |
|-------|---------|
| `1` | 1 full CPU core |
| `500m` | Half a CPU core |
| `100m` | 1/10th of a CPU core |
| `0.1` | Same as 100m |

### Memory Units

| Value | Meaning |
|-------|---------|
| `128Mi` | 128 mebibytes (1 Mi = 1,048,576 bytes) |
| `1Gi` | 1 gibibyte |
| `128M` | 128 megabytes (1 M = 1,000,000 bytes) — use Mi instead |

### QoS Classes

Kubernetes assigns a QoS class based on how you set requests and limits:

| Class | Condition | Eviction Priority |
|-------|-----------|-------------------|
| **Guaranteed** | All containers have requests = limits (both CPU and memory) | Last to be evicted |
| **Burstable** | At least one container has a request or limit set | Middle |
| **BestEffort** | No requests or limits set on any container | First to be evicted |

When a node runs out of memory, Kubernetes evicts BestEffort pods first, then Burstable, then Guaranteed.

---

## LimitRange — Default Resource Boundaries

A LimitRange sets **default** and **max/min** resource values for a namespace. Pods that don't specify resources get the defaults.

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: dev
spec:
  limits:
  - type: Container
    default:                  # Default limits (applied if not specified)
      cpu: "500m"
      memory: "256Mi"
    defaultRequest:           # Default requests (applied if not specified)
      cpu: "100m"
      memory: "128Mi"
    max:                      # Maximum allowed
      cpu: "2"
      memory: "1Gi"
    min:                      # Minimum allowed
      cpu: "50m"
      memory: "64Mi"
  - type: Pod
    max:
      cpu: "4"
      memory: "2Gi"
```

---

## ResourceQuota — Namespace Resource Caps

A ResourceQuota limits the **total** resources consumed across all pods in a namespace.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
  namespace: dev
spec:
  hard:
    requests.cpu: "10"              # Total CPU requests across all pods
    requests.memory: "20Gi"
    limits.cpu: "20"
    limits.memory: "40Gi"
    pods: "50"                      # Max number of pods
    services: "10"
    persistentvolumeclaims: "20"
    configmaps: "50"
    secrets: "50"
    services.nodeports: "5"
```

**When a ResourceQuota is set, all pods MUST specify resource requests/limits** — otherwise creation is rejected. Use LimitRange to auto-apply defaults.

```bash
# Check quota usage
kubectl describe resourcequota dev-quota -n dev
```

---

## Manual Scheduling (nodeName)

Bypass the scheduler entirely by setting `nodeName`:

```yaml
spec:
  nodeName: worker-2              # Pod goes directly to this node
  containers:
  - name: app
    image: nginx
```

**Warning**: If the node doesn't exist or has no capacity, the pod fails. No filtering or scoring happens.

---

## Priority and Preemption

Higher-priority pods can **preempt** (evict) lower-priority pods when nodes are full.

```yaml
# Create a PriorityClass
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000000                    # Higher = more priority
globalDefault: false
preemptionPolicy: PreemptLowerPriority    # or Never
description: "Critical workloads"
```

```yaml
# Use it in a pod
spec:
  priorityClassName: high-priority
  containers:
  - name: critical-app
    image: nginx
```

---

## Key Takeaways

1. **nodeSelector** is simple: label nodes, match in pod spec
2. **Node affinity** is powerful: required vs preferred, set-based operators
3. **Taints repel, tolerations allow** — they work together
4. **Use taints + affinity together** to dedicate nodes to specific workloads
5. **Pod anti-affinity** spreads replicas for HA — common exam pattern
6. **Requests** affect scheduling; **limits** affect runtime enforcement
7. **CPU is throttled** when limit exceeded; **memory causes OOMKill**
8. **LimitRange** sets defaults; **ResourceQuota** sets namespace totals
9. **Guaranteed QoS** (requests=limits) is the safest for critical workloads
