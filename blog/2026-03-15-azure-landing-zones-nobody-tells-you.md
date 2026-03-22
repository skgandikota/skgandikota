---
slug: azure-landing-zones-nobody-tells-you
title: "Azure Landing Zones: What Nobody Tells You"
authors: [saikoushik]
tags: [azure, cloud-security, terraform]
---

Microsoft's Cloud Adoption Framework gives you a beautiful diagram of Azure Landing Zones. Neat boxes, clean lines, management groups in perfect hierarchy. What it doesn't tell you is how much pain lies between that diagram and reality.

Here's what I learned implementing landing zones for enterprise workloads.

<!-- truncate -->

## 1. The Management Group Hierarchy Will Be Political

The CAF recommends a standard hierarchy: Root → Platform → Landing Zones → Decommissioned. Sounds clean. In practice, every business unit wants their own management group. Every team wants exceptions to policies.

**What worked for us**: Start with the CAF default. Resist customisation for the first 3 months. Let teams feel the friction of the standard model before deciding what genuinely needs changing versus what's just preference.

## 2. Azure Policy Will Break Things

You'll deploy policies for allowed regions, required tags, denied SKUs. On day one, something will break. A legacy app needs a region you blocked. A third-party tool doesn't support mandatory tags.

**What worked for us**: Deploy policies in audit mode first. Run for 2 weeks. Review the compliance report. THEN switch to deny. This single decision saved us from 3 production incidents.

## 3. Networking Is Where Projects Go to Die

Hub-and-spoke vs. Virtual WAN. Private DNS zones. ExpressRoute vs. VPN. Firewall placement. Each decision has cascading implications.

**What worked for us**: Document every CIDR allocation in a spreadsheet BEFORE touching Terraform. Plan for 3x the IP space you think you need. Future you will be grateful.

## 4. Subscription Vending Is the Real Value

The landing zone itself is just governance. The magic is **subscription vending** — giving teams a new, policy-compliant subscription in minutes instead of weeks.

We built a self-service portal: team fills a form → Terraform provisions subscription → applies policies → sets up networking → notifies the team. From 3 weeks to 30 minutes.

## The Takeaway

Azure Landing Zones aren't a one-time setup. They're a living product. Budget for ongoing maintenance, policy updates, and team support — or they'll become the governance layer everyone works around instead of within.

---

*Implementing landing zones? I'd love to compare notes — [connect with me on LinkedIn](https://linkedin.com/in/saikoushikg).*
