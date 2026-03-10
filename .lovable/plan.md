

## Plan: Landing Page Redesign + Cookie Consent + Install Page + Capacitor Setup

### What's changing

**1. Ubuntu Font across the entire site**
- Import Ubuntu font from Google Fonts in `src/index.css`
- Set it as the primary font family site-wide

**2. Landing Page Redesign (`src/pages/Index.tsx`, `src/components/Hero.tsx`, `src/components/Features.tsx`, `src/components/HowItWorks.tsx`)**
- Add a tech-themed background image using Unsplash (circuit board / electronics repair aesthetic) as the hero background
- Redesign the header with a proper navbar (logo, nav links, sign in/out, install button)
- Make the Hero section overlay the background image with a dark gradient for readability
- Improve Features section with better card styling and alternating layout
- Add a footer with branding and links
- Add an "Install App" button prominently in the hero and navbar

**3. Cookie Consent Banner (`src/components/CookieConsent.tsx`)**
- New component: bottom banner informing users about cookies
- Stores acceptance in localStorage so it only shows once
- Accept / Decline buttons

**4. Install App Page (`src/pages/Install.tsx`)**
- Dedicated `/install` route with instructions for iOS (Add to Home Screen) and Android (browser install prompt)
- Triggers the `beforeinstallprompt` event when available
- Fallback manual instructions when the prompt isn't available

**5. Capacitor Setup for Android**
- Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
- Create `capacitor.config.ts` with:
  - appId: `app.lovable.4ccf9efce09f42b0ac5c6379c996d43d`
  - appName: `gadget-ai-doctor`
  - server URL pointing to the sandbox preview for hot-reload
- User will then need to: export to GitHub, run `npx cap add android`, `npx cap sync`, and `npx cap run android`

### Files to create
- `src/components/CookieConsent.tsx` -- cookie banner component
- `src/pages/Install.tsx` -- dedicated install page
- `capacitor.config.ts` -- Capacitor configuration

### Files to modify
- `src/index.css` -- Ubuntu font import + set as default
- `src/pages/Index.tsx` -- new layout with navbar, footer, install button
- `src/components/Hero.tsx` -- background image, better layout, install CTA
- `src/components/Features.tsx` -- improved styling
- `src/components/HowItWorks.tsx` -- improved styling with Ubuntu font
- `src/App.tsx` -- add `/install` route, add CookieConsent component
- `package.json` -- add Capacitor dependencies

