
## Step 1: Fix Critical Security Issues First

1. **Secure `openrouter-ai` edge function** — add JWT verification in code
2. **Lock down `/admin-setup` route** — require existing admin to create new admins
3. **Fix permissive RLS policies** — `damage_detection_history`, `ai_feedback`, `battery_reports` should be user-scoped

## Step 2: Keep Both Payment Methods (M-Pesa + Paystack)
- Both are already built — M-Pesa STK push + Paystack initialize/verify
- Create a unified `PaymentSelector` component that lets users choose their method
- Wire both into the Pro upgrade flow

## Step 3: Phase 1 — Technician Marketplace
- **New DB tables**: `technicians`, `technician_reviews`, `repair_bookings`
- **Technician profile page**: certified techs can create profiles with skills, location, ratings
- **Booking system**: users can browse techs, book repairs, pay through M-Pesa or Paystack
- **New routes**: `/technicians`, `/technicians/:id`, `/book-repair`

## Step 4: Phase 1 — Repair Cost Estimator
- **AI-powered cost estimation** via the existing `openrouter-ai` edge function
- After photo/video diagnosis, AI provides cost breakdown: labor + parts + time estimate
- Pulls from spare parts data already in the system
- New `RepairCostEstimator` component integrated into Diagnose page

## Phases 2-4: Future Iterations
These are substantial features that we'll tackle after Phase 1 is solid:
- Phase 2: Voice diagnosis, AR overlay, multi-device dashboard
- Phase 3: Forum, gallery, referrals, gamification
- Phase 4: B2B dashboard, API, offline AI, multi-language

### Files to create
- `src/components/PaymentSelector.tsx`
- `src/components/TechnicianCard.tsx`
- `src/components/TechnicianProfile.tsx`
- `src/components/BookRepair.tsx`
- `src/components/RepairCostEstimator.tsx`
- `src/pages/Technicians.tsx`
- `src/pages/TechnicianDetail.tsx`
- DB migrations for technician tables

### Files to modify
- `supabase/functions/openrouter-ai/index.ts` — add JWT check
- `src/pages/AdminSetupPage.tsx` — add admin role check
- `src/components/MpesaPaymentModal.tsx` — integrate with PaymentSelector
- `src/App.tsx` — add new routes
- `src/pages/Diagnose.tsx` — add cost estimator tab
