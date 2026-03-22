---
slug: observability-is-not-monitoring
title: "Observability Is Not Monitoring — Here's the Difference That Matters"
authors: [saikoushik]
tags: [devops, observability, sre]
---

"We have observability — we use Grafana dashboards."

No. You have monitoring. And there's a critical difference that most teams miss until their first major incident.

<!-- truncate -->

## Monitoring vs Observability

**Monitoring** answers: "Is this thing working?"
- CPU at 80%? Alert.
- Response time > 2s? Alert.
- Error rate > 1%? Alert.

**Observability** answers: "WHY is this thing broken?"
- Which specific requests are slow?
- What changed between yesterday (working) and today (broken)?
- Which downstream dependency is causing the cascade?

Monitoring tells you there's a fire. Observability helps you find the room it's in.

## The Three Pillars (And Why They're Not Enough)

You've heard it: Logs, Metrics, Traces. The three pillars. But having all three doesn't automatically give you observability.

### Logs Without Structure = Noise
```
INFO: Processing request
ERROR: Something went wrong
```
vs
```json
{"level": "error", "service": "payment-api", "trace_id": "abc123", "user_id": "u456", "error": "timeout calling inventory-service", "latency_ms": 5002}
```

Structured logs with correlation IDs. That's the difference between searchable context and a wall of text.

### Metrics Without Cardinality = Blind Spots
Average response time: 200ms. Looks fine. But P99 is 8 seconds. 1% of your users are having a terrible experience and your dashboard says everything's green.

**Always track**: P50, P95, P99. Averages lie.

### Traces Without Propagation = Fragments
A trace that covers one service but stops at the boundary is useless for debugging distributed issues. Context propagation across every service boundary is essential.

## What I Set Up for Every Platform

1. **OpenTelemetry SDK** baked into every service template — not optional
2. **Structured logging** with mandatory fields: trace_id, service, environment
3. **RED metrics** for every service: Rate, Errors, Duration
4. **Alerting on symptoms** (error rate, latency) not causes (CPU, memory)
5. **Runbooks linked to alerts** — every alert has a "what to do" document

## The Culture Part

The best observability setup is useless if engineers don't use it. Make it part of the development workflow: "Before you merge, can you trace a request through your change?"

---

*How mature is your team's observability practice? [Let's discuss on LinkedIn](https://linkedin.com/in/saikoushikg).*
