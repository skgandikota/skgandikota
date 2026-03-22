---
slug: iac-testing-need-it-yesterday
title: "Infrastructure as Code Testing: Why You Need It Yesterday"
authors: [saikoushik]
tags: [terraform, iac, devops]
---

We test application code religiously. Unit tests, integration tests, E2E tests. CI won't pass without 80% coverage.

Infrastructure code? "Just run `terraform plan` and eyeball it."

That inconsistency is where production incidents are born.

<!-- truncate -->

## Why IaC Testing Is Different (Not Unnecessary)

You can't unit test a resource that only exists after `terraform apply`. But you CAN test:

### 1. Static Analysis (Seconds)

**What**: Catch issues without running anything.

- `tflint` — linting for Terraform, catches deprecated syntax, naming conventions, unused variables
- `checkov` / `tfsec` — security scanning, catches misconfigurations before they reach cloud
- `terraform validate` — syntax and internal consistency check

**When I use it**: Every commit. In pre-commit hooks AND CI pipeline.

### 2. Plan Testing (Minutes)

**What**: Run `terraform plan` and validate the output programmatically.

- Open Policy Agent (OPA) — write policies that check the plan JSON
- Sentinel (HashiCorp) — policy as code for Terraform Cloud/Enterprise

Example policy: "No plan should delete a production database. Ever."

```rego
deny[msg] {
  resource := input.resource_changes[_]
  resource.type == "azurerm_postgresql_server"
  resource.change.actions[_] == "delete"
  contains(resource.address, "prod")
  msg := "Cannot delete production database"
}
```

**When I use it**: Every PR. Mandatory before merge.

### 3. Integration Testing (Minutes to Hours)

**What**: Actually apply infrastructure, validate it works, then destroy it.

- `Terratest` (Go) — the gold standard for Terraform integration tests
- `Kitchen-Terraform` — Ruby-based alternative

```go
func TestVNetIsCreated(t *testing.T) {
    terraformOptions := &terraform.Options{
        TerraformDir: "../modules/networking",
        Vars: map[string]interface{}{
            "environment": "test",
        },
    }
    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)
    
    vnetName := terraform.Output(t, terraformOptions, "vnet_name")
    assert.Contains(t, vnetName, "test")
}
```

**When I use it**: Weekly against modules. On every module change in CI.

## The Minimum Viable Test Pipeline

1. Pre-commit: `tflint` + `terraform fmt` + `terraform validate`
2. CI on PR: `checkov` scan + `terraform plan` + OPA policy check
3. CI on merge: Integration test for changed modules
4. Nightly: Full integration suite against all modules

## The ROI

One prevented production incident pays for months of test development. Test your infrastructure. Your future self at 2 AM will thank you.

---

*What IaC testing tools does your team use? [Share your setup on LinkedIn](https://linkedin.com/in/saikoushikg).*
