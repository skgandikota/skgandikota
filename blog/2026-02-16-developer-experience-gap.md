---
slug: developer-experience-gap
title: "The Developer Experience Gap Nobody Talks About"
authors: [saikoushik]
tags: [platform-engineering, devops]
---

We spend millions on developer tooling — IDEs, CI/CD, cloud platforms, monitoring. Yet in most organisations, the developer experience is still frustrating.

The gap isn't in the tools. It's in the space BETWEEN the tools.

<!-- truncate -->

## The Journey Nobody Maps

Picture a new developer joining your team:

1. **Day 1**: Get laptop, install tools. Which tools? Check the wiki. The wiki is outdated. Ask Slack. Three people give three different answers.

2. **Day 3**: Clone the repo. Try to run locally. Missing environment variables. Missing dependencies. The README says "run `make setup`" — the Makefile hasn't worked since 2024.

3. **Day 7**: First PR submitted. CI fails. Linting rules not documented. Tests pass locally but fail in CI because CI uses a different Node version.

4. **Day 14**: Finally deployable. But how? "Talk to DevOps." DevOps points to a Confluence page. The page references a pipeline that's been replaced.

**Two weeks to deploy a one-line change.** That's not a tooling problem. That's a developer experience problem.

## What Good Looks Like

The best platform teams I've worked with treat developer experience like a product:

### Onboarding in Hours, Not Weeks
- One-command local setup: `make dev-setup`
- Pre-configured dev containers with all dependencies
- Up-to-date documentation (enforced by automation, not hope)

### Inner Loop Speed
- Local development mirrors production closely
- Hot reload, fast feedback, clear error messages
- Tests run in under 5 minutes

### Outer Loop Clarity
- One way to deploy (the golden path)
- Self-service environments
- Clear status: where is my change right now?

## How to Measure It

Track these:
- **Time to first commit** — how long from laptop to merged PR?
- **Deployment frequency** — are teams deploying daily or weekly?
- **Time to recovery** — when something breaks, how fast do they fix it?
- **Developer satisfaction** — quarterly survey, 5 questions, anonymous

If you're not measuring developer experience, you're not managing it.

## The Business Case

Every hour a developer spends fighting tooling is an hour not spent building features. At £80-120/hour for an engineer, a platform that saves 2 hours per developer per week across 100 developers saves £800K-1.2M per year.

That's not a cost centre. That's an investment with measurable returns.

---

*What's the most frustrating part of your developer experience? [Tell me on LinkedIn](https://linkedin.com/in/saikoushikg).*
