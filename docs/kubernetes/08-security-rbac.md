---
sidebar_position: 9
title: "08 · Security & RBAC"
---

# Security & RBAC

> **Exam relevance**: CKA ✅ (Cluster Architecture — 25%) | CKAD ✅ (Application Environment, Configuration and Security — 25%)

---

## Authentication vs Authorization

```
kubectl get pods
       │
       ▼
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Authentication  │ →  │  Authorization   │ →  │ Admission Control│ → etcd
│  "Who are you?"  │    │ "Can you do it?" │    │ "Is it valid?"   │
└─────────────────┘    └──────────────────┘    └──────────────────┘
```

### Authentication Methods

| Method | How It Works | Used By |
|--------|-------------|---------|
| **X.509 Client Certificates** | Client presents a certificate signed by the cluster CA | kubeadm users, components |
| **Bearer Tokens** | Token in HTTP header | ServiceAccounts |
| **OIDC** | External identity provider (Azure AD, Google, etc.) | Enterprise SSOs |
| **Webhook Token Auth** | External service validates tokens | Custom auth |

### Authorization Modes

| Mode | Description |
|------|-------------|
| **RBAC** | Role-Based Access Control (default, most common) |
| **ABAC** | Attribute-Based Access Control (legacy, rarely used) |
| **Node** | Special authorizer for kubelet requests |
| **Webhook** | External service makes authorization decisions |

Check current authorization mode:
```bash
kubectl describe pod kube-apiserver-controlplane -n kube-system | grep authorization-mode
# --authorization-mode=Node,RBAC
```

---

## RBAC — Role-Based Access Control

RBAC has four resource types that work in pairs:

```
Namespace-scoped:
  Role           ← Defines permissions (what you can do)
  RoleBinding    ← Assigns Role to a user/group/SA (who can do it)

Cluster-scoped:
  ClusterRole    ← Defines cluster-wide permissions
  ClusterRoleBinding ← Assigns ClusterRole to a user/group/SA
```

### Role — Namespace Permissions

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: development
rules:
- apiGroups: [""]                      # "" = core API group (pods, services, etc.)
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
- apiGroups: [""]
  resources: ["pods/log"]              # Sub-resource
  verbs: ["get"]
- apiGroups: ["apps"]                  # apps API group (deployments, etc.)
  resources: ["deployments"]
  verbs: ["get", "list", "create", "update", "delete"]
```

### Available Verbs

| Verb | HTTP Method | Description |
|------|------------|-------------|
| `get` | GET (single) | Read a specific resource |
| `list` | GET (collection) | List resources |
| `watch` | GET (watch) | Watch for changes |
| `create` | POST | Create a resource |
| `update` | PUT | Update a resource |
| `patch` | PATCH | Partially update |
| `delete` | DELETE | Delete a resource |
| `deletecollection` | DELETE | Delete multiple resources |

**Wildcard**: Use `"*"` to allow all verbs, all resources, or all API groups.

### RoleBinding — Assign Role to Subject

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods-dev
  namespace: development
subjects:
- kind: User                           # User, Group, or ServiceAccount
  name: jane
  apiGroup: rbac.authorization.k8s.io
- kind: ServiceAccount
  name: my-sa
  namespace: development               # Required for ServiceAccounts
roleRef:
  kind: Role                           # Role or ClusterRole
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### ClusterRole — Cluster-Wide Permissions

Same as Role but applies cluster-wide. Also needed for non-namespaced resources (nodes, PVs, namespaces).

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: node-reader                    # No namespace — cluster-scoped
rules:
- apiGroups: [""]
  resources: ["nodes"]                 # Nodes are cluster-scoped
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["persistentvolumes"]
  verbs: ["get", "list"]
```

### ClusterRoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-nodes
subjects:
- kind: Group
  name: platform-team
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: node-reader
  apiGroup: rbac.authorization.k8s.io
```

### Key Combinations

| Role Type | Binding Type | Result |
|-----------|-------------|--------|
| Role | RoleBinding | Permissions in a specific namespace |
| ClusterRole | RoleBinding | ClusterRole permissions but only in ONE namespace |
| ClusterRole | ClusterRoleBinding | Permissions across the entire cluster |

The middle option is useful: define permissions once in a ClusterRole, then bind in multiple namespaces with individual RoleBindings.

### Imperative RBAC Commands (Exam Speed)

```bash
# Create Role
kubectl create role pod-reader \
  --verb=get,list,watch \
  --resource=pods \
  -n development

# Create ClusterRole
kubectl create clusterrole node-reader \
  --verb=get,list,watch \
  --resource=nodes

# Create RoleBinding
kubectl create rolebinding read-pods \
  --role=pod-reader \
  --user=jane \
  -n development

# Bind a ClusterRole to a namespace
kubectl create rolebinding read-pods \
  --clusterrole=pod-reader \
  --serviceaccount=development:my-sa \
  -n development

# Create ClusterRoleBinding
kubectl create clusterrolebinding read-nodes \
  --clusterrole=node-reader \
  --group=platform-team

# Check permissions (can-i)
kubectl auth can-i get pods -n development
kubectl auth can-i get pods -n development --as=jane
kubectl auth can-i get nodes --as=system:serviceaccount:development:my-sa
kubectl auth can-i "*" "*"                           # Am I cluster-admin?
kubectl auth can-i --list --as=jane -n development   # List all permissions
```

### Built-in ClusterRoles

| ClusterRole | Permissions |
|-------------|-------------|
| `cluster-admin` | Full access to everything |
| `admin` | Full access within a namespace (no resource quotas or namespace itself) |
| `edit` | Read/write most resources in a namespace (no roles/rolebindings) |
| `view` | Read-only access to most resources in a namespace (no secrets) |

---

## Pod Security Admission (PSA)

Pod Security Admission replaced the deprecated PodSecurityPolicy. It enforces security standards at the namespace level.

### Security Profiles

| Profile | Description |
|---------|-------------|
| `privileged` | No restrictions (default) |
| `baseline` | Minimally restrictive. Prevents known privilege escalations. |
| `restricted` | Heavily restricted. Best practices for hardened workloads. |

### Enforcement Modes

| Mode | Behavior |
|------|----------|
| `enforce` | Reject pods that violate the policy |
| `audit` | Log violations but allow the pod |
| `warn` | Warn the user but allow the pod |

### Apply via Namespace Labels

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

```bash
# Apply via kubectl
kubectl label namespace production \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/warn=restricted
```

### What "restricted" Profile Requires

Pods in a `restricted` namespace must:
- Run as non-root (`runAsNonRoot: true`)
- Drop ALL capabilities
- Not use privileged containers
- Not allow privilege escalation
- Use read-only root filesystem (recommended)
- Set `seccompProfile` to `RuntimeDefault` or `Localhost`

```yaml
# Pod that passes "restricted" profile
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: myapp
    securityContext:
      allowPrivilegeEscalation: false
      capabilities:
        drop:
        - ALL
      readOnlyRootFilesystem: true
```

---

## Kubernetes Certificates & TLS

### Certificate Signing Requests (CSR)

Create a new user certificate via Kubernetes:

```bash
# 1. Generate private key
openssl genrsa -out jane.key 2048

# 2. Create CSR
openssl req -new -key jane.key -out jane.csr -subj "/CN=jane/O=developers"
# CN = username, O = group

# 3. Encode CSR in base64
cat jane.csr | base64 | tr -d '\n'
```

```yaml
# 4. Create Kubernetes CSR resource
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: jane-csr
spec:
  request: <base64-encoded-csr>
  signerName: kubernetes.io/kube-apiserver-client
  usages:
  - client auth
```

```bash
# 5. Approve the CSR
kubectl certificate approve jane-csr

# 6. Get the signed certificate
kubectl get csr jane-csr -o jsonpath='{.status.certificate}' | base64 -d > jane.crt

# 7. Configure kubectl for jane
kubectl config set-credentials jane --client-key=jane.key --client-certificate=jane.crt
kubectl config set-context jane-context --cluster=kubernetes --user=jane --namespace=development
kubectl config use-context jane-context
```

---

## Kubeconfig — Managing Cluster Access

The kubeconfig file (`~/.kube/config`) stores cluster connection details, user credentials, and contexts.

### Structure

```yaml
apiVersion: v1
kind: Config
current-context: my-context

clusters:                              # Cluster definitions
- name: production
  cluster:
    server: https://10.0.0.1:6443
    certificate-authority-data: <base64-ca-cert>

users:                                 # User credentials
- name: admin
  user:
    client-certificate-data: <base64-cert>
    client-key-data: <base64-key>
- name: developer
  user:
    token: <bearer-token>

contexts:                              # Cluster + User + Namespace combinations
- name: my-context
  context:
    cluster: production
    user: admin
    namespace: default
- name: dev-context
  context:
    cluster: production
    user: developer
    namespace: development
```

### Kubeconfig Commands

```bash
# View current config
kubectl config view
kubectl config view --minify           # Only current context

# List contexts
kubectl config get-contexts

# Switch context
kubectl config use-context dev-context

# Set default namespace for current context
kubectl config set-context --current --namespace=kube-system

# Add a new cluster/user/context
kubectl config set-cluster my-cluster --server=https://1.2.3.4:6443 --certificate-authority=ca.crt
kubectl config set-credentials my-user --client-certificate=user.crt --client-key=user.key
kubectl config set-context my-context --cluster=my-cluster --user=my-user --namespace=default
```

**Exam tip**: At the start of EVERY question, the exam gives you a `kubectl config use-context` command. Always run it before answering.

---

## Network Security — API Server Access Control

### Restricting API Server Access

The API server can be configured with:

```
--anonymous-auth=false                # Disable anonymous access
--authorization-mode=Node,RBAC        # Use RBAC
--enable-admission-plugins=...        # Admission controllers
--audit-log-path=/var/log/audit.log   # Audit logging
```

### Admission Controllers

Admission controllers intercept requests AFTER authentication/authorization but BEFORE the object is persisted:

| Controller | Purpose |
|-----------|---------|
| `NamespaceLifecycle` | Prevents creating resources in terminating namespaces |
| `LimitRanger` | Applies default resource limits |
| `ResourceQuota` | Enforces resource quotas |
| `PodSecurity` | Enforces pod security standards |
| `NodeRestriction` | Limits kubelet to modifying its own node and pods |
| `ServiceAccount` | Auto-creates default ServiceAccount |

```bash
# Check enabled admission controllers
kubectl describe pod kube-apiserver-controlplane -n kube-system | grep enable-admission
```

---

## Securing Images

### Private Registry Authentication

```bash
# Create registry secret
kubectl create secret docker-registry regcred \
  --docker-server=myregistry.io \
  --docker-username=user \
  --docker-password=pass \
  --docker-email=user@example.com
```

```yaml
# Use in pod
spec:
  imagePullSecrets:
  - name: regcred
  containers:
  - name: app
    image: myregistry.io/myapp:v1
```

### Image Pull Policies

| Policy | Behavior |
|--------|----------|
| `Always` | Always pull (default if tag is `:latest` or no tag) |
| `IfNotPresent` | Pull only if not on node (default for specific tags) |
| `Never` | Never pull — image must already exist on node |

---

## Key Takeaways

1. **RBAC** = Role + RoleBinding (namespace) or ClusterRole + ClusterRoleBinding (cluster)
2. **`kubectl auth can-i`** is the fastest way to verify permissions — use `--as` to test for others
3. **ClusterRole + RoleBinding** = reusable permissions scoped to a namespace
4. **ServiceAccounts** are how pods authenticate — always use dedicated SAs with minimal permissions
5. **Pod Security Admission** replaces PodSecurityPolicy — applied via namespace labels
6. **`restricted`** profile = non-root, drop all capabilities, no privilege escalation
7. **Kubeconfig** has clusters + users + contexts — `kubectl config use-context` before every exam question
8. Know the **CSR approval flow** — generate key → create CSR → approve → extract cert
9. **Admission controllers** enforce policies at the API server level
