---
sidebar_position: 1
---

# Terraform Patterns & Best Practices

## Module Structure

```
modules/
├── networking/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── README.md
├── compute/
└── database/
```

### Rules
- One module per logical domain
- Every module has `variables.tf`, `outputs.tf`, `README.md`
- Pin provider versions in the root, not in modules
- Use `terraform-docs` to auto-generate module documentation

## State Management Checklist

- [ ] Remote backend configured (Azure Blob / S3)
- [ ] State locking enabled
- [ ] Versioning enabled on storage
- [ ] State isolated by environment AND domain
- [ ] No secrets in state (use `sensitive = true`)

## Useful Commands

```bash
# Format all files
terraform fmt -recursive

# Validate configuration
terraform validate

# Plan with specific var file
terraform plan -var-file=environments/prod.tfvars

# Import existing resource
terraform import azurerm_resource_group.example /subscriptions/.../resourceGroups/example

# Move resource in state
terraform state mv azurerm_resource_group.old azurerm_resource_group.new

# List all resources in state
terraform state list
```

## Common Patterns

### Conditional Resource Creation
```hcl
resource "azurerm_public_ip" "this" {
  count = var.create_public_ip ? 1 : 0
  # ...
}
```

### Dynamic Blocks
```hcl
dynamic "security_rule" {
  for_each = var.nsg_rules
  content {
    name                       = security_rule.value.name
    priority                   = security_rule.value.priority
    direction                  = security_rule.value.direction
    access                     = security_rule.value.access
    protocol                   = security_rule.value.protocol
    source_port_range          = security_rule.value.source_port_range
    destination_port_range     = security_rule.value.destination_port_range
    source_address_prefix      = security_rule.value.source_address_prefix
    destination_address_prefix = security_rule.value.destination_address_prefix
  }
}
```

---

*Adding more patterns as I encounter them in projects.*
