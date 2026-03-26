---
sidebar_position: 3
title: "02 · Cluster Architecture"
---

# Cluster Architecture

> **Exam relevance**: CKA ✅ (25% — Cluster Architecture, Installation & Configuration) | CKAD: Conceptual understanding helps but not directly tested.

---

## The Big Picture

A Kubernetes cluster has two parts:

```
┌─────────────────────────────────────────────────────────┐
│                    CONTROL PLANE                         │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐  │
│  │ API      │ │ etcd      │ │Scheduler │ │Controller│  │
│  │ Server   │ │           │ │          │ │ Manager  │  │
│  └──────────┘ └───────────┘ └──────────┘ └──────────┘  │
│               ┌──────────────────────┐                   │
│               │ cloud-controller-mgr │ (if cloud)        │
│               └──────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
                          │  (HTTPS)
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────┴──────┐  ┌───────┴──────┐  ┌───────┴──────┐
│   WORKER     │  │   WORKER     │  │   WORKER     │
│   NODE 1     │  │   NODE 2     │  │   NODE 3     │
│ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │
│ │ kubelet  │ │  │ │ kubelet  │ │  │ │ kubelet  │ │
│ │kube-proxy│ │  │ │kube-proxy│ │  │ │kube-proxy│ │
│ │containerd│ │  │ │containerd│ │  │ │containerd│ │
│ │ [pods]   │ │  │ │ [pods]   │ │  │ │ [pods]   │ │
│ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Control Plane Components

### kube-apiserver

The **front door** to the cluster. Every interaction goes through the API server:

```
kubectl → API Server → etcd
Scheduler → API Server → etcd
Kubelet → API Server → etcd
Controller Manager → API Server → etcd
```

What it does:
- **Authenticates** requests (who are you?)
- **Authorizes** requests (are you allowed to do this?)
- **Validates** the resource definition (is this YAML valid?)
- **Persists** to etcd (writes the data)
- **Serves** the REST API that everything else talks to

Key facts:
- Runs as a static pod on control plane nodes (check `/etc/kubernetes/manifests/kube-apiserver.yaml`)
- Listens on port **6443** by default
- The only component that talks to etcd directly

```bash
# Check API server health
kubectl get componentstatuses   # deprecated but still works
kubectl get --raw /healthz

# See the API server pod
kubectl get pods -n kube-system | grep apiserver

# View API server manifest (on control plane node)
cat /etc/kubernetes/manifests/kube-apiserver.yaml
```

### etcd

A distributed **key-value store** that holds ALL cluster state. Every object you create (pods, services, secrets, configmaps) is stored in etcd.

Key facts:
- **Consistency**: Uses the Raft consensus algorithm — requires a quorum (majority) of nodes
- **For HA**: Use 3 or 5 etcd nodes (odd number for quorum)
- **Port**: 2379 (client communication), 2380 (peer communication)
- **Data path**: by default `/var/lib/etcd`
- Runs as a static pod or external service

**etcd backup and restore is a CKA exam topic:**

```bash
# Backup etcd
ETCDCTL_API=3 etcdctl snapshot save /tmp/etcd-backup.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# Verify the backup
ETCDCTL_API=3 etcdctl snapshot status /tmp/etcd-backup.db --write-table

# Restore etcd (creates new data directory)
ETCDCTL_API=3 etcdctl snapshot restore /tmp/etcd-backup.db \
  --data-dir=/var/lib/etcd-from-backup

# Then update the etcd static pod to use the new data directory:
# Edit /etc/kubernetes/manifests/etcd.yaml
# Change hostPath for etcd-data volume to /var/lib/etcd-from-backup
```

**Exam tip**: The etcd backup/restore question appears in nearly every CKA exam. Memorize the flags — especially `--cacert`, `--cert`, `--key`, and `--endpoints`.

### kube-scheduler

Decides **which node** a new pod should run on. It does NOT actually place the pod — it just sets the `nodeName` field. The kubelet on that node does the actual work.

**Scheduling process (this is what interviews ask):**

```
1. FILTERING (eliminate nodes that can't run the pod)
   ├── Does the node have enough CPU/memory? (resource requests)
   ├── Does the node match node selectors / node affinity?
   ├── Does the node have the right taints that the pod tolerates?
   ├── Is the pod's requested port available on the node?
   └── Does the pod's volume requirement match what the node offers?

2. SCORING (rank the remaining nodes)
   ├── Spread pods across nodes (anti-affinity)
   ├── Prefer nodes with the image already pulled
   ├── Prefer nodes with more available resources
   └── Apply priority functions (configurable)

3. BINDING
   └── Assign pod to the highest-scoring node (set spec.nodeName)
```

Key facts:
- Runs as a static pod: `/etc/kubernetes/manifests/kube-scheduler.yaml`
- If the scheduler is down, new pods stay in `Pending` state
- You can bypass the scheduler by setting `spec.nodeName` directly (static pods do this)
- You can write custom schedulers and specify `spec.schedulerName` per pod

### kube-controller-manager

Runs a collection of **controllers** — each controller watches a resource type and ensures actual state matches desired state:

| Controller | What It Does |
|-----------|--------------|
| **ReplicaSet controller** | Ensures the right number of pod replicas exist |
| **Deployment controller** | Manages ReplicaSets for rolling updates |
| **Node controller** | Monitors node health, marks nodes `NotReady` |
| **Job controller** | Creates pods for Jobs, tracks completions |
| **Service Account controller** | Creates default ServiceAccounts for namespaces |
| **Endpoint controller** | Populates the Endpoints object (links Services to Pods) |
| **Namespace controller** | Cleans up when a namespace is deleted |

**The reconciliation loop** (fundamental concept):
```
1. Watch: Observe the desired state (from API server)
2. Compare: Check if actual state matches desired state
3. Act: If different, take action to converge
4. Repeat: Continuously
```

Example: You set `replicas: 3` on a Deployment. The ReplicaSet controller watches for pods with matching labels. If only 2 exist, it creates a 3rd. If 4 exist, it deletes one.

### cloud-controller-manager

Only exists when running on a cloud provider (AWS, Azure, GCP). Handles cloud-specific logic:
- **Node controller**: Checks if a node still exists in the cloud after it stops responding
- **Route controller**: Sets up network routes in the cloud infrastructure
- **Service controller**: Creates cloud load balancers for `type: LoadBalancer` services

In AKS, this is what creates Azure Load Balancers when you create a LoadBalancer service.

---

## Worker Node Components

### kubelet

The **agent** running on every node. It:
- Registers the node with the API server
- Watches for pods assigned to its node (via API server)
- Tells the container runtime (containerd) to pull images and run containers
- Reports pod status back to the API server
- Executes liveness/readiness probes

Key facts:
- **NOT a static pod** — it's a systemd service
- Config: `/var/lib/kubelet/config.yaml`
- Check status: `systemctl status kubelet`
- Logs: `journalctl -u kubelet -f`

**Troubleshooting kubelet (CKA exam):**
```bash
# Is kubelet running?
systemctl status kubelet

# If not, start it
systemctl start kubelet
systemctl enable kubelet

# Check logs for errors
journalctl -u kubelet -f --no-pager | tail -50

# Common issues:
# - Wrong certificate paths in kubelet config
# - Can't reach API server (wrong address)
# - Container runtime not running
```

### kube-proxy

Maintains **network rules** on each node to implement Services. When you create a Service, kube-proxy ensures traffic to the Service's ClusterIP gets forwarded to the correct pods.

Three modes:
| Mode | How it works | Default? |
|------|-------------|----------|
| **iptables** | Creates iptables rules for each Service→Pod mapping | Yes (traditional) |
| **IPVS** | Uses Linux IPVS (IP Virtual Server) for load balancing | Better for large clusters |
| **nftables** | Uses nftables rules (newer replacement for iptables) | Available from K8s 1.29+ |

Key facts:
- Runs as a DaemonSet in `kube-system`
- Does NOT proxy traffic itself (in iptables/IPVS mode) — it just sets up the rules
- If kube-proxy is down, existing connections work but NEW service routing breaks

```bash
# Check kube-proxy
kubectl get daemonset kube-proxy -n kube-system
kubectl logs -n kube-system -l k8s-app=kube-proxy
```

### Container Runtime (containerd)

The software that actually runs containers. Kubernetes used to support Docker directly, but since v1.24, it uses the **Container Runtime Interface (CRI)**. The standard runtime is **containerd**.

```bash
# Check container runtime on a node
crictl ps                    # List running containers
crictl pods                  # List pods
crictl images                # List images
crictl logs <container-id>   # Container logs
```

**Note**: In the CKA exam environment, you use `crictl` not `docker` to interact with containers directly on a node.

---

## Static Pods

Static pods are managed **directly by the kubelet** on a specific node, without the API server. The kubelet watches a directory for YAML files and creates pods from them.

Default directory: `/etc/kubernetes/manifests/`

This is how control plane components run:
- `/etc/kubernetes/manifests/kube-apiserver.yaml`
- `/etc/kubernetes/manifests/kube-controller-manager.yaml`
- `/etc/kubernetes/manifests/kube-scheduler.yaml`
- `/etc/kubernetes/manifests/etcd.yaml`

**How to identify a static pod**: It has the node name appended:
```bash
kubectl get pods -n kube-system
# kube-apiserver-controlplane      ← static pod (node name suffix)
# coredns-5d78c9869d-abc12         ← regular pod (random suffix)
```

**Create a static pod (CKA exam question):**
```bash
# Find the static pod path
cat /var/lib/kubelet/config.yaml | grep staticPodPath
# staticPodPath: /etc/kubernetes/manifests

# Create a static pod
cat > /etc/kubernetes/manifests/my-static-pod.yaml << EOF
apiVersion: v1
kind: Pod
metadata:
  name: my-static-pod
spec:
  containers:
  - name: nginx
    image: nginx
EOF

# The kubelet automatically creates it. Delete the file to remove the pod.
```

---

## Cluster Setup with kubeadm

kubeadm is the standard tool for bootstrapping Kubernetes clusters. This is tested in the CKA exam.

### Initialize a Cluster

```bash
# On the control plane node:
kubeadm init \
  --pod-network-cidr=10.244.0.0/16 \      # Required for most CNI plugins
  --apiserver-advertise-address=192.168.1.10  # Control plane IP

# After init, set up kubectl:
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config

# Install a CNI plugin (required — pods won't work without it)
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
```

### Join Worker Nodes

```bash
# kubeadm init gives you a join command. It looks like:
kubeadm join 192.168.1.10:6443 \
  --token abcdef.1234567890abcdef \
  --discovery-token-ca-cert-hash sha256:abc123...

# If you lost the token, regenerate it:
kubeadm token create --print-join-command
```

### Cluster Upgrade (CKA Exam Topic)

Upgrade control plane first, then worker nodes, one at a time.

**Upgrade control plane:**
```bash
# 1. Check available versions
apt-cache madison kubeadm

# 2. Upgrade kubeadm
apt-get update
apt-get install -y kubeadm=1.31.0-00

# 3. Plan the upgrade (shows what will change)
kubeadm upgrade plan

# 4. Apply the upgrade
kubeadm upgrade apply v1.31.0

# 5. Upgrade kubelet and kubectl
apt-get install -y kubelet=1.31.0-00 kubectl=1.31.0-00
systemctl daemon-reload
systemctl restart kubelet
```

**Upgrade worker node:**
```bash
# 1. Drain the node (from control plane)
kubectl drain worker-1 --ignore-daemonsets --delete-emptydir-data

# 2. SSH to the worker node
ssh worker-1

# 3. Upgrade kubeadm
apt-get update
apt-get install -y kubeadm=1.31.0-00

# 4. Upgrade node config
kubeadm upgrade node

# 5. Upgrade kubelet and kubectl
apt-get install -y kubelet=1.31.0-00 kubectl=1.31.0-00
systemctl daemon-reload
systemctl restart kubelet

# 6. Exit SSH and uncordon (from control plane)
exit
kubectl uncordon worker-1
```

---

## Certificates in Kubernetes

All communication in a Kubernetes cluster is TLS-encrypted. The PKI (Public Key Infrastructure) is stored in `/etc/kubernetes/pki/`.

### Important Certificate Files

| File | Used By | Purpose |
|------|---------|---------|
| `ca.crt` / `ca.key` | Cluster CA | Root of trust — signs everything |
| `apiserver.crt` / `apiserver.key` | API Server | API server's TLS certificate |
| `apiserver-kubelet-client.crt` | API Server | When API server talks to kubelet |
| `etcd/ca.crt` | etcd | etcd's own CA |
| `etcd/server.crt` | etcd | etcd serving certificate |
| `front-proxy-ca.crt` | Aggregation layer | For API extension servers |

### Check Certificate Expiry

```bash
# Check all certificates
kubeadm certs check-expiration

# Renew all certificates
kubeadm certs renew all

# View a specific certificate
openssl x509 -in /etc/kubernetes/pki/apiserver.crt -text -noout
# Look for: Issuer, Subject, Not Before, Not After, SANs
```

**Exam tip**: If the API server won't start, check certificate expiry or incorrect paths in the manifest.

---

## How a Pod Gets Created — The Full Flow

Understanding this flow is what separates someone who "uses" Kubernetes from someone who "knows" Kubernetes:

```
1. User runs: kubectl create deployment myapp --image=nginx --replicas=3

2. kubectl sends HTTP POST to API Server
   → API Server authenticates, authorizes, validates
   → API Server writes Deployment object to etcd

3. Deployment Controller (in controller-manager) notices new Deployment
   → Creates a ReplicaSet object
   → API Server writes ReplicaSet to etcd

4. ReplicaSet Controller notices new ReplicaSet with 0/3 pods
   → Creates 3 Pod objects (with no nodeName yet)
   → API Server writes Pods to etcd

5. Scheduler notices 3 unscheduled Pods (no nodeName)
   → Runs filtering and scoring for each pod
   → Sets nodeName on each Pod (e.g., worker-1, worker-2, worker-1)
   → API Server writes updates to etcd

6. Kubelet on worker-1 notices 2 Pods assigned to it
   → Tells containerd to pull image and start containers
   → Reports Pod status back to API Server
   
   Kubelet on worker-2 notices 1 Pod assigned to it
   → Same process

7. Pods are Running ✓
```

---

## High Availability (HA) Control Plane

For production clusters, run multiple control plane nodes:

| Component | HA Strategy |
|-----------|-------------|
| API Server | Active-Active behind a load balancer |
| Controller Manager | Active-Standby (leader election) |
| Scheduler | Active-Standby (leader election) |
| etcd | Raft consensus (3 or 5 nodes) |

Why odd numbers for etcd? Quorum = (n/2) + 1:
- 3 nodes → quorum = 2 → survives 1 failure
- 5 nodes → quorum = 3 → survives 2 failures
- 2 nodes → quorum = 2 → survives 0 failures (worse than 1!)

---

## Key Takeaways

1. **API Server** is the gatekeeper — everything goes through it
2. **etcd** is the brain — all state lives here; back it up
3. **Scheduler** decides where; **kubelet** executes
4. **Controllers** enforce desired state via reconciliation loops
5. **Static pods** run control plane components — managed by kubelet, not API server
6. **kubeadm** sets up clusters — know `init`, `join`, and `upgrade` workflows
7. **kubelet** is a systemd service, everything else on control plane is a static pod
8. Know the path: `/etc/kubernetes/manifests/` for static pods, `/etc/kubernetes/pki/` for certificates
