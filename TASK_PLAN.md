# Urkio Full-Stack Launch Task Plan

## Phase 1: Core Infrastructure & Setup
- [x] Provision Firebase (Firestore, Auth, Storage)
- [x] Install Dependencies (React Router, Tailwind, Framer Motion, Firebase, GenAI)
- [x] Configure Express + Vite Server (`server.ts`)
- [x] Define `firebase-blueprint.json` and `firestore.rules` (RBAC)

## Phase 2: Authentication & RBAC
- [x] Implement Google Auth via Firebase
- [x] Create `users` collection with roles (`user`, `specialist`, `admin`)
- [x] Build Expert Verification Form (`ExpertVerificationForm.tsx`)
- [x] Build Admin Dashboard Feed for verifying experts

## Phase 3: Social Networking ('Healing Circle')
- [ ] Build Social Feed UI (Instagram/LinkedIn style)
- [ ] Implement `onSnapshot` for real-time posts, likes, and comments
- [ ] User profile creation and editing

## Phase 4: Specialist Hub & Video
- [ ] Build Specialist Dashboard (Anonymized case studies)
- [x] Integrate Dyte for HIPAA-compliant video sessions
- [ ] Implement "Healing Code" state change (Social -> Clinical theme)

## Phase 5: Interactive AI Assistant ('Urkio Guide')
- [ ] Integrate Google Gemini Pro
- [ ] Build Chat UI for empathetic self-regulation techniques
- [ ] Implement RAG-like context awareness (based on user profile/mood)

## Phase 6: Testing & Deployment
- [ ] Verify RBAC rules
- [ ] Test real-time sync
- [ ] Final compilation and linting
