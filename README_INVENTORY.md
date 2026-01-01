# Frontend Inventory (Continuity)

## Continuation Key
Use this phrase to resume exactly where we stopped:
> continuar vm-panel — inventory dc + public ips vm select

---

## Current Status (✅ DONE)

### Public IPs Page
- Page exists and loads:
    - `/inventory/ips`
    - `/inventory/ips/filters`
- Filtering is robust via selects:
    - provider, dc, subnet, server_id, status
- VM assignment is done by SELECT, not manual vm_id typing.

### VM Assign Flow (Mode B)
- Operator selects VM (modal/select)
- then clicks Save on the row to apply.

### SelectSearch Fix
- Dropdown inside modal works (position/overflow/z-index fixed).

---

## Important Rules
- Public IP statuses: `free | reserved | assigned`
- Do NOT use `blocked` in Public IP UI (infra only).
- DC filter comes from server (`hosts_servers.dc`), not from IP table.

---

## Pending Next Steps (🔜 TODO)
1) Create Infra IPs page:
- Separate menu item.
- Similar UI pattern but with infra-specific filters.
- Must use selects (operator should not type cluster/datacenter/host etc).

2) Improve UX:
- Save button only enabled when changes exist
- Display pending selection state per row
- Standardize scroll behavior across pages (index.css)

3) Clone VM wizard:
- Choose Public IP(s) and/or Infra IP.
- Integrate with WireGuard/NAT automation.

---

## Services Used
- `src/services/publicIps.jsx`
    - `list()`
    - `filters()`
    - `vmOptions()`
    - `update()`

---

## Quick Test Checklist
1) Open Public IPs page and confirm it loads list and filters.
2) Open modal to select VM; dropdown opens correctly.
3) Select VM, click Save on row: status should become assigned.
4) Free action should null vm_id.
