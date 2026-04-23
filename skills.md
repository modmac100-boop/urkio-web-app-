# Urkio Platform Skills & Functionalities

This document defines the core capabilities (skills) available to different user archetypes on the Urkio platform: **Users** (Seekers) and **Experts** (Healers/Specialists).

## 1. Regular User (Seeker)
The standard user account is designed for individuals seeking personal growth, community connection, and professional guidance.

### Capabilities (Skills)
*   **Community Connection (Healing Circle)**:
    *   Read, like, and comment on public social feed posts.
    *   Create text-based posts to share thoughts or ask questions.
    *   View public user profiles and their milestone streaks.
*   **Personal Dashboard (Home)**:
    *   Track personal "Current Streak" (e.g., days logged in or days practicing mindful habits).
    *   View active milestone achievements and mood average (Positive/Neutral/Negative).
*   **Discovery & Booking**:
    *   Browse the "Experts" directory to find verified specialists.
    *   View an Expert's public profile, credentials, and offered services.
    *   Book a 1-on-1 session directly from the Expert's public profile.
*   **AI Guidance (Urkio Guide)**:
    *   Interact with the Google Gemini-powered AI chatbot for instant empathetic support and self-regulation techniques.
*   **Video Sessions**:
    *   Join a secure video room via a direct link provided by an Expert.

## 2. Expert (Specialist / Healer)
The expert account requires admin verification. It includes all Regular User skills, plus professional tools to manage clients and share anonymized knowledge.

### Capabilities (Skills)
*   **Specialist Hub (Private Dashboard)**:
    *   **Agenda & Clients**: Manage scheduled appointments, view client contact information, and keep private session notes.
    *   **Case Studies**: Publish anonymized clinical case studies to collaborate with other peers on the platform.
*   **Telehealth Integration**:
    *   Integrate Dyte for HIPAA-compliant video sessions rooms (Dyte integration) instantly from the Specialist Hub.
*   **Public Professional Profile**:
    *   Host a public page (`/user/:userId`) where standard users can view their biography, specialty tags, and schedule appointments.
*   **Expert Verification Flow**:
    *   Submit a professional verification request (credentials, specialty) via the `/verify` route (subject to Admin approval).

## 3. Administrator
Administrators oversee the safety and integrity of the Urkio platform.

### Capabilities (Skills)
*   **Admin Dashboard Feed**:
    *   Review pending Expert Verification requests.
    *   Approve or reject applications, automatically upgrading a `user` role to `specialist`.
    *   Monitor platform health and reported content.
