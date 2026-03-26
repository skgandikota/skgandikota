---
sidebar_position: 13
title: "12 · Helm & Kustomize"
---

# Helm & Kustomize

> **Exam relevance**: CKA ✅ (Allowed resource: helm.sh/docs) | CKAD ✅ (Application Deployment — 20%)

---

## Helm — The Kubernetes Package Manager

Helm packages Kubernetes resources into **charts** — reusable, versioned bundles of YAML templates.

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Chart** | A package of Kubernetes resources (templates + values) |
| **Release** | A specific installation of a chart on a cluster |
| **Repository** | A collection of charts (like npm registry) |
| **Values** | Configuration that customizes a chart installation |
| **Revision** | A version of a release (created on install/upgrade) |

### Repository Management

```bash
# Add a repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx

# Update repo index (like apt update)
helm repo update

# List repos
helm repo list

# Search for charts
helm search repo nginx
helm search repo bitnami/mysql --versions      # Show all versions

# Search Artifact Hub (public charts)
helm search hub wordpress
```

### Installing Charts

```bash
# Basic install
helm install my-release bitnami/nginx

# Install with custom values
helm install my-release bitnami/nginx --set replicaCount=3

# Install with values file
helm install my-release bitnami/nginx -f custom-values.yaml

# Install in a specific namespace
helm install my-release bitnami/nginx -n production --create-namespace

# Dry run (show what would be created without applying)
helm install my-release bitnami/nginx --dry-run

# Generate template output (just render YAML, don't install)
helm template my-release bitnami/nginx > rendered.yaml

# Install specific version
helm install my-release bitnami/nginx --version 15.0.0
```

### Managing Releases

```bash
# List installed releases
helm list
helm list -A                               # All namespaces
helm list -n production

# Check release status
helm status my-release

# Get release values
helm get values my-release                 # User-supplied values
helm get values my-release --all           # All values (defaults + overrides)

# Get all manifests for a release
helm get manifest my-release

# Get release history
helm history my-release
```

### Upgrading Releases

```bash
# Upgrade with new image tag
helm upgrade my-release bitnami/nginx --set image.tag=1.26

# Upgrade with values file
helm upgrade my-release bitnami/nginx -f updated-values.yaml

# Install if not exists, upgrade if exists
helm upgrade --install my-release bitnami/nginx

# Reuse previous values and add new ones
helm upgrade my-release bitnami/nginx --reuse-values --set replicaCount=5
```

### Rollback

```bash
# View history
helm history my-release
# REVISION    STATUS      DESCRIPTION
# 1           superseded  Install complete
# 2           superseded  Upgrade complete
# 3           deployed    Upgrade complete

# Rollback to revision 2
helm rollback my-release 2

# Rollback to previous version
helm rollback my-release
```

### Uninstalling

```bash
# Uninstall a release
helm uninstall my-release

# Uninstall but keep history (allows rollback)
helm uninstall my-release --keep-history
```

### Overriding Values

Values can be set three ways (in order of precedence):

```bash
# 1. --set flag (highest precedence)
helm install my-release bitnami/nginx \
  --set replicaCount=3 \
  --set service.type=NodePort \
  --set "resources.limits.cpu=500m"

# 2. -f values file
helm install my-release bitnami/nginx -f my-values.yaml

# 3. Default values.yaml in the chart (lowest precedence)
```

Custom values file example:
```yaml
# my-values.yaml
replicaCount: 3
service:
  type: NodePort
  port: 80
resources:
  limits:
    cpu: 500m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi
```

### Viewing Chart Details

```bash
# Show chart info
helm show chart bitnami/nginx

# Show default values (important for knowing what you can override)
helm show values bitnami/nginx

# Show everything
helm show all bitnami/nginx
```

---

## Kustomize — Template-Free Customization

Kustomize lets you customize Kubernetes YAML without templates. It uses **overlays** and **patches** to modify base configurations.

Built into kubectl since v1.14:
```bash
kubectl apply -k <directory>           # Apply kustomized resources
kubectl kustomize <directory>          # Preview the output
```

### Basic Structure

```
myapp/
├── base/
│   ├── kustomization.yaml
│   ├── deployment.yaml
│   └── service.yaml
└── overlays/
    ├── dev/
    │   └── kustomization.yaml
    └── production/
        ├── kustomization.yaml
        └── increase-replicas.yaml
```

### Base kustomization.yaml

```yaml
# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- deployment.yaml
- service.yaml
```

```yaml
# base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp
spec:
  replicas: 1
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
        ports:
        - containerPort: 80
```

### Dev Overlay

```yaml
# overlays/dev/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ../../base                           # Reference the base

namePrefix: dev-                       # Add prefix to all resource names
namespace: development                 # Set namespace for all resources

commonLabels:
  environment: dev                     # Add label to all resources

# Override image
images:
- name: nginx
  newTag: "1.25-alpine"
```

### Production Overlay

```yaml
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ../../base

namePrefix: prod-
namespace: production

commonLabels:
  environment: production

# Patch to increase replicas
patches:
- path: increase-replicas.yaml

images:
- name: nginx
  newTag: "1.25"
```

```yaml
# overlays/production/increase-replicas.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp                          # Must match the base resource name
spec:
  replicas: 5
```

### Apply Kustomized Resources

```bash
# Preview what will be applied
kubectl kustomize overlays/dev/

# Apply dev overlay
kubectl apply -k overlays/dev/

# Apply production overlay
kubectl apply -k overlays/production/

# Delete
kubectl delete -k overlays/dev/
```

### Common Kustomize Transformations

```yaml
# kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- deployment.yaml

# Add prefix/suffix to names
namePrefix: staging-
nameSuffix: -v2

# Set namespace
namespace: staging

# Add labels to all resources
commonLabels:
  team: platform

# Add annotations
commonAnnotations:
  managed-by: kustomize

# Override images
images:
- name: nginx
  newName: myregistry.io/nginx
  newTag: "2.0"

# Generate ConfigMaps
configMapGenerator:
- name: app-config
  literals:
  - DB_HOST=mysql
  - LOG_LEVEL=info

# Generate Secrets
secretGenerator:
- name: db-creds
  literals:
  - password=s3cret
```

### Patches — Two Styles

**Strategic Merge Patch** (merge with the target):
```yaml
# patches:
# - path: patch.yaml
# In patch.yaml:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp
spec:
  replicas: 5
  template:
    spec:
      containers:
      - name: webapp
        resources:
          limits:
            memory: "512Mi"
```

**JSON Patch** (precise operations):
```yaml
patches:
- target:
    kind: Deployment
    name: webapp
  patch: |-
    - op: replace
      path: /spec/replicas
      value: 5
    - op: add
      path: /spec/template/spec/containers/0/resources
      value:
        limits:
          memory: "512Mi"
```

---

## Helm vs Kustomize

| Feature | Helm | Kustomize |
|---------|------|-----------|
| Approach | Templates (Go templating) | Overlays (patch base YAML) |
| Complexity | Higher (template syntax) | Lower (plain YAML) |
| Packaging | Charts (distributable) | Directories (must share source) |
| Versioning | Chart versions + app versions | Git-based |
| Release management | Yes (install, upgrade, rollback) | No (just kubectl apply) |
| Dependencies | Chart dependencies | Resource references |
| Built into kubectl | No (separate binary) | Yes (`kubectl -k`) |
| Best for | Third-party apps, complex parameterization | In-house apps, environment overlays |

**In practice, many teams use both**: Helm for third-party charts, Kustomize for in-house applications.

---

## Exam Tips for Helm & Kustomize

### CKA
- Know `helm install`, `helm upgrade`, `helm rollback`, `helm uninstall`
- Know `helm list`, `helm history`, `helm get values`
- helm.sh/docs is an allowed reference

### CKAD
- Know all Helm operations above
- Know `kubectl apply -k` and `kubectl kustomize`
- Know how to create a basic kustomization.yaml
- Know how to override images, add labels, set namespace

### Quick Reference Commands

```bash
# Helm: install something
helm install myapp bitnami/nginx --set replicaCount=3 -n myns --create-namespace

# Helm: upgrade
helm upgrade myapp bitnami/nginx --set replicaCount=5

# Helm: rollback
helm rollback myapp 1

# Helm: check what's installed
helm list -A

# Kustomize: apply
kubectl apply -k ./overlays/production/

# Kustomize: preview
kubectl kustomize ./overlays/production/
```

---

## Key Takeaways

1. **Helm** = package manager with charts, releases, repositories — good for third-party apps
2. **`helm install`**, **`helm upgrade`**, **`helm rollback`** — the three core operations
3. **`helm get values`** shows current configuration; `--all` shows defaults too
4. **`--dry-run`** to preview; **`helm template`** to render YAML without applying
5. **Kustomize** = template-free overlays built into kubectl
6. **`kubectl apply -k`** applies kustomized resources; **`kubectl kustomize`** previews them
7. Kustomize excels at **environment overlays** (dev/staging/prod from a single base)
8. **`configMapGenerator`** and **`secretGenerator`** in Kustomize auto-create and hash names
9. Both tools can coexist — use Helm for third-party, Kustomize for in-house
