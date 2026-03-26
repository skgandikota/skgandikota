---
sidebar_position: 11
title: "10 · Troubleshooting"
---

# Troubleshooting

> **Exam relevance**: CKA ✅ (Troubleshooting — 30% — THE highest-weighted domain) | CKAD ✅ (Application Observability and Maintenance — 15%)

---

## Troubleshooting Framework

For every problem, follow this systematic approach:

```
1. What's the symptom? (Pod not running, service not reachable, node not ready)
2. Where is the problem? (Pod level, Node level, Cluster level, Network level)
3. What do the events say? (kubectl describe, kubectl logs, journalctl)
4. Fix and verify
```

---

## Pod Troubleshooting

### Pod Status Reference

| Status | Meaning | Where to Look |
|--------|---------|---------------|
| `Pending` | Not scheduled yet | `kubectl describe pod` — Events section |
| `ContainerCreating` | Scheduled but containers aren't started | Image pull, volume mount issues |
| `Running` | At least one container running | Check if it's actually healthy (probes) |
| `CrashLoopBackOff` | Container keeps crashing and restarting | `kubectl logs` and `kubectl logs --previous` |
| `ImagePullBackOff` | Can't pull container image | Wrong image name, private registry, no secret |
| `ErrImagePull` | Initial image pull failure | Same as above |
| `Error` | Container exited with error | `kubectl logs` |
| `Completed` | Container exited successfully (exit 0) | Normal for Jobs |
| `Terminating` | Pod is being deleted | Stuck? Check finalizers, force delete |
| `Unknown` | Node lost contact | Node issue, not pod issue |
| `OOMKilled` | Out of memory | Increase memory limits or fix memory leak |

### Step 1: Describe the Pod

```bash
kubectl describe pod <pod-name> -n <namespace>
```

**Read the Events section at the bottom.** It tells you exactly what happened:

```
Events:
  Type     Reason            Message
  ----     ------            -------
  Warning  FailedScheduling  0/3 nodes are available: 3 Insufficient cpu.
  Normal   Scheduled         Successfully assigned default/myapp to worker-1
  Normal   Pulling           Pulling image "nginx:latest"
  Warning  Failed            Failed to pull image "nginx:latestt": rpc error...
  Warning  BackOff           Back-off restarting failed container
```

### Step 2: Check Logs

```bash
# Current container logs
kubectl logs <pod-name>

# Specific container (multi-container pod)
kubectl logs <pod-name> -c <container-name>

# Previous crashed container (CRITICAL for CrashLoopBackOff)
kubectl logs <pod-name> --previous

# Stream logs
kubectl logs <pod-name> -f

# Last N lines
kubectl logs <pod-name> --tail=50

# All pods with a label
kubectl logs -l app=myapp
```

### Step 3: Exec Into the Pod

```bash
# Get a shell
kubectl exec -it <pod-name> -- /bin/sh
# or
kubectl exec -it <pod-name> -- /bin/bash

# Run a specific command
kubectl exec <pod-name> -- cat /etc/config/app.properties
kubectl exec <pod-name> -- env
kubectl exec <pod-name> -- ls -la /app/data

# Specific container
kubectl exec -it <pod-name> -c <container-name> -- /bin/sh
```

---

## Common Pod Issues and Fixes

### Pending — Pod Won't Schedule

```bash
kubectl describe pod <name>
# Look at Events section
```

| Events Message | Cause | Fix |
|---------------|-------|-----|
| `Insufficient cpu` / `Insufficient memory` | No node has enough resources | Reduce requests, add nodes, or free up resources |
| `didn't match Pod's node affinity/selector` | nodeSelector or nodeAffinity doesn't match any node | Fix labels on nodes or update pod's selectors |
| `had taint ... that the pod didn't tolerate` | Node has a taint, pod has no toleration | Add toleration to pod or remove taint from node |
| `persistentvolumeclaim "x" not found` | PVC doesn't exist | Create the PVC |
| `pod has unbound immediate PersistentVolumeClaims` | PVC exists but no matching PV | Create a PV or fix StorageClass |
| `0/3 nodes are available: 1 node(s) had taint ... 2 node(s) didn't match` | Combination of issues | Address each constraint |

### CrashLoopBackOff — Container Keeps Crashing

```bash
# FIRST: Check previous container logs
kubectl logs <pod-name> --previous

# Check container exit code
kubectl describe pod <pod-name>
# Look for: Last State: Terminated, Exit Code: X
```

| Exit Code | Meaning | Common Cause |
|-----------|---------|-------------|
| 0 | Success | App finished — maybe wrong `restartPolicy` |
| 1 | Application error | Bug in app, wrong config, missing env var |
| 126 | Can't execute | Command not found or not executable |
| 127 | Command not found | Wrong `command` in pod spec |
| 128+N | Killed by signal N | 137 = OOMKilled (128+9), 143 = SIGTERM (128+15) |
| 137 | OOMKilled | Container exceeded memory limit |

**Common fixes for CrashLoopBackOff:**
```bash
# 1. Check if command is correct
kubectl get pod <name> -o yaml | grep -A5 command

# 2. Check environment variables
kubectl exec <pod-name> -- env

# 3. Check mounted volumes
kubectl exec <pod-name> -- ls -la /path/to/volume

# 4. If OOMKilled, increase memory limit
kubectl edit deployment <name>
# Increase spec.containers[].resources.limits.memory
```

### ImagePullBackOff — Can't Pull Image

```bash
kubectl describe pod <name>
# Look for: Failed to pull image "myimage:v1"
```

| Cause | Fix |
|-------|-----|
| Image name typo | Fix the image name (`ngnix` → `nginx`) |
| Tag doesn't exist | Check available tags |
| Private registry, no credentials | Create `imagePullSecrets` or attach to ServiceAccount |
| Registry unreachable | Check network, DNS, firewall |

```bash
# Test image pull manually on the node
crictl pull nginx:1.25
```

### CreateContainerConfigError

Usually means a ConfigMap or Secret referenced in the pod doesn't exist:

```bash
kubectl describe pod <name>
# Events: Error: configmap "myconfig" not found
# Events: Error: secret "mysecret" not found
```

Fix: Create the missing ConfigMap/Secret, or fix the reference name.

---

## Node Troubleshooting

### Node Not Ready

```bash
kubectl get nodes
# NAME       STATUS     ROLES           AGE
# worker-1   NotReady   <none>          30d

kubectl describe node worker-1
# Look at: Conditions section
```

### Node Conditions

| Condition | Status | Meaning |
|-----------|--------|---------|
| `Ready` | True | Node is healthy |
| `Ready` | False | kubelet not healthy, can't run pods |
| `Ready` | Unknown | Node not communicating (might be down) |
| `MemoryPressure` | True | Node is low on memory |
| `DiskPressure` | True | Node is low on disk |
| `PIDPressure` | True | Too many processes |
| `NetworkUnavailable` | True | Network not configured (CNI issue) |

### Common Node Fixes

```bash
# SSH to the node
ssh worker-1

# 1. Check kubelet
systemctl status kubelet
# If inactive/failed:
systemctl start kubelet
systemctl enable kubelet

# 2. Check kubelet logs
journalctl -u kubelet --no-pager | tail -100

# Common kubelet issues:
# - Wrong certificate paths → check /var/lib/kubelet/config.yaml
# - Can't reach API server → check --kubeconfig path
# - Container runtime not running → check containerd

# 3. Check container runtime
systemctl status containerd
# If not running:
systemctl start containerd
systemctl enable containerd

# 4. Check disk space
df -h
# If full, clear space

# 5. Check memory
free -h

# 6. Check kubelet config
cat /var/lib/kubelet/config.yaml
```

### kubelet Won't Start — Common Causes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `failed to load kubelet config file` | Wrong config path | Check `--config` in kubelet service |
| `unable to load client CA file` | Wrong CA cert path | Fix `clientCAFile` in kubelet config |
| `connection refused` to API server | API server down or wrong address | Check `--kubeconfig` references |
| `Unrecognized option` | Wrong flag name | Check kubelet service file for typos |

Finding and fixing the kubelet service:
```bash
# Find the kubelet service file
systemctl cat kubelet
# or
cat /etc/systemd/system/kubelet.service.d/10-kubeadm.conf

# After editing, always:
systemctl daemon-reload
systemctl restart kubelet
```

---

## Service Troubleshooting

When a Service isn't reachable:

### Step 1: Does the Service exist with correct selector?

```bash
kubectl get svc myservice
kubectl describe svc myservice
```

### Step 2: Are there endpoints?

```bash
kubectl get endpoints myservice
# If EMPTY: selector doesn't match any pod labels

# Compare:
kubectl get svc myservice -o yaml | grep -A3 selector
kubectl get pods --show-labels
```

**No endpoints = selector mismatch.** This is the #1 cause of "service not working."

### Step 3: Is the targetPort correct?

```bash
# Service targetPort must match the container's actual listening port
kubectl get svc myservice -o yaml | grep targetPort
kubectl get pod <pod-name> -o yaml | grep containerPort

# Test from inside the cluster
kubectl run test --image=busybox --restart=Never -- wget -qO- http://myservice:80
```

### Step 4: Can you reach the pod directly?

```bash
# Get pod IP
kubectl get pod <name> -o wide

# Test from another pod
kubectl exec test-pod -- wget -qO- http://10.244.1.5:8080
```

### Step 5: Is there a NetworkPolicy blocking traffic?

```bash
kubectl get networkpolicies -n <namespace>
kubectl describe networkpolicy <name>
```

### Service Debugging Flowchart

```
Service not reachable
  │
  ├── kubectl get endpoints myservice
  │   └── Empty? → Selector doesn't match pod labels (fix labels)
  │   └── Has IPs? → Continue
  │
  ├── Can you reach pod directly? (curl pod-ip:port)
  │   └── No? → Pod isn't listening on that port (check app, containerPort)
  │   └── Yes? → Service is misconfigured
  │
  ├── Is targetPort correct?
  │   └── Must match the port the container actually listens on
  │
  ├── Is there a NetworkPolicy?
  │   └── Check if it allows the traffic source/destination
  │
  └── Is kube-proxy running?
      └── kubectl get ds kube-proxy -n kube-system
```

---

## DNS Troubleshooting

```bash
# Create a debug pod
kubectl run dnstest --image=busybox:1.36 --restart=Never -- sleep 3600

# Test DNS
kubectl exec dnstest -- nslookup kubernetes
kubectl exec dnstest -- nslookup myservice.default.svc.cluster.local

# If DNS fails, check CoreDNS
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns

# Check CoreDNS ConfigMap
kubectl get configmap coredns -n kube-system -o yaml

# Check if CoreDNS service exists
kubectl get svc kube-dns -n kube-system

# Check resolv.conf in the pod
kubectl exec dnstest -- cat /etc/resolv.conf
# Should show: nameserver 10.96.0.10 (or your CoreDNS ClusterIP)
```

---

## Control Plane Troubleshooting

### API Server Not Responding

```bash
# Check if API server pod is running
crictl ps | grep apiserver
# If not, check the static pod manifest:
cat /etc/kubernetes/manifests/kube-apiserver.yaml

# Common issues:
# - Wrong certificate paths
# - Wrong etcd endpoint
# - Typo in arguments
# - Port conflict

# Check API server logs
crictl logs <apiserver-container-id>
# or
cat /var/log/pods/kube-system_kube-apiserver-*/kube-apiserver/*.log
```

### Scheduler Not Working (Pods Stay Pending)

```bash
# Check scheduler pod
kubectl get pods -n kube-system | grep scheduler
kubectl logs kube-scheduler-controlplane -n kube-system

# If scheduler is down, check manifest:
cat /etc/kubernetes/manifests/kube-scheduler.yaml
```

### Controller Manager Not Working (Replicas Not Created)

```bash
kubectl get pods -n kube-system | grep controller-manager
kubectl logs kube-controller-manager-controlplane -n kube-system

# Check manifest
cat /etc/kubernetes/manifests/kube-controller-manager.yaml
```

### General Static Pod Troubleshooting

```bash
# All control plane manifests
ls /etc/kubernetes/manifests/

# If a static pod isn't running:
# 1. Check for YAML syntax errors
# 2. Check for wrong flag names/values
# 3. Check for wrong file/cert paths
# 4. Check kubelet logs (kubelet manages static pods)
journalctl -u kubelet | tail -50
```

---

## Networking Troubleshooting

### Pod Can't Reach External Network

```bash
# Check if the pod can resolve DNS
kubectl exec <pod> -- nslookup google.com

# Check if the pod can reach external IPs
kubectl exec <pod> -- wget -qO- --timeout=5 http://1.1.1.1

# Check CNI configuration
ls /etc/cni/net.d/
cat /etc/cni/net.d/*.conflist

# Check CNI pods
kubectl get pods -n kube-system | grep -E 'calico|flannel|cilium|weave'
```

### Pod-to-Pod Communication Fails

```bash
# Get both pod IPs
kubectl get pods -o wide

# Test connectivity from one pod to another
kubectl exec pod-a -- ping <pod-b-ip>
kubectl exec pod-a -- wget -qO- http://<pod-b-ip>:8080

# If ping works but HTTP doesn't → app not listening
# If ping fails → network/CNI issue

# Check NetworkPolicies
kubectl get networkpolicies -A
```

---

## Quick Diagnosis Commands

```bash
# Cluster-wide overview
kubectl get nodes
kubectl get pods -A | grep -v Running     # Non-running pods across all namespaces
kubectl get events --sort-by='.lastTimestamp' -A | tail -20

# Node-specific
kubectl describe node <name> | grep -A5 Conditions
kubectl top nodes                         # Requires metrics-server

# Pod-specific
kubectl describe pod <name>               # Events at the bottom
kubectl logs <name> --previous            # Crashed container logs
kubectl get pod <name> -o yaml            # Full spec for debugging

# Service-specific
kubectl get endpoints <service-name>      # Empty = selector mismatch
kubectl describe svc <service-name>

# On the node (SSH)
systemctl status kubelet
systemctl status containerd
journalctl -u kubelet --no-pager | tail -50
crictl ps                                 # Running containers
crictl pods                               # Pods seen by runtime
```

---

## Exam Troubleshooting Strategy

The Troubleshooting domain is **30% of CKA**. You can expect 3-5 questions. Common patterns:

1. **Fix a broken node** → SSH in, check kubelet, restart it, fix config errors
2. **Fix a broken control plane component** → Check static pod manifest for typos, wrong cert paths
3. **Fix a pod that's not running** → describe, logs, check image/config/resources
4. **Fix a service that's not routing** → Check endpoints, selector, targetPort
5. **Restore etcd from backup** → snapshot restore with correct flags

**Speed tip**: Train yourself to immediately jump to `kubectl describe` + Events, then `kubectl logs --previous`. These two commands solve 80% of troubleshooting questions.

---

## Key Takeaways

1. **Always start with `kubectl describe`** — Events section is gold
2. **`kubectl logs --previous`** shows why a crashed container failed
3. **Empty endpoints** = selector doesn't match pod labels (service issue #1)
4. **Node NotReady** = check kubelet (`systemctl status kubelet` → `journalctl -u kubelet`)
5. **Static pod issues** = check `/etc/kubernetes/manifests/*.yaml` for typos
6. **DNS issues** = check CoreDNS pods and `/etc/resolv.conf` in the pod
7. **Network issues** = check CNI pods, NetworkPolicies, kube-proxy
8. **Exit code 137** = OOMKilled → increase memory limit
9. **Exit code 127** = command not found → fix the container command/args
10. Practice the systematic approach: **describe → logs → exec → fix → verify**
