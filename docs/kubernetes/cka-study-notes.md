---
sidebar_position: 1
---

# CKA Study Notes

## Exam Overview

- **Exam**: Certified Kubernetes Administrator (CKA)
- **Format**: Performance-based (hands-on in a live cluster)
- **Duration**: 2 hours
- **Passing score**: 66%
- **Key**: Speed matters — practice `kubectl` commands until they're muscle memory

## Domains

| Domain | Weight |
|--------|--------|
| Storage | 10% |
| Troubleshooting | 30% |
| Workloads & Scheduling | 15% |
| Cluster Architecture, Installation & Configuration | 25% |
| Services & Networking | 20% |

## Essential kubectl Commands

```bash
# Quick pod creation
kubectl run nginx --image=nginx --restart=Never

# Generate YAML without creating
kubectl run nginx --image=nginx --dry-run=client -o yaml > pod.yaml

# Create deployment
kubectl create deployment myapp --image=nginx --replicas=3

# Expose as service
kubectl expose deployment myapp --port=80 --target-port=80 --type=ClusterIP

# Quick debug
kubectl describe pod <name>
kubectl logs <pod> -c <container> --previous
kubectl exec -it <pod> -- /bin/sh

# Context and namespace
kubectl config set-context --current --namespace=myns
```

## Key Topics to Master

### 1. Cluster Setup (kubeadm)
- `kubeadm init`, `kubeadm join`
- etcd backup and restore
- Upgrading cluster version

### 2. Workloads
- Deployments, ReplicaSets, DaemonSets, StatefulSets
- Rolling updates and rollbacks
- Resource requests and limits
- Scheduling: nodeSelector, affinity, taints/tolerations

### 3. Networking
- Services: ClusterIP, NodePort, LoadBalancer
- Ingress and IngressClass
- NetworkPolicy (ingress/egress rules)
- CoreDNS

### 4. Storage
- PersistentVolume, PersistentVolumeClaim
- StorageClass and dynamic provisioning
- Volume modes and access modes

### 5. Troubleshooting
- Node not ready → kubelet, container runtime
- Pod not scheduling → describe, events, taints
- Service not reachable → endpoints, selectors, network policy

---

*Notes in progress — adding content as I study each domain.*
