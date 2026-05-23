# Snaplit — AI Development Log

Project created and developed with help from AI tools during ideation, UI planning, backend setup, debugging, and documentation.

Developer: Lohith G  
Project: Snaplit  
Stack: React 19 + TypeScript + Vite + Supabase + Tailwind CSS + Motion

---

# Initial Project Idea

## User Prompt
I want to build a realtime social app like Locket/Bereal where friends can send live photos to each other and display them on widgets/home screen. Give me feature ideas and app name ideas.

## AI Response
Suggested app names:
- Snaplit
- Glowframe
- Momentra
- Pixloop
- Friendpix
- Snapnest
- Liveframe

Suggested features:
- Friend request system
- Realtime photo sync
- Camera integration
- Widget preview
- OTP login
- Google Sign-In
- Reactions
- Notifications
- History view
- Animated UI

Selected project name: **Snaplit**

---

# Tech Stack Planning

## User Prompt
Best stack for building this app fast with realtime backend and modern UI?

## AI Response
Recommended stack:
- React 19
- TypeScript
- Vite 6
- Tailwind CSS v4
- Supabase
- Motion (Framer Motion)
- Lucide React
- Vercel

Reason:
- Fast development
- Realtime support
- Easy authentication
- Scalable backend
- Modern UI

---

# UI Library Suggestions

## User Prompt
Best library to install for best UI design for building apps

## AI Response
Recommended:
- Tailwind CSS
- shadcn/ui
- Motion
- Lucide React

Suggestions:
- Blur glassmorphism cards
- Floating animations
- Smooth transitions
- Mobile-first responsive design
- Gradient buttons
- Skeleton loaders

---

# Supabase Database Planning

## User Prompt
Give me database schema for users, friendships and photos for Snaplit app.

## AI Response

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  has_synced_contacts BOOLEAN DEFAULT false,
  has_setup_widget BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_photo TEXT,
  image_url TEXT NOT NULL,
  caption TEXT,
  recipient_ids UUID[] DEFAULT '{}',
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_photos_sender_id ON photos(sender_id);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
```

Additional suggestions:
- Enable realtime replication
- Add storage bucket for images
- Use row-level security policies

---

# Authentication Planning

## User Prompt
How to implement Email OTP and Google Sign-In using Supabase?

## AI Response
Suggested flow:
1. Create Supabase project
2. Enable Email provider
3. Enable OTP login
4. Configure Google OAuth
5. Use Supabase Auth SDK

Suggested methods:
```ts
supabase.auth.signInWithOtp()
supabase.auth.signInWithOAuth()
```

Additional recommendation:
- Add cooldown timer for OTP requests
- Handle auth persistence
- Add loading states

---

# Project Structure Planning

## User Prompt
Give good folder structure for my React + Supabase app.

## AI Response

```txt
src/
├── components/
├── hooks/
├── lib/
├── services/
├── pages/
├── types/
├── App.tsx
└── main.tsx
```

Recommended separation:
- services → database/API logic
- hooks → reusable state logic
- lib → utilities/configuration
- components → reusable UI components

---

# Deployment Planning

## User Prompt
How to deploy Snaplit for free?

## AI Response
Recommended deployment:
- Frontend → Vercel
- Backend → Supabase

Steps:
1. Push GitHub repository
2. Import project into Vercel
3. Add environment variables
4. Deploy production build

Suggested environment variables:
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

# Debugging Session — OTP Rate Limit

## User Prompt
email rate limit exceeded in my app snaplit in all devices

## AI Response
Possible causes:
- Too many OTP requests
- Supabase abuse protection
- No resend cooldown
- Shared IP rate limit

Suggested fixes:
- Add resend timer
- Disable repeated clicks
- Add retry delay
- Configure custom SMTP

---

# Feature Planning — Widget System

## User Prompt
How should I create widget preview for Snaplit?

## AI Response
Suggested approach:
- Create WidgetPreview component
- Display latest friend photo
- Add rounded card UI
- Show sender name
- Use blur background
- Auto refresh using realtime updates

---

# Animation & UX Suggestions

## User Prompt
How to make Snaplit look premium?

## AI Response
Suggestions:
- Use Motion transitions
- Add floating animations
- Use gradient overlays
- Add smooth page transitions
- Add spring animations
- Use dark glassmorphism cards
- Improve spacing and typography

---

# README Generation

## User Prompt
Generate README for my Snaplit app with setup instructions, features and tech stack.

## AI Response
Generated:
- Features section
- Installation guide
- Supabase setup
- Environment variables
- Deployment instructions
- Folder structure
- Scripts section

README later used in repository.

---

# Final App Features

Snaplit includes:
- Email OTP authentication
- Google Sign-In
- Friend system
- Realtime photo sharing
- Widget-style UI
- Camera integration
- Animated interface
- Supabase backend
- Vercel deployment

---

# Notes

- AI was used for brainstorming, debugging, UI suggestions, architecture planning, and documentation.
- Logs intentionally kept raw and unedited.
- Secrets/API keys removed before committing.
- Multiple prompt iterations were used during development.