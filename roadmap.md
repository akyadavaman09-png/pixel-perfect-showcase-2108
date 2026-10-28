# Roadmap — SmartCity RBAC + Worker Workflow Upgrade

Source: user-uploaded spec (Upgrade_my_existing_SmartCity).

- [ ] DB migration: new statuses (under_review, approved, assigned, pending_verification), priority enum + column, due_date, profiles.is_active, complaint_updates.visibility, complaint_assignments + complaint_attachments tables, indexes, RLS hardening (workers only their tasks), worker/admin RPCs, public tracking lookup function
- [ ] Types/labels: smartcity.ts statuses, priority, worker types
- [ ] /login redirect route (to /auth), role-based post-login redirect (admin→/admin, worker→/worker, citizen→/dashboard)
- [ ] Public /track page: lookup by tracking code, timeline (public updates only)
- [ ] Worker dashboard /worker: task list + detail, accept, in-progress, progress notes + photos, submit completion → pending_verification
- [ ] Admin queue: priority/due date/overdue, approve/reject with reason, assign worker, verify completion / reopen, confirmations, audit rows
- [ ] Crews page: worker profiles with counts, create/invite worker securely (server fn), deactivate
- [ ] Dashboards: new status counts incl. overdue
- [ ] Admin console admin-only; staff console access removed
- [ ] Verify: typecheck, build, Playwright public flows, DB policy checks; report tested vs untested
- [ ] Open (blocked): email notifications — waiting on user's email domain setup
