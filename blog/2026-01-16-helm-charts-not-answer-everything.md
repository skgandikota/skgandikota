---
slug: helm-charts-not-answer-everything
title: "Helm Charts Are Not the Answer to Everything"
authors: [saikoushik]
tags: [kubernetes, devops]
---

Helm is the de facto package manager for Kubernetes. It's powerful, widely adopted, and the first tool most teams reach for.

It's also overused, over-complicated, and sometimes the wrong tool entirely.

<!-- truncate -->

## When Helm Shines

### Complex, Reusable Applications
Installing Prometheus, NGINX Ingress, or cert-manager? Helm is perfect. These are complex systems with many resources and sensible defaults. Helm's templating and values system lets you customise without understanding every YAML file.

### Third-Party Software
When you're installing something you didn't build, Helm charts maintained by the vendor or community are the easiest path.

### Consistent Multi-Environment Deployment
One chart, different values per environment. `values-dev.yaml`, `values-prod.yaml`. This works well for applications that are identical except for configuration.

## When Helm Is the Wrong Choice

### Simple Applications
If your app is a Deployment, Service, and Ingress, you don't need Helm. Plain YAML with Kustomize overlays is simpler, more readable, and easier to debug.

Helm for 3 YAML files is like using a crane to hang a picture frame.

### When You Need Logic
Helm templates are Go templates. Writing complex logic in Go templates is painful:

```yaml
{{- if and .Values.ingress.enabled (not .Values.ingress.className) }}
{{- if semverCompare ">=1.18-0" .Capabilities.KubeVersion.GitVersion }}
{{- if not (hasKey .Values.ingress.annotations "kubernetes.io/ingress.class") }}
```

If your chart has more conditionals than resources, you've outgrown Helm. Consider Pulumi, cdk8s, or a custom operator.

### When Teams Can't Read Templates

I've seen teams afraid to touch their own Helm charts because the templating got too complex. If your deployment tool is a black box to the team deploying with it, that's a problem.

## The Alternatives

| Tool | Best For | Learning Curve |
|------|----------|---------------|
| **Kustomize** | Simple overlays, built into kubectl | Low |
| **Helm** | Complex third-party installations | Medium |
| **cdk8s** | Programmatic K8s manifests (TypeScript/Python) | Medium-High |
| **Pulumi** | Full infrastructure + K8s from real programming languages | High |
| **Jsonnet** | Data-templating with logic | High |

## My Rule of Thumb

- **Installing third-party software** → Helm
- **Your own simple app** → Kustomize
- **Your own complex platform** → cdk8s or Pulumi
- **Everything needs some customisation** → Kustomize with Helm for the complex parts

The best tool is the one your team can understand and maintain. Complexity in the deployment layer is a tax you pay on every change.

---

*What's your go-to for Kubernetes deployments? [Let me know on LinkedIn](https://linkedin.com/in/saikoushikg).*
