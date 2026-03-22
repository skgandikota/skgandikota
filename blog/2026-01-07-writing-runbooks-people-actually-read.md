---
slug: writing-runbooks-people-actually-read
title: "The Art of Writing Runbooks That People Actually Read"
authors: [saikoushik]
tags: [sre, devops, platform-engineering]
---

3 AM. PagerDuty fires. You open the runbook. It says:

"Check the logs and restart if necessary."

That's not a runbook. That's a suggestion. And at 3 AM, it's useless.

Here's how to write runbooks that actually help during incidents.

<!-- truncate -->

## What Makes a Runbook Useful

A good runbook answers these questions in order:

1. **What is happening?** — Plain English description of the alert
2. **How bad is it?** — Impact to users, severity level
3. **What should I check first?** — Exact commands, exact dashboards
4. **How do I fix it?** — Step-by-step, copy-pasteable commands
5. **Who do I escalate to?** — Names, not roles. "Call Priya" not "contact the DBA team"

## The Template I Use

```markdown
# Alert: [Alert Name]

## What's Happening
[One sentence describing the symptom in plain English]

## Impact
- **Users affected**: [who/how many]
- **Severity**: [P1/P2/P3]
- **SLA at risk**: [yes/no, which SLA]

## Diagnosis Steps

### Step 1: Check [specific thing]
\`\`\`bash
kubectl logs -n payments deploy/payment-api --tail=100 | grep ERROR
\`\`\`
**If you see**: `ConnectionTimeout to inventory-service`
→ Go to Step 2a

**If you see**: `OutOfMemory`
→ Go to Step 2b

### Step 2a: Inventory Service Down
\`\`\`bash
kubectl get pods -n inventory
kubectl describe pod -n inventory <pod-name>
\`\`\`
**Fix**: Restart the deployment
\`\`\`bash
kubectl rollout restart deploy/inventory-service -n inventory
\`\`\`
**Recovery time**: ~2 minutes

### Step 2b: Memory Issue
\`\`\`bash
kubectl top pods -n payments
\`\`\`
**Fix**: Scale up replicas
\`\`\`bash
kubectl scale deploy/payment-api -n payments --replicas=5
\`\`\`
Then investigate the memory leak during business hours.

## Escalation
- **If not resolved in 15 minutes**: Call [Name] — [phone number]
- **If customer-facing impact**: Notify [Name] on Slack #incidents
```

## The 5 Rules

1. **Copy-pasteable commands** — No pseudocode. Real commands with real paths.
2. **Decision trees, not paragraphs** — "If X, do Y. If Z, do W."
3. **Tested regularly** — Run through the runbook quarterly. If a command doesn't work, the runbook is lying.
4. **Linked from the alert** — The PagerDuty/Opsgenie alert should contain a direct link to the runbook. Zero searching.
5. **Written by the person who fixed it last time** — Immediately after an incident, update the runbook while the context is fresh.

## The Culture Shift

Every incident retrospective should include: "Is the runbook updated?" If there isn't a runbook for this scenario, create one as an action item. Over time, you build a library that makes 3 AM incidents manageable instead of terrifying.

---

*What's in your runbook template? [Share your format on LinkedIn](https://linkedin.com/in/saikoushikg).*
