---
slug: terraform-spaghetti-code
title: "Why Your Terraform Code Looks Like Spaghetti (And How to Fix It)"
authors: [saikoushik]
tags: [terraform, iac, devops]
---

I've reviewed Terraform codebases across 4 organisations now. The pattern is always the same: it starts clean, then someone adds "just one more resource," and 6 months later you have a 2,000-line main.tf that nobody wants to touch.

Here's why it happens and how to fix it.

<!-- truncate -->

## The 3 Root Causes

### 1. No Module Strategy

Teams start writing resources inline. By month 3, they have networking, compute, storage, and IAM all in one folder. The fix: **modules from day one**. Even if it feels like over-engineering, create a module for each logical domain.

### 2. State File Chaos

One state file for everything. One mistake and you're planning to destroy your production database alongside a DNS change. The fix: **state isolation by environment AND by domain**. Network state should never live with application state.

### 3. Copy-Paste Across Environments

Dev, staging, prod — three folders with 90% identical code. One gets updated, the others drift. The fix: **use workspaces or terragrunt**. Single source of truth, variables for environment-specific differences.

## The Clean Structure

```
infrastructure/
├── modules/
│   ├── networking/
│   ├── compute/
│   ├── database/
│   └── monitoring/
├── environments/
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── prod.tfvars
├── main.tf
├── variables.tf
└── outputs.tf
```

## The Rule I Follow

If a resource block has more than 30 lines, it belongs in a module. If a module has more than 5 resources, it might need splitting. If you can't explain what a file does in one sentence, it's doing too much.

Clean Terraform isn't about being clever. It's about making the next person's life easier — and that next person is usually you in 3 months.

---

*How do you organise your Terraform codebases? Share your approach — [connect with me on LinkedIn](https://linkedin.com/in/saikoushikg).*
