---
sidebar_position: 10
title: "09 · Cluster Maintenance"
---

# Cluster Maintenance

> **Exam relevance**: CKA ✅ (Cluster Architecture — 25%, Troubleshooting — 30%) | CKAD: Not directly tested

---

## Node Maintenance — Drain, Cordon, Uncordon

When you need to take a node offline for maintenance (OS updates, hardware changes):

### cordon — Mark Node Unschedulable

```bash
# Prevent new pods from being scheduled on this node
kubectl cordon worker-1

# Existing pods continue running
kubectl get nodes
# NAME       STATUS                    ROLES    AGE
# worker-1   Ready,SchedulingDisabled  <none>   30d
```

### drain — Evict All Pods and Cordon

```bash
# Safely evict all pods from the node
kubectl drain worker-1 --ignore-daemonsets --delete-emptydir-data

# Common flags:
# --ignore-daemonsets       Required (DaemonSet pods can't be evicted normally)
# --delete-emptydir-data    Allow evicting pods using emptyDir volumes (data is lost)
# --force                   Force eviction of unmanaged pods (no controller)
# --grace-period=30         Override pod termination grace period
```

**What `drain` does:**
1. Cordons the node (marks unschedulable)
2. Evicts pods respecting PodDisruptionBudgets
3. Pods managed by Deployments/ReplicaSets are recreated on other nodes
4. DaemonSet pods are ignored (they belong on every node)
5. Standalone pods (no controller) are deleted permanently — use `--force` for these

### uncordon — Allow Scheduling Again

```bash
# After maintenance, allow pods to be scheduled again
kubectl uncordon worker-1
```

**Note**: Existing pods that were evicted do NOT automatically move back. Only new pods can be scheduled on the uncordoned node.

---

## Cluster Upgrade with kubeadm

Kubernetes releases a new minor version every ~4 months. The upgrade process:
1. Upgrade control plane node(s) first
2. Upgrade worker nodes one at a time

**Rule**: You can only upgrade one minor version at a time (1.30 → 1.31, not 1.30 → 1.32).

### Step-by-Step: Upgrade Control Plane

```bash
# 1. Check current version
kubectl get nodes
kubeadm version
kubelet --version

# 2. Find available versions
apt-cache madison kubeadm
# or
apt list -a kubeadm

# 3. Upgrade kubeadm on control plane
apt-get update
apt-get install -y kubeadm=1.31.0-1.1

# 4. Verify kubeadm version
kubeadm version

# 5. Plan the upgrade (dry-run — shows what will happen)
kubeadm upgrade plan

# 6. Apply the upgrade on the FIRST control plane node
kubeadm upgrade apply v1.31.0
# For ADDITIONAL control plane nodes, use:
# kubeadm upgrade node

# 7. Drain the control plane node
kubectl drain controlplane --ignore-daemonsets

# 8. Upgrade kubelet and kubectl
apt-get install -y kubelet=1.31.0-1.1 kubectl=1.31.0-1.1

# 9. Restart kubelet
systemctl daemon-reload
systemctl restart kubelet

# 10. Uncordon
kubectl uncordon controlplane
```

### Step-by-Step: Upgrade Worker Node

```bash
# ON THE CONTROL PLANE:
# 1. Drain the worker
kubectl drain worker-1 --ignore-daemonsets --delete-emptydir-data

# SSH TO THE WORKER NODE:
ssh worker-1

# 2. Upgrade kubeadm
apt-get update
apt-get install -y kubeadm=1.31.0-1.1

# 3. Upgrade node configuration
kubeadm upgrade node

# 4. Upgrade kubelet and kubectl
apt-get install -y kubelet=1.31.0-1.1 kubectl=1.31.0-1.1

# 5. Restart kubelet
systemctl daemon-reload
systemctl restart kubelet

# 6. Exit back to control plane
exit

# ON THE CONTROL PLANE:
# 7. Uncordon the worker
kubectl uncordon worker-1

# 8. Verify
kubectl get nodes
```

### Upgrade Order Summary

```
1. kubeadm (on the node)
2. kubeadm upgrade apply/node
3. kubelet + kubectl (on the node)
4. systemctl restart kubelet
```

---

## etcd Backup and Restore

etcd holds ALL cluster state. Backing it up is the most critical maintenance task.

### Finding etcd Connection Details

```bash
# From the etcd static pod manifest
cat /etc/kubernetes/manifests/etcd.yaml | grep -E 'listen-client|cert-file|key-file|trusted-ca'

# Typical values:
# --listen-client-urls=https://127.0.0.1:2379
# --cert-file=/etc/kubernetes/pki/etcd/server.crt
# --key-file=/etc/kubernetes/pki/etcd/server.key
# --trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt

# Or use describe
kubectl describe pod etcd-controlplane -n kube-system
```

### Backup

```bash
ETCDCTL_API=3 etcdctl snapshot save /opt/etcd-backup.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
```

### Verify Backup

```bash
ETCDCTL_API=3 etcdctl snapshot status /opt/etcd-backup.db --write-table
```

### Restore

```bash
# 1. Stop the API server and etcd (move manifests away)
mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/
mv /etc/kubernetes/manifests/etcd.yaml /tmp/

# Wait for them to stop
crictl ps | grep -E 'etcd|apiserver'

# 2. Restore to a NEW directory
ETCDCTL_API=3 etcdctl snapshot restore /opt/etcd-backup.db \
  --data-dir=/var/lib/etcd-restored

# 3. Update etcd manifest to use the new data directory
# Edit /tmp/etcd.yaml:
#   Change hostPath for etcd-data volume from /var/lib/etcd to /var/lib/etcd-restored

# 4. Move manifests back
mv /tmp/etcd.yaml /etc/kubernetes/manifests/
mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/

# 5. Wait for components to restart
kubectl get pods -n kube-system
```

**Alternative restore method (simpler but same idea):**
```bash
# 1. Restore snapshot to new directory
ETCDCTL_API=3 etcdctl snapshot restore /opt/etcd-backup.db \
  --data-dir=/var/lib/etcd-restored

# 2. Edit etcd static pod to point to new directory
vi /etc/kubernetes/manifests/etcd.yaml
# Change:
#   volumes:
#   - hostPath:
#       path: /var/lib/etcd          ← change this
#       type: DirectoryOrCreate
# To:
#       path: /var/lib/etcd-restored  ← to this

# kubelet detects the change and restarts etcd automatically
```

### Exam Tip for etcd

The etcd backup/restore question is worth 7-8% of the CKA exam. Memorize:
- `ETCDCTL_API=3` (always version 3)
- Three cert flags: `--cacert`, `--cert`, `--key`
- `--endpoints=https://127.0.0.1:2379`
- `snapshot save` for backup, `snapshot restore --data-dir=<NEW>` for restore
- After restore: update etcd manifest to point to the new data directory

---

## Operating System Upgrades

When a node goes down:
- **If it comes back within 5 minutes**: Pods are still there, kubelet restarts them
- **If it's down > 5 minutes** (default `pod-eviction-timeout`): Controller manager considers pods dead, recreates them elsewhere

For planned OS maintenance:
```bash
# 1. Drain the node
kubectl drain worker-1 --ignore-daemonsets --delete-emptydir-data

# 2. Do the OS upgrade (kernel update, patches, reboot, etc.)
ssh worker-1
apt-get update && apt-get upgrade -y
reboot

# 3. Wait for node to come back
# 4. Uncordon
kubectl uncordon worker-1
```

---

## PodDisruptionBudgets (PDB)

PDBs prevent drain/eviction from removing too many pods at once. They ensure minimum availability during maintenance.

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: webapp-pdb
spec:
  minAvailable: 2                      # At least 2 pods must stay running
  # OR
  # maxUnavailable: 1                  # At most 1 pod can be down
  selector:
    matchLabels:
      app: webapp
```

```bash
# Create PDB imperatively
kubectl create pdb webapp-pdb --selector=app=webapp --min-available=2

# Check PDBs
kubectl get pdb
kubectl describe pdb webapp-pdb
```

**How PDBs affect drain:**
- `kubectl drain` respects PDBs — it won't evict pods if doing so would violate the PDB
- If a PDB blocks drain, you'll see the drain command hang — you may need to wait for replacement pods or increase replicas
- `--force` does NOT override PDBs (it only affects unmanaged pods)

---

## Cluster Component Health

### Checking Control Plane Health

```bash
# Component status (deprecated but still works)
kubectl get componentstatuses
# or
kubectl get cs

# Check system pods
kubectl get pods -n kube-system

# Check node status
kubectl get nodes
kubectl describe node controlplane

# API server health
kubectl get --raw /healthz
kubectl get --raw /livez
kubectl get --raw /readyz
```

### Checking kubelet

```bash
# On the node:
systemctl status kubelet
journalctl -u kubelet --no-pager | tail -50
```

### Checking Control Plane Logs

```bash
# Static pod logs
kubectl logs kube-apiserver-controlplane -n kube-system
kubectl logs kube-scheduler-controlplane -n kube-system
kubectl logs kube-controller-manager-controlplane -n kube-system
kubectl logs etcd-controlplane -n kube-system

# Or directly on the node
crictl logs <container-id>
```

---

## Key Takeaways

1. **drain → maintain → uncordon** is the standard node maintenance flow
2. **`kubectl drain`** needs `--ignore-daemonsets` (almost always) and respects PDBs
3. **Cluster upgrades**: one minor version at a time, control plane first, then workers
4. **Upgrade order on each node**: kubeadm → `kubeadm upgrade` → kubelet + kubectl → restart kubelet
5. **etcd backup**: `ETCDCTL_API=3 etcdctl snapshot save` with three cert flags
6. **etcd restore**: `snapshot restore --data-dir=<NEW>` then update etcd manifest
7. **PDBs** protect availability during drain — know `minAvailable` vs `maxUnavailable`
8. After restore/upgrade, always verify with `kubectl get nodes` and `kubectl get pods -n kube-system`
