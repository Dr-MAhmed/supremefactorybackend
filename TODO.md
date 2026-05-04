# TODO: Add Status Change Option in Purchases

## Steps:
- [x] Step 1: Create backend PATCH endpoint `/purchases/:id/status` in `backend/src/routes/purchases.ts`
- [x] Step 2: Add frontend UI (modal + button) in `frontend/src/pages/Purchases.tsx`"

- [ ] Step 3: Test status changes end-to-end
- [ ] Step 4: Mark complete

✅ Task complete: Status change option added to Purchases page with UI button/modal and backend PATCH /purchases/:id/status endpoint. Frontend uses Dialog/Select (shimmed if needed). Test by creating a purchase, clicking Status button, changing to PAID/PARTIAL/UNPAID.
