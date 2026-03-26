---
sidebar_position: 7
title: "06 · Networking & Services"
---

# Networking & Services

> **Exam relevance**: CKA ✅ (Services & Networking — 20%) | CKAD ✅ (Services & Networking — 20%)

---

## Kubernetes Networking Model — The Rules

Every Kubernetes cluster follows these rules (regardless of which CNI plugin is used):

1. **Every Pod gets its own IP address** — no NAT between pods
2. **Every Pod can reach every other Pod** using its Pod IP — across nodes, without NAT
3. **Every Node can reach every Pod** — and vice versa, without NAT
4. **The IP a Pod sees for itself is the same IP** others see for it — no hidden NAT

This is achieved by the **CNI (Container Network Interface)** plugin: Calico, Flannel, Cilium, Weave, etc.

---

## Pod Networking — How It Works

```
Node 1 (10.0.1.1)                    Node 2 (10.0.2.1)
┌─────────────────────┐              ┌─────────────────────┐
│ Pod A: 10.244.1.5   │              │ Pod C: 10.244.2.3   │
│ Pod B: 10.244.1.6   │──────────────│ Pod D: 10.244.2.4   │
│                     │   Overlay    │                     │
│  veth pairs → cbr0  │   or BGP    │  veth pairs → cbr0  │
└─────────────────────┘              └─────────────────────┘
```

- Each pod gets a **veth (virtual ethernet) pair** — one end in the pod, one on the node's bridge
- The CNI plugin handles cross-node routing (overlay network, BGP, etc.)
- Pod CIDR is typically `10.244.0.0/16` (Flannel default) or `192.168.0.0/16` (Calico default)

Pod-to-Pod communication within the same node uses the local bridge. Across nodes, the CNI handles routing.

---

## Services — Stable Endpoints for Pods

Pods are ephemeral — they get new IPs when recreated. Services provide a **stable virtual IP (ClusterIP)** and **DNS name** that routes to the correct pods.

### How Services Find Pods

Services use **label selectors** to find pods. The **Endpoints** (or EndpointSlices) object tracks which pod IPs match.

```
Service (selector: app=webapp)
  │
  └── Endpoints: [10.244.1.5, 10.244.2.3, 10.244.2.4]
                  ↑ Pod IPs that match the selector
```

```bash
# View endpoints for a service
kubectl get endpoints myservice
kubectl get endpointslices -l kubernetes.io/service-name=myservice
```

### ClusterIP — Internal Access Only

Default service type. Gets a virtual IP reachable only from within the cluster.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: webapp-service
spec:
  type: ClusterIP                      # Default — can omit
  selector:
    app: webapp                        # Matches pods with this label
  ports:
  - port: 80                          # Service listens on this port
    targetPort: 8080                   # Forwards to this port on the pod
    protocol: TCP
```

```bash
# Quick create
kubectl expose deployment webapp --port=80 --target-port=8080 --type=ClusterIP
```

### NodePort — External Access via Node IP

Opens a port on EVERY node (30000–32767). Traffic to `<NodeIP>:<NodePort>` is forwarded to the service.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: webapp-nodeport
spec:
  type: NodePort
  selector:
    app: webapp
  ports:
  - port: 80                          # ClusterIP port (still accessible internally)
    targetPort: 8080                   # Pod port
    nodePort: 30080                    # Port on every node (optional — auto-assigned if omitted)
```

```
External → NodeIP:30080 → Service:80 → Pod:8080
```

### LoadBalancer — Cloud Load Balancer

Creates an external load balancer (in AWS, Azure, GCP). Superset of NodePort.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: webapp-lb
spec:
  type: LoadBalancer
  selector:
    app: webapp
  ports:
  - port: 80
    targetPort: 8080
```

In cloud environments, this creates:
- A ClusterIP (for internal access)
- A NodePort (for node-level access)
- An external load balancer (cloud-specific, e.g., Azure Load Balancer)

### ExternalName — DNS Alias

Maps a service to an external DNS name. No proxying — just a CNAME record.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  type: ExternalName
  externalName: db.example.com        # DNS CNAME
```

### Headless Service — Direct Pod DNS

Set `clusterIP: None`. No virtual IP is assigned. DNS queries return individual pod IPs.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: db-headless
spec:
  clusterIP: None                      # Headless
  selector:
    app: mysql
  ports:
  - port: 3306
```

Used with StatefulSets to give each pod a DNS name:
```
mysql-0.db-headless.default.svc.cluster.local
mysql-1.db-headless.default.svc.cluster.local
```

### Service Port Types Summary

```
┌──────────────────────────────────────────────────┐
│ port: 80          ← Service's ClusterIP port     │
│ targetPort: 8080  ← Container's listening port   │
│ nodePort: 30080   ← Port on every node           │
│ containerPort: 8080  ← (Pod spec, informational) │
└──────────────────────────────────────────────────┘
```

### Named Ports

You can reference ports by name instead of number:

```yaml
# In the Pod/Deployment
containers:
- name: app
  ports:
  - name: http
    containerPort: 8080

# In the Service
ports:
- port: 80
  targetPort: http            # References the named port
```

---

## DNS in Kubernetes — CoreDNS

CoreDNS runs as a Deployment in `kube-system` namespace. It provides DNS for all services and pods.

### Service DNS Records

Every service gets a DNS record:
```
<service-name>.<namespace>.svc.cluster.local
```

Examples:
```bash
# From same namespace
curl webapp-service              # Short name works

# From different namespace
curl webapp-service.production.svc.cluster.local

# You can also use shorter forms
curl webapp-service.production.svc
curl webapp-service.production
```

### Pod DNS Records

Pods get DNS records based on their IP (with dots replaced by dashes):
```
10-244-1-5.default.pod.cluster.local
```

### CoreDNS Configuration

```bash
# Check CoreDNS pods
kubectl get pods -n kube-system -l k8s-app=kube-dns

# Check CoreDNS ConfigMap
kubectl get configmap coredns -n kube-system -o yaml
```

The CoreDNS ConfigMap (`Corefile`):
```
.:53 {
    errors
    health
    kubernetes cluster.local in-addr.arpa ip6.arpa {
        pods insecure
        fallthrough in-addr.arpa ip6.arpa
    }
    forward . /etc/resolv.conf
    cache 30
    loop
    reload
    loadbalance
}
```

### Troubleshooting DNS

```bash
# Run a debug pod
kubectl run dnstest --image=busybox --restart=Never -- sleep 3600

# Test DNS resolution from inside
kubectl exec dnstest -- nslookup webapp-service
kubectl exec dnstest -- nslookup webapp-service.default.svc.cluster.local
kubectl exec dnstest -- nslookup kubernetes.default

# Check resolv.conf inside a pod
kubectl exec dnstest -- cat /etc/resolv.conf
# Should show: nameserver 10.96.0.10 (CoreDNS ClusterIP)
#              search default.svc.cluster.local svc.cluster.local cluster.local
```

---

## Ingress — HTTP/HTTPS Routing

Ingress provides **HTTP/HTTPS routing** to services based on hostname or path. It requires an **Ingress Controller** (nginx, traefik, HAProxy, etc.) to be installed.

### Ingress Controller vs Ingress Resource

- **Ingress Controller**: The actual reverse proxy (e.g., nginx pod). Must be installed separately.
- **Ingress Resource**: The routing rules YOU define (YAML).
- **IngressClass**: Links Ingress resources to a specific controller.

### Simple Ingress — Single Service

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: simple-ingress
spec:
  ingressClassName: nginx              # Which Ingress Controller to use
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: webapp-service
            port:
              number: 80
```

### Host-Based Routing

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-host-ingress
spec:
  ingressClassName: nginx
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: webapp-service
            port:
              number: 80
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
```

### Path-Based Routing

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: path-based-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /    # Rewrite URL path
spec:
  ingressClassName: nginx
  rules:
  - host: example.com
    http:
      paths:
      - path: /app
        pathType: Prefix
        backend:
          service:
            name: webapp-service
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
```

### Path Types

| Type | Behavior |
|------|----------|
| `Prefix` | Matches URL path prefix. `/api` matches `/api`, `/api/users`, `/api/v2` |
| `Exact` | Exact match only. `/api` matches only `/api`, not `/api/users` |
| `ImplementationSpecific` | Up to the IngressClass to decide |

### TLS / HTTPS

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-ingress
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.example.com
    secretName: app-tls-secret         # Secret containing tls.crt and tls.key
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: webapp-service
            port:
              number: 80
```

Create the TLS secret:
```bash
kubectl create secret tls app-tls-secret --cert=cert.pem --key=key.pem
```

### Default Backend

Handle requests that don't match any rule:

```yaml
spec:
  defaultBackend:
    service:
      name: default-service
      port:
        number: 80
```

---

## NetworkPolicy — Firewall Rules for Pods

By default, ALL pods can communicate with ALL other pods. NetworkPolicy restricts this.

**Prerequisites**: Your CNI plugin must support NetworkPolicy (Calico, Cilium, Weave = yes; Flannel = no by default).

### How NetworkPolicy Works

- Policies are **additive** — if no policy selects a pod, all traffic is allowed
- Once ANY policy selects a pod, only traffic matching a rule is allowed (default deny for that pod)
- Policies are **namespace-scoped**

### Default Deny All Ingress (Exam Common)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: production
spec:
  podSelector: {}              # Select ALL pods in this namespace
  policyTypes:
  - Ingress                    # Only restrict ingress
  # No ingress rules = deny all incoming traffic
```

### Default Deny All Egress

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-egress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Egress
  # No egress rules = deny all outgoing traffic
```

### Default Deny All (Both Directions)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

### Allow Specific Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend                     # This policy applies to backend pods
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:                     # Allow from pods with label app=frontend
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080                       # Only on port 8080
```

### Allow from Specific Namespace

```yaml
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
  - from:
    - namespaceSelector:               # Allow from any pod in monitoring namespace
        matchLabels:
          name: monitoring
    - podSelector:                     # AND/OR allow from frontend pods in same namespace
        matchLabels:
          app: frontend
```

**Important: AND vs OR logic in NetworkPolicy**

```yaml
# OR (two separate list items) — allow from namespace OR from pods
ingress:
- from:
  - namespaceSelector:
      matchLabels:
        name: monitoring              # FROM monitoring namespace
  - podSelector:
      matchLabels:
        app: frontend                 # OR FROM frontend pods (same namespace)

# AND (combined in one list item) — allow from specific pods in specific namespace
ingress:
- from:
  - namespaceSelector:
      matchLabels:
        name: production
    podSelector:                      # Note: same level, not separate list item
      matchLabels:
        app: frontend                 # FROM frontend pods IN production namespace
```

This AND vs OR distinction is a **very common exam trap**.

### Allow DNS Egress (Almost Always Needed)

When you deny all egress, pods can't resolve DNS. Always allow DNS:

```yaml
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector: {}           # Any namespace (kube-system for CoreDNS)
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
  - to:                               # Allow backend to talk to database
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
```

### Allow by IP Block (CIDR)

```yaml
ingress:
- from:
  - ipBlock:
      cidr: 10.0.0.0/8
      except:
      - 10.0.1.0/24                   # Exclude this subnet
```

### Complete Example: Typical 3-Tier App

```yaml
# Frontend: allow ingress from external, allow egress to backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-policy
spec:
  podSelector:
    matchLabels:
      tier: frontend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from: []                          # Allow from anywhere (including external)
    ports:
    - port: 80
  egress:
  - to:
    - podSelector:
        matchLabels:
          tier: backend
    ports:
    - port: 8080
  - to:                               # DNS
    ports:
    - port: 53
      protocol: UDP
---
# Backend: only from frontend, only to database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
spec:
  podSelector:
    matchLabels:
      tier: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: frontend
    ports:
    - port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          tier: database
    ports:
    - port: 5432
  - to:
    ports:
    - port: 53
      protocol: UDP
---
# Database: only from backend, no egress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-policy
spec:
  podSelector:
    matchLabels:
      tier: database
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: backend
    ports:
    - port: 5432
  egress:
  - to:
    ports:
    - port: 53
      protocol: UDP
```

---

## CNI Plugins

The Container Network Interface (CNI) plugin is responsible for assigning IPs to pods and enabling pod-to-pod communication.

| Plugin | Key Features |
|--------|-------------|
| **Calico** | Most popular. BGP routing, NetworkPolicy support, high performance |
| **Flannel** | Simple overlay (VXLAN). No native NetworkPolicy (use Calico as policy-only) |
| **Cilium** | eBPF-based, excellent performance, advanced NetworkPolicy, observability |
| **Weave** | Simple overlay, NetworkPolicy support, easy setup |

In the exam, the CNI is pre-installed. You just need to know:
```bash
# Check which CNI is installed
ls /etc/cni/net.d/
cat /etc/cni/net.d/10-calico.conflist

# CNI binaries location
ls /opt/cni/bin/
```

---

## Key Takeaways

1. **Every pod gets its own IP** — this is the fundamental Kubernetes networking rule
2. **Services** provide stable IPs/DNS for ephemeral pods — know all 4 types
3. **ClusterIP** = internal, **NodePort** = external via node:port, **LoadBalancer** = cloud LB
4. **DNS format**: `<service>.<namespace>.svc.cluster.local` — memorize this
5. **Ingress** = HTTP routing — requires an Ingress Controller to be installed
6. **NetworkPolicy** = pod-level firewall — default is allow-all; any policy makes it deny-default
7. **AND vs OR** in NetworkPolicy `from`/`to` is the #1 exam trap — practice it
8. **Always allow DNS (port 53 UDP)** when using egress policies
9. Use `kubectl exec` + `nslookup`/`curl` to debug networking in the exam
