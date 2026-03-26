---
sidebar_position: 14
title: "13 · Exam Tips & Speed"
---

# Exam Tips & Speed

> **Applies to both CKA and CKAD exams**

---

## Exam Environment

### What You Get
- A Linux terminal with `kubectl`, `helm`, `etcdctl`, `crictl`, `kubeadm` pre-installed
- Access to one or more Kubernetes clusters (you switch between them per question)
- A built-in browser to access **kubernetes.io/docs**, **kubernetes.io/blog**, and **helm.sh/docs** (ONLY these sites)
- A notepad for scratch work
- Copy/paste works (use Ctrl+Shift+C / Ctrl+Shift+V in the terminal)

### What You Can't Do
- No access to any other websites
- No access to your own bookmarks or notes
- No second monitor
- No local files or cheat sheets

---

## First 2 Minutes — Setup Your Environment

Run these immediately when the exam starts:

```bash
# 1. Set up aliases
alias k=kubectl
alias kgp='kubectl get pods'
alias kgs='kubectl get svc'
alias kgn='kubectl get nodes'
alias kd='kubectl describe'
alias kaf='kubectl apply -f'

# 2. Enable kubectl autocompletion
source <(kubectl completion bash)
complete -o default -F __start_kubectl k    # Autocomplete works with alias too

# 3. Set default editor (optional — vi is default)
export EDITOR=vim
# or if you prefer nano:
# export EDITOR=nano

# 4. Quick YAML generation shortcut
export do='--dry-run=client -o yaml'
# Now you can: kubectl run nginx --image=nginx $do > pod.yaml
```

### vim Essentials (The Default Editor)

If you're not comfortable with vim, learn these minimum commands:

```
i           → Enter insert mode (start typing)
Esc         → Exit insert mode
:wq         → Save and quit
:q!         → Quit without saving
dd          → Delete a line
yy          → Copy a line
p           → Paste below
u           → Undo
/text       → Search for "text"
n           → Next search result
:set number → Show line numbers
:set paste  → Paste without auto-indent mess (IMPORTANT)
```

Set up vim configuration:
```bash
# Add to ~/.vimrc
cat >> ~/.vimrc << 'EOF'
set tabstop=2
set shiftwidth=2
set expandtab
set number
set autoindent
EOF
```

---

## The YAML Generation Strategy

The fastest exam strategy is: **generate YAML with `--dry-run`, then edit**.

Never write YAML from scratch. Always start from a generated template.

### Pod
```bash
k run nginx --image=nginx $do > pod.yaml
```

### Deployment
```bash
k create deployment webapp --image=nginx --replicas=3 $do > deploy.yaml
```

### Service
```bash
k expose deployment webapp --port=80 --target-port=8080 --type=NodePort $do > svc.yaml
```

### Job
```bash
k create job backup --image=busybox $do -- sh -c "echo done" > job.yaml
```

### CronJob
```bash
k create cronjob cleanup --image=busybox --schedule="0 * * * *" $do -- sh -c "echo clean" > cj.yaml
```

### ConfigMap
```bash
k create configmap myconfig --from-literal=key=value $do > cm.yaml
```

### Secret
```bash
k create secret generic mysecret --from-literal=pass=s3cret $do > secret.yaml
```

### Role & RoleBinding
```bash
k create role pod-reader --verb=get,list --resource=pods $do > role.yaml
k create rolebinding read-pods --role=pod-reader --user=jane $do > rb.yaml
```

### ClusterRole & ClusterRoleBinding
```bash
k create clusterrole node-reader --verb=get,list --resource=nodes $do > cr.yaml
k create clusterrolebinding read-nodes --clusterrole=node-reader --user=jane $do > crb.yaml
```

### ServiceAccount
```bash
k create sa my-sa $do > sa.yaml
```

### Ingress
```bash
k create ingress myingress --rule="app.example.com/=webapp-svc:80" $do > ing.yaml
```

### Namespace
```bash
k create ns development $do > ns.yaml
```

### PDB
```bash
k create pdb my-pdb --selector=app=webapp --min-available=2
```

---

## Time Management Strategy

### CKA: 2 hours, ~17 questions

| Phase | Time | What |
|-------|------|------|
| Setup | 2 min | Aliases, autocompletion, vim config |
| First pass | 90 min | Answer all questions sequentially. Skip anything taking > 8 min. |
| Second pass | 25 min | Return to skipped questions |
| Review | 3 min | Check flagged answers |

### CKAD: 2 hours, ~16 questions

Same strategy. Average ~7 minutes per question.

### Scoring Tips
- Questions are weighted differently (some are worth 4%, others 13%)
- **Do high-weight questions first** if you can identify them
- **Don't get stuck** — if you've spent 8+ minutes, flag it and move on
- A partially correct answer still gets partial credit
- 66% to pass — you can afford to miss 34%

---

## Kubernetes.io Docs — Navigation Bookmarks

You can access kubernetes.io during the exam. Know where to find things quickly:

| Topic | URL Path |
|-------|----------|
| **kubectl Cheat Sheet** | `/docs/reference/kubectl/cheatsheet/` — **BOOKMARK THIS FIRST** |
| Pod spec | `/docs/reference/kubernetes-api/workload-resources/pod-v1/` |
| NetworkPolicy | `/docs/concepts/services-networking/network-policies/` |
| PV/PVC | `/docs/concepts/storage/persistent-volumes/` |
| RBAC | `/docs/reference/access-authn-authz/rbac/` |
| Ingress | `/docs/concepts/services-networking/ingress/` |
| etcd backup | `/docs/tasks/administer-cluster/configure-upgrade-etcd/` |
| kubeadm upgrade | `/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/` |
| SecurityContext | `/docs/tasks/configure-pod-container/security-context/` |
| Probes | `/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/` |
| Resource Quotas | `/docs/concepts/policy/resource-quotas/` |
| Static Pods | `/docs/tasks/configure-pod-container/static-pod/` |
| Scheduling | `/docs/concepts/scheduling-eviction/` |

**Pro tip**: Use the docs search bar (top of the page) — it's faster than navigating.

---

## Common Exam Patterns & Quick Solutions

### "Create a pod with specific requirements"
```bash
k run mypod --image=nginx $do > pod.yaml
vim pod.yaml     # Add whatever they ask: labels, resources, volumes, etc.
k apply -f pod.yaml
```

### "Fix a broken deployment/pod"
```bash
k describe pod <name>        # Read events
k logs <name> --previous     # If CrashLoopBackOff
k get pod <name> -o yaml     # Check full spec for issues
k edit deployment <name>     # Fix in place
```

### "Create a NetworkPolicy"
```bash
# Start from docs — search "network policy" on kubernetes.io
# Copy the example, modify selectors and ports
```

### "Backup/Restore etcd"
```bash
# Backup (memorize the flags)
ETCDCTL_API=3 etcdctl snapshot save /tmp/backup.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# Restore
ETCDCTL_API=3 etcdctl snapshot restore /tmp/backup.db \
  --data-dir=/var/lib/etcd-new
# Update etcd manifest to point to /var/lib/etcd-new
```

### "Upgrade the cluster"
```bash
# Control plane: upgrade kubeadm → plan → apply → upgrade kubelet → restart
# Worker: drain → SSH → upgrade kubeadm → node → kubelet → restart → uncordon
```

### "Create RBAC for a user/SA"
```bash
k create role myrole --verb=get,list --resource=pods -n dev
k create rolebinding mybinding --role=myrole --serviceaccount=dev:mysa -n dev
k auth can-i get pods -n dev --as=system:serviceaccount:dev:mysa
```

### "Expose a deployment"
```bash
k expose deployment webapp --port=80 --target-port=8080 --type=NodePort
```

### "Create a PV and PVC"
```bash
# PV — copy from docs, modify capacity, path, accessModes
# PVC — match storageClassName, accessModes, and request size
```

### "Scale a deployment"
```bash
k scale deployment webapp --replicas=5
```

### "Create a sidecar/init container"
```bash
k run mypod --image=nginx $do > pod.yaml
vim pod.yaml     # Add initContainers or second container
k apply -f pod.yaml
```

---

## Speed Shortcuts

### Delete without waiting
```bash
k delete pod mypod --grace-period=0 --force
```

### Quick replace (delete + create)
```bash
k replace --force -f pod.yaml
```

### One-liner pod for testing
```bash
k run test --image=busybox --restart=Never --rm -it -- wget -qO- http://myservice
```

### Check resource quickly
```bash
k get pod -o wide                      # IPs and nodes
k get pod -o yaml | grep -A5 image     # Quick field check
k get pod --show-labels                # See all labels
```

### Find which node a pod is on
```bash
k get pod <name> -o jsonpath='{.spec.nodeName}'
```

### Get pod IP
```bash
k get pod <name> -o jsonpath='{.status.podIP}'
```

### Get all images in a namespace
```bash
k get pods -o jsonpath='{.items[*].spec.containers[*].image}'
```

### Count resources
```bash
k get pods --no-headers | wc -l
k get pods -l app=myapp --no-headers | wc -l
```

---

## Jsonpath Quick Reference (Exam Useful)

```bash
# Single field
k get pod myapp -o jsonpath='{.metadata.name}'

# Nested field
k get pod myapp -o jsonpath='{.spec.containers[0].image}'

# All items
k get pods -o jsonpath='{.items[*].metadata.name}'

# Range (loop)
k get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.addresses[0].address}{"\n"}{end}'

# Filter
k get pods -o jsonpath='{.items[?(@.status.phase=="Running")].metadata.name}'

# Custom columns (alternative to jsonpath for tables)
k get pods -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,IP:.status.podIP
```

---

## Pre-Exam Checklist

### Technical Prep (Last 2 Weeks)
- [ ] Complete 2 killer.sh sessions (free with exam purchase)
- [ ] Practice creating every resource type imperatively
- [ ] Practice etcd backup/restore from memory
- [ ] Practice kubeadm upgrade from memory
- [ ] Practice NetworkPolicy (AND vs OR trap)
- [ ] Practice RBAC (role → rolebinding → can-i verification)
- [ ] Practice troubleshooting: broken node, broken pod, broken service
- [ ] Can you solve most tasks in under 7 minutes?

### Day of Exam
- [ ] Stable internet connection
- [ ] Quiet room, clean desk (proctor will check)
- [ ] Government-issued ID ready
- [ ] Close all unnecessary apps
- [ ] Use Chrome or Chromium browser (required by PSI)
- [ ] Have water nearby (allowed)

### First 2 Minutes of Exam
- [ ] Run alias + autocompletion setup
- [ ] Set up .vimrc
- [ ] Verify `kubectl get nodes` works
- [ ] Read the FIRST question carefully — check namespace

---

## Key Takeaways

1. **Setup aliases and autocompletion first** — saves 10+ minutes across the exam
2. **`$do` shortcut** (`--dry-run=client -o yaml`) is your best friend
3. **Never write YAML from scratch** — generate then edit
4. **Skip questions taking > 8 minutes** — come back later
5. **Always check the question's namespace** — #1 cause of lost marks
6. **`kubectl explain`** for field names, **kubernetes.io** for examples
7. **Use vim `:set paste`** before pasting YAML to avoid indent issues
8. **Partial credit exists** — a partially correct answer is better than blank
9. **66% to pass** — you can miss a third of the exam and still pass
10. **Practice speed, not just knowledge** — knowing is not enough, doing it fast is
