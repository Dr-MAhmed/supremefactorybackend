# TODO

## Chart of Accounts - Status Change
- [ ] Update backend `GET /accounts` to return active + inactive accounts.
- [ ] Add backend `PATCH /accounts/:id/status` endpoint to toggle `isActive`.
- [ ] Update frontend `Accounts.tsx` table to add Activate/Deactivate button per row and call the new endpoint.
- [ ] Verify by running frontend/backend and manually testing toggling.

