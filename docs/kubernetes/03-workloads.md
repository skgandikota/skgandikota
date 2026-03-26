---
sidebar_position: 4
title: "03 · Workloads"
---

# Workloads

> **Exam relevance**: CKA ✅ (Workloads & Scheduling — 15%) | CKAD ✅ (Application Design & Build — 20%, Application Deployment — 20%)

---

## Workload Resource Hierarchy

```
Deployment
  └── manages → ReplicaSet (v1)
                  └── manages → Pod, Pod, Pod
  └── creates → ReplicaSet (v2)  ← on update
                  └── manages → Pod, Pod, Pod

StatefulSet
  └── manages → Pod-0, Pod-1, Pod-2  (ordered, stable names)

DaemonSet
  └── manages → Pod (one per node)

Job
  └── creates → Pod (runs to completion)

CronJob
  └── creates → Job (on schedule)
      └── creates → Pod
```

---

## Deployments — The Primary Workload

A Deployment manages a **ReplicaSet**, which manages **Pods**. You almost never create Pods or ReplicaSets directly.

### Full Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp
  namespace: default
  labels:
    app: webapp
spec:
  replicas: 3                          # Desired number of pods
  revisionHistoryLimit: 10             # How many old ReplicaSets to keep
  selector:                            # MUST match pod template labels
    matchLabels:
      app: webapp
  strategy:                            # How to update pods
    type: RollingUpdate                # RollingUpdate or Recreate
    rollingUpdate:
      maxSurge: 1                      # Max extra pods during update
      maxUnavailable: 0                # Max pods that can be down during update
  template:                            # Pod template — everything below is a Pod spec
    metadata:
      labels:
        app: webapp                    # MUST match selector above
    spec:
      containers:
      - name: webapp
        image: nginx:1.25
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "256Mi"
```

### Critical Rule: selector.matchLabels MUST match template.metadata.labels

If they don't match, the Deployment can't find its Pods. This is a common exam trap.

### Create Deployment Fast (Exam)

```bash
# Imperative
kubectl create deployment webapp --image=nginx:1.25 --replicas=3

# Generate YAML
kubectl create deployment webapp --image=nginx:1.25 --replicas=3 \
  --dry-run=client -o yaml > deployment.yaml
```

---

## Rolling Updates and Rollbacks

### Update Strategies

| Strategy | Behavior | When to Use |
|----------|----------|-------------|
| **RollingUpdate** | Gradually replaces old pods with new ones | Default. Zero-downtime updates. |
| **Recreate** | Kills ALL old pods, then creates new ones | When old and new versions can't coexist (DB schema changes) |

### How RollingUpdate Works

```
Initial state:  ReplicaSet-v1 (3 pods running nginx:1.25)

kubectl set image deployment/webapp webapp=nginx:1.26

Step 1: Create ReplicaSet-v2 with 1 pod (nginx:1.26)
        ReplicaSet-v1: 3 pods    ReplicaSet-v2: 1 pod    (maxSurge=1 → 4 total OK)

Step 2: Scale down ReplicaSet-v1 to 2
        ReplicaSet-v1: 2 pods    ReplicaSet-v2: 1 pod

Step 3: Scale up ReplicaSet-v2 to 2
        ReplicaSet-v1: 2 pods    ReplicaSet-v2: 2 pods

Step 4: Scale down ReplicaSet-v1 to 1
        ...and so on until...

Final:  ReplicaSet-v1: 0 pods    ReplicaSet-v2: 3 pods
```

### Triggering Updates

```bash
# Method 1: Set image directly
kubectl set image deployment/webapp webapp=nginx:1.26

# Method 2: Edit the deployment
kubectl edit deployment webapp

# Method 3: Apply updated YAML
kubectl apply -f deployment.yaml

# Record the change cause (useful for rollback history)
kubectl set image deployment/webapp webapp=nginx:1.26
kubectl annotate deployment/webapp kubernetes.io/change-cause="Update to nginx 1.26"
```

### Checking Rollout Status

```bash
# Watch rolling update progress
kubectl rollout status deployment/webapp

# View rollout history
kubectl rollout history deployment/webapp

# View a specific revision's details
kubectl rollout history deployment/webapp --revision=2
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/webapp

# Rollback to a specific revision
kubectl rollout undo deployment/webapp --to-revision=2

# Pause/Resume rollout (for canary-like testing)
kubectl rollout pause deployment/webapp
# ... test the partial rollout ...
kubectl rollout resume deployment/webapp
```

---

## ReplicaSets

A ReplicaSet ensures a specified number of pod replicas are running. You rarely create them directly — Deployments manage them.

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: webapp-rs
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
      containers:
      - name: webapp
        image: nginx:1.25
```

**Key behavior**: A ReplicaSet will adopt existing pods that match its selector, even if they weren't created by the ReplicaSet. This can cause unexpected behavior if labels overlap.

### Scaling

```bash
# Scale via kubectl
kubectl scale deployment webapp --replicas=5

# Scale via edit
kubectl edit deployment webapp
# Change spec.replicas

# Scale via patch
kubectl patch deployment webapp -p '{"spec":{"replicas":5}}'
```

---

## DaemonSets

A DaemonSet ensures **one copy of a pod runs on every node** (or a subset of nodes). When a new node joins the cluster, the DaemonSet automatically creates a pod on it.

**Use cases**:
- Log collectors (fluentd, filebeat)
- Monitoring agents (node-exporter, datadog-agent)
- Network plugins (kube-proxy, calico-node, cilium)
- Storage daemons (ceph, glusterd)

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-collector
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: log-collector
  template:
    metadata:
      labels:
        app: log-collector
    spec:
      tolerations:                      # Often needed to run on control plane
      - key: node-role.kubernetes.io/control-plane
        effect: NoSchedule
      containers:
      - name: fluentd
        image: fluentd:v1.16
        volumeMounts:
        - name: varlog
          mountPath: /var/log
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
```

### Targeting Specific Nodes

Use `nodeSelector` or `nodeAffinity` to limit which nodes get the DaemonSet pod:

```yaml
spec:
  template:
    spec:
      nodeSelector:
        disk: ssd           # Only nodes with label disk=ssd
```

### DaemonSet Updates

DaemonSets support rolling updates (default) or `OnDelete` (manual):

```yaml
spec:
  updateStrategy:
    type: RollingUpdate        # or OnDelete
    rollingUpdate:
      maxUnavailable: 1        # Update one node at a time
```

---

## StatefulSets

StatefulSets are for **stateful applications** that need:
- **Stable network identity**: Pod names are predictable (`mysql-0`, `mysql-1`, `mysql-2`)
- **Stable storage**: Each pod gets its own PersistentVolumeClaim that survives restarts
- **Ordered deployment**: Pods are created in order (0, 1, 2) and scaled down in reverse (2, 1, 0)

**Use cases**: Databases (MySQL, PostgreSQL), message queues (Kafka, RabbitMQ), distributed systems (Zookeeper, etcd)

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql-headless          # REQUIRED: Headless service name
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:                # Each pod gets its OWN PVC
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: standard
      resources:
        requests:
          storage: 10Gi
```

### StatefulSet REQUIRES a Headless Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql-headless
spec:
  clusterIP: None                      # Headless — no cluster IP
  selector:
    app: mysql
  ports:
  - port: 3306
```

With this, each pod gets a DNS record:
```
mysql-0.mysql-headless.default.svc.cluster.local
mysql-1.mysql-headless.default.svc.cluster.local
mysql-2.mysql-headless.default.svc.cluster.local
```

### StatefulSet vs Deployment

| Feature | Deployment | StatefulSet |
|---------|-----------|-------------|
| Pod names | Random (`webapp-5d78c-abc12`) | Ordered (`mysql-0`, `mysql-1`) |
| Pod creation | Parallel | Sequential (waits for previous to be Ready) |
| Pod deletion | Any order | Reverse order (2 → 1 → 0) |
| Storage | All pods share PVC or no PVC | Each pod gets its own PVC |
| DNS | Via Service only | Individual pod DNS records |
| Use case | Stateless apps | Stateful apps (databases) |

### Scaling StatefulSets

```bash
kubectl scale statefulset mysql --replicas=5
# Creates mysql-3, then mysql-4 (in order)

kubectl scale statefulset mysql --replicas=2
# Deletes mysql-4, then mysql-3, then mysql-2 (reverse order)
# PVCs are NOT deleted — they persist for reuse
```

---

## Jobs

A Job creates one or more pods and ensures they **run to completion** (exit code 0). Unlike Deployments, Jobs don't restart pods that succeed.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: data-processor
spec:
  completions: 5               # Total successful completions needed
  parallelism: 2               # How many pods run simultaneously
  backoffLimit: 3              # Retries before marking job as failed
  activeDeadlineSeconds: 300   # Kill the whole job after 5 minutes
  template:
    spec:
      restartPolicy: Never     # MUST be Never or OnFailure (not Always)
      containers:
      - name: processor
        image: busybox
        command: ["sh", "-c", "echo Processing batch $JOB_COMPLETION_INDEX && sleep 5"]
```

### Job Patterns

| completions | parallelism | Behavior |
|-------------|-------------|----------|
| 1 | 1 | Single pod runs to completion (default) |
| 5 | 1 | 5 pods run sequentially |
| 5 | 3 | Up to 3 pods run in parallel until 5 succeed |
| — | 3 | Work queue — 3 workers process until done |

### Quick Job Creation (Exam)

```bash
kubectl create job my-job --image=busybox -- sh -c "echo hello && sleep 30"

# Generate YAML
kubectl create job my-job --image=busybox --dry-run=client -o yaml -- sh -c "echo hello"
```

### Check Job Status

```bash
kubectl get jobs
kubectl describe job data-processor
kubectl get pods -l job-name=data-processor
kubectl logs job/data-processor     # Logs of the job's pod
```

---

## CronJobs

A CronJob creates Jobs on a schedule, using standard cron syntax.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-cleanup
spec:
  schedule: "0 2 * * *"                  # Every day at 2:00 AM
  concurrencyPolicy: Forbid              # Don't start new if previous still running
  successfulJobsHistoryLimit: 3          # Keep last 3 successful jobs
  failedJobsHistoryLimit: 1              # Keep last 1 failed job
  startingDeadlineSeconds: 200           # Max seconds late a job can start
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: cleanup
            image: busybox
            command: ["sh", "-c", "echo Cleaning up old data"]
```

### Cron Schedule Syntax

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6, Sun=0)
│ │ │ │ │
* * * * *

Examples:
*/5 * * * *     → every 5 minutes
0 * * * *       → every hour
0 0 * * *       → every day at midnight
0 0 * * 0       → every Sunday at midnight
30 8 1 * *      → 8:30 AM on the 1st of every month
```

### Concurrency Policies

| Policy | Behavior |
|--------|----------|
| `Allow` | Multiple jobs can run simultaneously (default) |
| `Forbid` | Skip new job if previous is still running |
| `Replace` | Kill the running job and start new one |

### Quick CronJob Creation (Exam)

```bash
kubectl create cronjob daily-backup --image=busybox \
  --schedule="0 2 * * *" \
  -- sh -c "echo backup completed"
```

---

## Pod Restart Policies

| Policy | Behavior | Used By |
|--------|----------|---------|
| `Always` | Restart container regardless of exit code | Deployments, ReplicaSets, DaemonSets, StatefulSets |
| `OnFailure` | Restart only on non-zero exit code | Jobs |
| `Never` | Never restart | Jobs (one-shot) |

**Important**: This is set at the Pod spec level (`spec.restartPolicy`), not the container level.

---

## Horizontal Pod Autoscaler (HPA)

HPA automatically scales the number of pod replicas based on CPU, memory, or custom metrics.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: webapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: webapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70      # Scale when avg CPU > 70%
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Quick HPA (Exam)

```bash
# Requires metrics-server to be running
kubectl autoscale deployment webapp --min=2 --max=10 --cpu-percent=70

# Check HPA
kubectl get hpa
kubectl describe hpa webapp-hpa
```

**Prerequisite**: The Deployment's pods MUST have `resources.requests` set for CPU/memory. Without requests, HPA can't calculate utilization percentage.

---

## Key Takeaways

1. **Deployments** are the default choice for stateless apps — they manage ReplicaSets and rolling updates
2. **RollingUpdate** strategy gives zero-downtime deploys; **Recreate** kills all pods first
3. **`kubectl rollout undo`** is how you rollback — know it cold
4. **StatefulSets** give stable names, ordered ops, and per-pod storage — required for databases
5. **DaemonSets** ensure one pod per node — used for monitoring/logging agents
6. **Jobs** run to completion; **CronJobs** run Jobs on a schedule
7. **HPA** needs metrics-server AND resource requests to work
8. **selector.matchLabels MUST match template.metadata.labels** — this is a frequent exam gotcha
