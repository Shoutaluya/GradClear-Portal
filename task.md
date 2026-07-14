# Clone & Run Fix Tasks

- [x] Plan approved by user
- [x] **server.ts** — strip Admin SDK, keep only Vite/Express wrapper
- [x] **DepartmentAdminDashboard.tsx** — move stage advancement into handleApprove, add STAGES constant
- [x] **firestore.rules** — Fix Bug 2+3 (CEL syntax), Fix Bug 4 (halt permissions), fix notification create rule
- [x] **README.md** — rewrite with simple clone & run instructions
- [x] Verify: `tsc --noEmit` passes (0 errors)
- [x] Verify: `vitest run` passes (1/1 tests)
