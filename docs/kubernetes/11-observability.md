---
sidebar_position: 12
title: "11 · Observability"
---

# Observability

> **Exam relevance**: CKA ✅ (Troubleshooting — 30%) | CKAD ✅ (Application Observability and Maintenance — 15%)

---

## Probes — Health Checking Containers

Kubernetes uses probes to check if containers are alive, ready, and started. The kubelet runs these probes on each container.

### Three Types of Probes

| Probe | Purpose | What Happens on Failure |
|-------|---------|------------------------|
| **Liveness** | "Is the container alive?" | Container is **killed and restarted** |
| **Readiness** | "Can the container serve traffic?" | Pod is **removed from Service endpoints** (no traffic) |
| **Startup** | "Has the container finished starting?" | Container is **killed and restarted** (disables liveness/readiness until it passes) |

### Probe Mechanisms

| Type | How It Works | When to Use |
|------|-------------|-------------|
| `httpGet` | HTTP GET to a path/port. Success = 2xx/3xx | Web apps with health endpoints |
| `tcpSocket` | TCP connection to a port. Success = port is open | Databases, services without HTTP |
| `exec` | Runs a command in the container. Success = exit code 0 | Custom checks, file existence |
| `grpc` | gRPC health check (K8s 1.27+) | gRPC services |

### Liveness Probe

Detects deadlocks and hangs. If it fails, kubelet kills the container.

```yaml
spec:
  containers:
  - name: app
    image: myapp
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
      initialDelaySeconds: 15          # Wait before first probe
      periodSeconds: 10                # Check every 10 seconds
      timeoutSeconds: 3                # Timeout for each check
      failureThreshold: 3              # Kill after 3 consecutive failures
      successThreshold: 1              # 1 success to be considered alive (always 1 for liveness)
```

**TCP example:**
```yaml
    livenessProbe:
      tcpSocket:
        port: 3306
      initialDelaySeconds: 10
      periodSeconds: 10
```

**Exec example:**
```yaml
    livenessProbe:
      exec:
        command:
        - cat
        - /tmp/healthy
      initialDelaySeconds: 5
      periodSeconds: 5
```

### Readiness Probe

Controls when a pod receives traffic from a Service. Pod stays Running but gets no traffic until this passes.

```yaml
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
      failureThreshold: 3
      successThreshold: 1              # Can be > 1 for readiness (must pass N times)
```

**Without readiness probes**, pods receive traffic immediately — even if the app isn't ready. This causes errors during rolling updates and cold starts.

### Startup Probe

For slow-starting containers. Disables liveness and readiness probes until it succeeds.

```yaml
    startupProbe:
      httpGet:
        path: /healthz
        port: 8080
      initialDelaySeconds: 0
      periodSeconds: 10
      failureThreshold: 30             # 30 × 10s = 300s (5 min) to start
```

After the startup probe passes, liveness and readiness probes take over.

### When to Use Which Probe

| Scenario | Probes Needed |
|----------|--------------|
| Web app, fast startup | liveness + readiness |
| Web app, slow startup (Java/Spring) | liveness + readiness + startup |
| Background worker (no HTTP) | liveness (exec or tcp) |
| Database | liveness (tcp) + readiness (exec running a query) |
| Sidecar container | Usually none or just liveness |

### Complete Example with All Three Probes

```yaml
spec:
  containers:
  - name: webapp
    image: myapp:v2
    ports:
    - containerPort: 8080
    startupProbe:                      # Allow up to 5 min to start
      httpGet:
        path: /healthz
        port: 8080
      failureThreshold: 30
      periodSeconds: 10
    livenessProbe:                     # Kill if unhealthy for 30s
      httpGet:
        path: /healthz
        port: 8080
      periodSeconds: 10
      failureThreshold: 3
    readinessProbe:                    # Remove from service if not ready
      httpGet:
        path: /ready
        port: 8080
      periodSeconds: 5
      failureThreshold: 3
```

---

## Container Logging

### Application Logging Best Practice

Containers should log to **stdout and stderr** — Kubernetes captures these automatically.

```bash
# View logs
kubectl logs <pod-name>
kubectl logs <pod-name> -c <container>     # Multi-container
kubectl logs <pod-name> --previous         # Previous (crashed) container
kubectl logs <pod-name> --tail=100         # Last 100 lines
kubectl logs <pod-name> --since=1h         # Last hour
kubectl logs <pod-name> -f                 # Follow/stream
kubectl logs -l app=myapp                  # All pods with label
kubectl logs -l app=myapp --all-containers # All containers in matching pods
```

### Where Logs Are Stored on the Node

```bash
# Node-level log files
/var/log/pods/<namespace>_<pod-name>_<uid>/<container-name>/0.log
/var/log/containers/<pod-name>_<namespace>_<container>-<id>.log

# kubelet logs
journalctl -u kubelet

# Container runtime logs
journalctl -u containerd
```

### Logging for Applications That Write to Files

If your app writes to a file (not stdout), use a sidecar:

```yaml
spec:
  containers:
  - name: app
    image: myapp
    volumeMounts:
    - name: log-volume
      mountPath: /var/log/app
  - name: log-sidecar                 # Sidecar streams file to stdout
    image: busybox
    command: ['sh', '-c', 'tail -f /var/log/app/app.log']
    volumeMounts:
    - name: log-volume
      mountPath: /var/log/app
  volumes:
  - name: log-volume
    emptyDir: {}
```

Now `kubectl logs <pod> -c log-sidecar` shows the log file contents.

---

## Monitoring — Resource Metrics

### Metrics Server

The Metrics Server collects CPU and memory usage from kubelets. Required for:
- `kubectl top`
- Horizontal Pod Autoscaler (HPA)
- Vertical Pod Autoscaler (VPA)

```bash
# Check if metrics-server is installed
kubectl get deployment metrics-server -n kube-system

# If not installed (from official manifests):
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### kubectl top — Resource Usage

```bash
# Node resource usage
kubectl top nodes
# NAME       CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
# worker-1   250m         12%    1024Mi           52%
# worker-2   180m         9%     768Mi            39%

# Pod resource usage
kubectl top pods
kubectl top pods -n kube-system
kubectl top pods --sort-by=cpu
kubectl top pods --sort-by=memory
kubectl top pods -A                    # All namespaces

# Container-level usage
kubectl top pods --containers
```

### Resource Usage vs Requests/Limits

```bash
# Compare actual usage to configured requests
kubectl top pod myapp                  # Actual: 150m CPU, 200Mi memory
kubectl get pod myapp -o yaml          # Configured: requests 100m CPU, 128Mi memory
                                       #             limits 500m CPU, 256Mi memory
```

If actual usage consistently exceeds requests, the pod might get evicted under pressure.
If actual usage exceeds memory limit, the container is OOMKilled.

---

## Events — What Kubernetes Is Doing

Events are short-lived records of what happened in the cluster. They auto-expire after ~1 hour.

```bash
# All events in current namespace
kubectl get events

# Events sorted by time
kubectl get events --sort-by='.lastTimestamp'

# Events for all namespaces
kubectl get events -A

# Watch events in real-time
kubectl get events -w

# Events for a specific resource
kubectl describe pod myapp             # Shows events at the bottom
kubectl describe node worker-1         # Shows node events
```

### Event Types

| Type | Meaning |
|------|---------|
| `Normal` | Expected behavior (scheduled, pulled, started) |
| `Warning` | Something went wrong (failed pull, back-off, unhealthy) |

### Useful Event Filters

```bash
# Only warnings
kubectl get events --field-selector type=Warning

# Events for a specific pod
kubectl get events --field-selector involvedObject.name=myapp

# Events in last 5 minutes
kubectl get events --sort-by='.lastTimestamp' | tail -20
```

---

## API Deprecations (CKAD Topic)

Kubernetes deprecates and removes old API versions. You need to know how to handle this.

```bash
# Check if your YAML uses deprecated APIs
kubectl apply -f old-ingress.yaml --dry-run=server
# Warning: extensions/v1beta1 Ingress is deprecated...

# Find the correct API version
kubectl api-resources | grep ingress
# NAME       SHORTNAMES   APIVERSION              NAMESPACED   KIND
# ingresses  ing          networking.k8s.io/v1    true         Ingress

# Convert old YAML to current API
kubectl convert -f old-ingress.yaml --output-version networking.k8s.io/v1
# (kubectl convert may need to be installed as a plugin)
```

### Common API Version Changes to Know

| Old (Deprecated) | Current | Resource |
|-------------------|---------|----------|
| `extensions/v1beta1` | `networking.k8s.io/v1` | Ingress |
| `apps/v1beta1` | `apps/v1` | Deployment |
| `batch/v1beta1` | `batch/v1` | CronJob |
| `policy/v1beta1` | `policy/v1` | PodDisruptionBudget |

---

## Debugging with Ephemeral Containers

Ephemeral containers let you debug running pods without restarting them — useful when the pod has no shell or debugging tools.

```bash
# Add a debug container to a running pod
kubectl debug -it <pod-name> --image=busybox --target=<container-name>

# Debug a node
kubectl debug node/worker-1 -it --image=ubuntu
# This creates a pod with hostPID, hostNetwork, and mounts the node's filesystem at /host

# Create a copy of a pod for debugging (doesn't affect the original)
kubectl debug <pod-name> -it --copy-to=debug-pod --container=debug --image=busybox
```

---

## Key Takeaways

1. **Liveness**: kills container on failure | **Readiness**: removes from traffic | **Startup**: delays other probes
2. Always set **readiness probes** on production pods — prevents traffic to unready containers
3. **Startup probes** for slow-starting apps — prevents liveness killing during startup
4. Logs go to **stdout/stderr** — use sidecar for file-based logs
5. **`kubectl logs --previous`** is essential for CrashLoopBackOff debugging
6. **Metrics Server** required for `kubectl top` and HPA
7. **`kubectl get events --sort-by='.lastTimestamp'`** shows recent cluster activity
8. **Ephemeral containers** (`kubectl debug`) for debugging minimal/distroless images
9. Know common **API deprecations** — `extensions/v1beta1` → `networking.k8s.io/v1` for Ingress
