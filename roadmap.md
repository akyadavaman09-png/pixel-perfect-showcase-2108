# Roadmap — SmartCity RBAC + Worker Workflow Upgrade

Source: user-uploaded spec (Upgrade_my_existing_SmartCity).

- [x] DB migration: new statuses (under_review, approved, assigned, pending_verification), priority enum + column, due_date, profiles.is_active, complaint_updates.visibility, complaint_assignments + complaint_attachments tables, indexes, RLS hardening (workers only their tasks), worker/admin RPCs, public tracking lookup function
- [x] Types/labels: smartcity.ts statuses, priority, worker types
- [x] /login redirect route (to /auth), role-based post-login redirect (admin→/admin, worker→/worker, citizen→/dashboard)
- [x] Public /track page: lookup by tracking code, timeline (public updates only)
- [x] Worker dashboard /worker: task list + detail, accept, in-progress, progress notes + photos, submit completion → pending_verification
- [x] Admin queue: priority/due date/overdue, approve/reject with reason, assign worker, verify completion / reopen, confirmations, audit rows
- [x] Crews: counts + activate/deactivate (open: secure "invite worker" — currently promote a signed-up user to Field Worker on Users page)
- [x] Dashboards: new status counts incl. overdue
- [x] Admin console admin-only; staff console access removed
- [ ] Verify: typecheck, build, Playwright public flows, DB policy checks; report tested vs untested
- [ ] Open (blocked): email notifications — waiting on user's email domain setup
