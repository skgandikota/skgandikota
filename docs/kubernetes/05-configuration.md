---
sidebar_position: 6
title: "05 · Configuration"
---

# Configuration

> **Exam relevance**: CKA ✅ | CKAD ✅ (Application Environment, Configuration and Security — 25%)

---

## ConfigMaps — Externalize Configuration

ConfigMaps store non-confidential key-value pairs. They decouple configuration from container images.

### Creating ConfigMaps

```bash
# From literals
kubectl create configmap app-config \
  --from-literal=DB_HOST=mysql.default.svc \
  --from-literal=DB_PORT=3306 \
  --from-literal=LOG_LEVEL=info

# From a file
kubectl create configmap nginx-config --from-file=nginx.conf

# From a file with custom key name
kubectl create configmap nginx-config --from-file=my-config=nginx.conf

# From a directory (each file becomes a key)
kubectl create configmap app-config --from-file=./config-dir/

# From env file
kubectl create configmap app-config --from-env-file=app.env
```

### ConfigMap YAML

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DB_HOST: "mysql.default.svc"
  DB_PORT: "3306"
  LOG_LEVEL: "info"
  app.properties: |            # Multi-line value (for config files)
    server.port=8080
    server.context-path=/api
    logging.level.root=INFO
```

### Using ConfigMaps in Pods

**Method 1: Environment variables (individual keys)**
```yaml
spec:
  containers:
  - name: app
    image: myapp
    env:
    - name: DATABASE_HOST              # Env var name in container
      valueFrom:
        configMapKeyRef:
          name: app-config             # ConfigMap name
          key: DB_HOST                 # Key in ConfigMap
    - name: DATABASE_PORT
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: DB_PORT
```

**Method 2: Environment variables (all keys at once)**
```yaml
spec:
  containers:
  - name: app
    image: myapp
    envFrom:
    - configMapRef:
        name: app-config               # All keys become env vars
      prefix: APP_                     # Optional: prefix all keys with APP_
```

**Method 3: Volume mount (as files)**
```yaml
spec:
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config           # Each key becomes a file
  volumes:
  - name: config-volume
    configMap:
      name: app-config
```

With the volume mount, each key becomes a file:
```
/etc/config/DB_HOST          → contains "mysql.default.svc"
/etc/config/DB_PORT          → contains "3306"
/etc/config/app.properties   → contains the multi-line content
```

**Method 4: Mount specific keys only**
```yaml
volumes:
- name: config-volume
  configMap:
    name: app-config
    items:
    - key: app.properties
      path: application.properties     # Custom filename
```

### ConfigMap Updates

- **Volume mounts**: Updated automatically (with a delay of ~1 minute). The kubelet syncs mounted ConfigMaps.
- **Environment variables**: NOT updated. You must restart the pod.

---

## Secrets — Sensitive Configuration

Secrets store sensitive data: passwords, tokens, TLS certificates. They are base64-encoded (NOT encrypted by default).

### Creating Secrets

```bash
# Generic secret from literals
kubectl create secret generic db-creds \
  --from-literal=username=admin \
  --from-literal=password=s3cretP@ss

# From file
kubectl create secret generic tls-cert --from-file=cert.pem --from-file=key.pem

# TLS secret (special type)
kubectl create secret tls my-tls --cert=cert.pem --key=key.pem

# Docker registry secret
kubectl create secret docker-registry regcred \
  --docker-server=registry.example.com \
  --docker-username=user \
  --docker-password=pass
```

### Secret YAML

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-creds
type: Opaque                           # Generic secret
data:                                  # Base64-encoded values
  username: YWRtaW4=                   # echo -n "admin" | base64
  password: czNjcmV0UEBzcw==          # echo -n "s3cretP@ss" | base64
```

If you don't want to base64-encode manually, use `stringData`:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-creds
type: Opaque
stringData:                            # Plain text — Kubernetes encodes it
  username: admin
  password: s3cretP@ss
```

### Secret Types

| Type | Use |
|------|-----|
| `Opaque` | Generic key-value pairs (default) |
| `kubernetes.io/tls` | TLS certificate and key |
| `kubernetes.io/dockerconfigjson` | Docker registry credentials |
| `kubernetes.io/basic-auth` | Username/password |
| `kubernetes.io/ssh-auth` | SSH private key |
| `kubernetes.io/service-account-token` | ServiceAccount token (auto-created) |

### Using Secrets in Pods

Exactly the same patterns as ConfigMaps:

**As environment variables:**
```yaml
spec:
  containers:
  - name: app
    image: myapp
    env:
    - name: DB_USERNAME
      valueFrom:
        secretKeyRef:
          name: db-creds
          key: username
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-creds
          key: password
```

**As all env vars at once:**
```yaml
    envFrom:
    - secretRef:
        name: db-creds
```

**As volume mount:**
```yaml
spec:
  containers:
  - name: app
    image: myapp
    volumeMounts:
    - name: secret-volume
      mountPath: /etc/secrets
      readOnly: true                   # Good practice
  volumes:
  - name: secret-volume
    secret:
      secretName: db-creds
      defaultMode: 0400               # File permissions (read-only by owner)
```

### Base64 Commands (Exam)

```bash
# Encode
echo -n "admin" | base64
# YWRtaW4=

# Decode
echo "YWRtaW4=" | base64 -d
# admin

# View secret values
kubectl get secret db-creds -o jsonpath='{.data.password}' | base64 -d
```

### Security Note

Secrets are base64-encoded, NOT encrypted. To actually encrypt secrets at rest:
- Enable encryption at rest in the API server (`--encryption-provider-config`)
- Use external secret managers (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault)
- In the exam, you won't need to configure encryption — just know that base64 ≠ encryption

---

## Environment Variables

Three ways to set env vars:

```yaml
spec:
  containers:
  - name: app
    image: myapp
    env:
    # 1. Direct value
    - name: ENV
      value: "production"

    # 2. From ConfigMap
    - name: DB_HOST
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: DB_HOST

    # 3. From Secret
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-creds
          key: password

    # 4. From Pod/Container fields (Downward API)
    - name: POD_NAME
      valueFrom:
        fieldRef:
          fieldPath: metadata.name
    - name: POD_IP
      valueFrom:
        fieldRef:
          fieldPath: status.podIP
    - name: NODE_NAME
      valueFrom:
        fieldRef:
          fieldPath: spec.nodeName
    - name: CPU_LIMIT
      valueFrom:
        resourceFieldRef:
          containerName: app
          resource: limits.cpu
```

---

## SecurityContext — Container Security Settings

SecurityContext controls security-related settings at the **Pod level** and **container level**.

### Pod-Level SecurityContext

Applies to ALL containers in the pod:

```yaml
spec:
  securityContext:
    runAsUser: 1000                    # UID to run containers as
    runAsGroup: 3000                   # GID to run containers as
    fsGroup: 2000                      # GID for volume mounts
    runAsNonRoot: true                 # Reject containers that try to run as root
    supplementalGroups: [4000]         # Additional GIDs
```

### Container-Level SecurityContext

Overrides pod-level settings for a specific container:

```yaml
spec:
  containers:
  - name: app
    image: myapp
    securityContext:
      runAsUser: 1000
      runAsNonRoot: true
      readOnlyRootFilesystem: true     # Container can't write to its filesystem
      allowPrivilegeEscalation: false  # Prevent gaining more privileges
      capabilities:
        drop:
        - ALL                          # Drop all Linux capabilities
        add:
        - NET_BIND_SERVICE             # Add back only what's needed
      privileged: false                # Don't run in privileged mode
```

### Common Exam Patterns

**Run as non-root user:**
```yaml
spec:
  securityContext:
    runAsUser: 1000
    runAsNonRoot: true
  containers:
  - name: app
    image: nginx
    securityContext:
      allowPrivilegeEscalation: false
```

**Read-only filesystem with writable temp dir:**
```yaml
spec:
  containers:
  - name: app
    image: myapp
    securityContext:
      readOnlyRootFilesystem: true
    volumeMounts:
    - name: tmp
      mountPath: /tmp
  volumes:
  - name: tmp
    emptyDir: {}
```

---

## ServiceAccounts

Every pod runs as a ServiceAccount. ServiceAccounts provide an identity for pods to authenticate with the API server.

### Default Behavior

- Every namespace has a `default` ServiceAccount
- Every pod uses the `default` ServiceAccount unless you specify another
- Since Kubernetes 1.24, tokens are NOT auto-mounted — you must request them

### Creating and Using ServiceAccounts

```bash
# Create
kubectl create serviceaccount my-sa

# View
kubectl get serviceaccounts
kubectl describe serviceaccount my-sa
```

```yaml
# Use in a pod
spec:
  serviceAccountName: my-sa            # Use this ServiceAccount
  automountServiceAccountToken: true   # Mount the API token (default: true)
  containers:
  - name: app
    image: myapp
```

### Disable Auto-Mounting (Security Best Practice)

If your pod doesn't need to talk to the Kubernetes API:

```yaml
spec:
  serviceAccountName: my-sa
  automountServiceAccountToken: false   # Don't mount the token
```

### Bound Service Account Tokens (1.24+)

Since Kubernetes 1.24, long-lived tokens are deprecated. Use bound tokens instead:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  serviceAccountName: my-sa
  containers:
  - name: app
    image: myapp
    volumeMounts:
    - name: sa-token
      mountPath: /var/run/secrets/tokens
  volumes:
  - name: sa-token
    projected:
      sources:
      - serviceAccountToken:
          path: token
          expirationSeconds: 3600       # Token expires after 1 hour
          audience: api                 # Optional: intended audience
```

### Image Pull Secrets with ServiceAccounts

```bash
# Create registry secret
kubectl create secret docker-registry regcred \
  --docker-server=registry.example.com \
  --docker-username=user \
  --docker-password=pass

# Attach to ServiceAccount
kubectl patch serviceaccount my-sa \
  -p '{"imagePullSecrets": [{"name": "regcred"}]}'
```

Now all pods using `my-sa` automatically use these registry credentials.

---

## Downward API — Pod Metadata as Config

The Downward API exposes pod/container metadata to containers as env vars or files.

### As Environment Variables

```yaml
env:
- name: POD_NAME
  valueFrom:
    fieldRef:
      fieldPath: metadata.name
- name: POD_NAMESPACE
  valueFrom:
    fieldRef:
      fieldPath: metadata.namespace
- name: POD_IP
  valueFrom:
    fieldRef:
      fieldPath: status.podIP
- name: NODE_NAME
  valueFrom:
    fieldRef:
      fieldPath: spec.nodeName
- name: SERVICE_ACCOUNT
  valueFrom:
    fieldRef:
      fieldPath: spec.serviceAccountName
- name: CPU_REQUEST
  valueFrom:
    resourceFieldRef:
      containerName: app
      resource: requests.cpu
- name: MEM_LIMIT
  valueFrom:
    resourceFieldRef:
      containerName: app
      resource: limits.memory
```

### As Volume Files

```yaml
volumes:
- name: podinfo
  downwardAPI:
    items:
    - path: "labels"
      fieldRef:
        fieldPath: metadata.labels
    - path: "annotations"
      fieldRef:
        fieldPath: metadata.annotations
```

---

## Immutable ConfigMaps and Secrets

Marking a ConfigMap or Secret as immutable prevents edits and improves performance (Kubernetes doesn't need to watch for changes):

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  key: value
immutable: true                # Cannot be modified after creation
```

To change an immutable ConfigMap/Secret, you must delete and recreate it.

---

## Key Takeaways

1. **ConfigMaps** for non-sensitive config; **Secrets** for sensitive data
2. Three consumption methods: env vars (single key), envFrom (all keys), volume mount (as files)
3. Volume-mounted ConfigMaps **auto-update**; env vars do **NOT**
4. Secrets are **base64-encoded, not encrypted** — remember this distinction
5. **SecurityContext** at pod level applies to all containers; container level overrides pod level
6. `runAsNonRoot: true` + `allowPrivilegeEscalation: false` + `readOnlyRootFilesystem: true` = secure container
7. **ServiceAccounts** give pods an identity — use dedicated SAs, don't use `default`
8. **`automountServiceAccountToken: false`** when the pod doesn't need API access
9. **`--dry-run=client -o yaml`** is the fastest way to generate ConfigMap/Secret YAML in the exam
