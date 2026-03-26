---
sidebar_position: 8
title: "07 · Storage"
---

# Storage

> **Exam relevance**: CKA ✅ (Storage — 10%) | CKAD ✅ (Application Design and Build — 20%)

---

## Storage Hierarchy

```
StorageClass                    ← Defines HOW storage is provisioned
  │
PersistentVolume (PV)           ← A piece of actual storage (provisioned manually or dynamically)
  │
PersistentVolumeClaim (PVC)     ← A request for storage by a user/pod
  │
Pod (volumeMount)               ← Uses the PVC
```

---

## Volumes — Basic Pod-Level Storage

Volumes are defined at the **pod level** and mounted into containers. They survive container restarts but NOT pod deletion (except PVs).

### emptyDir — Temporary Shared Storage

Created when a pod starts; deleted when the pod is removed. Useful for sharing files between containers in the same pod.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: shared-data
spec:
  containers:
  - name: writer
    image: busybox
    command: ['sh', '-c', 'echo "hello" > /data/message && sleep 3600']
    volumeMounts:
    - name: shared
      mountPath: /data
  - name: reader
    image: busybox
    command: ['sh', '-c', 'cat /data/message && sleep 3600']
    volumeMounts:
    - name: shared
      mountPath: /data
  volumes:
  - name: shared
    emptyDir: {}                       # Default: stored on node's disk
    # emptyDir:
    #   medium: Memory                 # Store in RAM (tmpfs) — faster but uses pod memory limit
    #   sizeLimit: 100Mi               # Optional size limit
```

### hostPath — Node's Filesystem

Mounts a file or directory from the node's filesystem into the pod. **Not portable** — pod is tied to a specific node.

```yaml
volumes:
- name: host-data
  hostPath:
    path: /var/log                     # Path on the node
    type: Directory                    # Directory, File, DirectoryOrCreate, FileOrCreate
```

**Use cases**: Accessing node logs, node monitoring agents (DaemonSets).
**Warning**: Don't use hostPath for general application data — it's node-specific.

### Other Volume Types (Less Common in Exams)

| Type | Description |
|------|-------------|
| `configMap` | Mount a ConfigMap as files |
| `secret` | Mount a Secret as files |
| `downwardAPI` | Mount pod metadata as files |
| `projected` | Combine multiple sources (secrets, configmaps, downward API, service account tokens) |
| `nfs` | Network File System mount |
| `csi` | Container Storage Interface — generic plugin system |

---

## PersistentVolumes (PV) — Cluster-Level Storage

A PersistentVolume is a piece of storage **provisioned by an administrator** (or dynamically via StorageClass). It exists independently of any pod.

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-10gi
spec:
  capacity:
    storage: 10Gi                      # Size of the volume
  accessModes:
  - ReadWriteOnce                      # Access mode
  persistentVolumeReclaimPolicy: Retain # What happens when PVC is deleted
  storageClassName: manual             # Links to PVC via StorageClass name
  hostPath:                            # Backend storage (for testing/single-node)
    path: /mnt/data
```

### Access Modes

| Mode | Abbreviation | Meaning |
|------|-------------|---------|
| `ReadWriteOnce` | RWO | One node can mount read-write |
| `ReadOnlyMany` | ROX | Many nodes can mount read-only |
| `ReadWriteMany` | RWX | Many nodes can mount read-write |
| `ReadWriteOncePod` | RWOP | Only one pod can mount read-write (K8s 1.27+) |

**Important**: Access modes are about NODES, not pods (except RWOP). `ReadWriteOnce` means one NODE — multiple pods on that same node can still access it.

### Reclaim Policies

| Policy | Behavior |
|--------|----------|
| `Retain` | PV is kept when PVC is deleted. Data preserved. Must manually reclaim. |
| `Delete` | PV and underlying storage are deleted when PVC is deleted. (Default for dynamic provisioning) |
| `Recycle` | DEPRECATED. Used to wipe the volume (`rm -rf /volume/*`) |

### PV Status Phases

| Phase | Meaning |
|-------|---------|
| `Available` | Free, not yet bound to a PVC |
| `Bound` | Bound to a PVC |
| `Released` | PVC deleted, but PV not yet reclaimed |
| `Failed` | Automatic reclamation failed |

---

## PersistentVolumeClaims (PVC) — Request Storage

A PVC is a **user's request** for storage. Kubernetes matches it to a PV based on size, access mode, and storage class.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
  namespace: default
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: manual             # Must match PV's storageClassName
  resources:
    requests:
      storage: 5Gi                     # Requested size (PV must be >= this)
```

### PV → PVC Binding Rules

A PVC will bind to a PV if:
1. **StorageClassName matches** (or both are empty)
2. **Access modes are compatible** (PV supports what PVC requests)
3. **Capacity is sufficient** (PV size >= PVC request)
4. **Labels match** (if PVC uses `selector`)

If no PV matches, the PVC stays in `Pending` state (unless a StorageClass can dynamically provision one).

### Using PVC in a Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: webapp
spec:
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: data
      mountPath: /usr/share/nginx/html
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: my-pvc                # Reference the PVC
```

---

## StorageClass — Dynamic Provisioning

StorageClasses allow **automatic** PV creation when a PVC is created. No admin intervention needed.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/azure-disk   # Cloud-specific provisioner
parameters:
  storageaccounttype: Premium_LRS       # Cloud-specific parameters
  kind: Managed
reclaimPolicy: Delete                   # Default for dynamic provisioning
volumeBindingMode: WaitForFirstConsumer # Don't provision until pod uses it
allowVolumeExpansion: true              # Allow PVC resize
```

### Volume Binding Modes

| Mode | Behavior |
|------|----------|
| `Immediate` | PV is provisioned as soon as PVC is created (default) |
| `WaitForFirstConsumer` | PV is provisioned only when a pod using the PVC is scheduled. Respects pod scheduling constraints (node affinity, zones). |

**Best practice**: Use `WaitForFirstConsumer` to avoid provisioning storage in the wrong zone.

### Common Provisioners

| Provisioner | Cloud |
|-------------|-------|
| `kubernetes.io/azure-disk` | Azure Managed Disk |
| `kubernetes.io/azure-file` | Azure File Share |
| `kubernetes.io/aws-ebs` | AWS Elastic Block Store |
| `kubernetes.io/gce-pd` | Google Persistent Disk |
| `kubernetes.io/no-provisioner` | Manual — no dynamic provisioning |

### Using StorageClass with PVC

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: fast-claim
spec:
  storageClassName: fast-ssd           # StorageClass name
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
```

When this PVC is created, the StorageClass automatically provisions a PV.

### Default StorageClass

Mark a StorageClass as default — PVCs without a `storageClassName` will use it:

```yaml
metadata:
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
```

```bash
# Check default StorageClass
kubectl get storageclass
# NAME                 PROVISIONER                RECLAIMPOLICY   VOLUMEBINDINGMODE
# standard (default)   kubernetes.io/gce-pd       Delete          Immediate
# fast-ssd             kubernetes.io/gce-pd       Delete          WaitForFirstConsumer
```

---

## Expanding PVCs

If the StorageClass has `allowVolumeExpansion: true`, you can expand a PVC:

```bash
kubectl edit pvc my-pvc
# Change spec.resources.requests.storage from 5Gi to 10Gi
```

**Important**: You can only EXPAND, never shrink. For some storage types, the pod must be restarted for the filesystem to resize.

---

## Volume Snapshots (CKA Bonus)

Volume snapshots allow point-in-time copies of PVs:

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: my-snapshot
spec:
  volumeSnapshotClassName: csi-snapclass
  source:
    persistentVolumeClaimName: my-pvc
```

Restore from snapshot:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: restored-pvc
spec:
  dataSource:
    name: my-snapshot
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

---

## StatefulSet Volume Claims (Recap)

StatefulSets use `volumeClaimTemplates` to give each pod its own PVC:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql
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
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:
  - metadata:
      name: data                       # Creates: data-mysql-0, data-mysql-1, data-mysql-2
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 10Gi
```

Key behavior:
- PVCs are created per pod: `data-mysql-0`, `data-mysql-1`, `data-mysql-2`
- PVCs persist even when pods are deleted
- When a StatefulSet is scaled down, PVCs are NOT deleted (manual cleanup needed)

---

## Practical Exam Commands

```bash
# List PVs and PVCs
kubectl get pv
kubectl get pvc
kubectl get pvc -A                     # All namespaces

# Describe for troubleshooting (binding issues, capacity)
kubectl describe pv pv-10gi
kubectl describe pvc my-pvc

# Check StorageClasses
kubectl get storageclass
kubectl get sc                         # Short name

# Create PVC quickly
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
EOF
```

---

## Troubleshooting Storage

| Symptom | Check |
|---------|-------|
| PVC stuck in `Pending` | No matching PV? StorageClass exists? Dynamic provisioner working? |
| Pod can't mount volume | PVC bound? Access mode compatible? Node has access to storage? |
| Multiple pods can't mount same PV | Check access mode — RWO means one node only |
| Data lost after pod restart | Was it an `emptyDir`? Use PVC for persistent data |
| PV stuck in `Released` | Reclaim policy is `Retain` — must manually clear `claimRef` |

### Manually Reclaim a Released PV

```bash
# Remove the claim reference to make PV available again
kubectl patch pv pv-10gi -p '{"spec":{"claimRef": null}}'
```

---

## Key Takeaways

1. **emptyDir** = temp, dies with pod | **hostPath** = node-specific | **PVC/PV** = persistent
2. **PVC binds to PV** by storageClassName + accessModes + capacity
3. **StorageClass** enables dynamic provisioning — no manual PV creation needed
4. **Access modes are about nodes**, not pods (except RWOP)
5. **`WaitForFirstConsumer`** binding mode prevents zone mismatch issues
6. **Retain** reclaim policy keeps data; **Delete** removes everything
7. **StatefulSet volumeClaimTemplates** create per-pod PVCs that survive pod restarts
8. PVCs can be **expanded** but never shrunk
9. When troubleshooting, check `kubectl describe pvc` events — binding failures show here
