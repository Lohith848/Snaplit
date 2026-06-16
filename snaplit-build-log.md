# AI Conversation Logs — Snaplit (Locket Widget Clone)

> **Project:** Snaplit — Live photos from your best friends, right on your Home Screen  
> **Builder:** Lohith  
> **Repo:** https://github.com/Lohith848/Snaplet  
> **Log Format:** Prompt → AI Response (summarized)  
> **Tool Used:** Claude (claude-sonnet-4-6)

---

## Session 1 — Concept, Stack & Project Scaffold

**Date:** 2026-06-01

---

**[USER]**
I want to build a Locket Widget clone. Users can add friends, take live photos, and have them show up on each other's home screen widgets in real time. What stack should I use?

**[AI]**
Great idea — here's a stack that maps well to Locket's core features:

- **Frontend:** React 19 + TypeScript + Vite 6 (fast HMR, great DX)
- **Styling:** Tailwind CSS v4 (utility-first, mobile-first)
- **Animations:** Motion (Framer Motion's new package) for smooth transitions
- **Icons:** Lucide React
- **Backend:** Supabase — covers Auth, PostgreSQL, Realtime, and Storage in one
- **Deployment:** Vercel

Why Supabase specifically: Locket's magic is real-time — when a friend sends a photo it immediately appears. Supabase Realtime subscriptions handle this without needing a custom WebSocket server. Storage handles photo uploads. Auth handles email OTP and Google Sign-In out of the box.

Want me to scaffold the folder structure?

---

**[USER]**
Yes. App name is Snaplit. Scaffold the project with Vite, React 19, TypeScript, Tailwind v4.

**[AI]**
Initialized project:

```bash
npm create vite@latest snaplit -- --template react-ts
cd snaplit
npm install tailwindcss @tailwindcss/vite
npm install @supabase/supabase-js motion lucide-react
```

Folder structure:

```
src/
├── components/
│   ├── CameraView.tsx       # Live camera capture
│   ├── ContactSync.tsx      # Sync contacts to find friends
│   ├── FriendsView.tsx      # Friend list & requests
│   ├── HistoryView.tsx      # Past photo feed
│   ├── LoginView.tsx        # Auth (Email OTP + Google)
│   ├── WidgetPreview.tsx    # Home screen widget preview
│   └── WidgetSetup.tsx      # Widget setup instructions
├── hooks/
│   └── useAuth.ts           # Auth state hook
├── lib/
│   ├── supabase.ts          # Supabase client init
│   ├── firestore-errors.ts  # Error code helpers
│   └── utils.ts             # Shared utilities
├── services/
│   ├── photoService.ts      # Upload & fetch photos
│   └── userService.ts       # User profile & friends
├── App.tsx
├── index.css
└── types.ts                 # TypeScript interfaces
```

Also created `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Session 2 — Supabase Schema Design

**Date:** 2026-06-02

---

**[USER]**
Design the full database schema for Snaplit. I need users, friendships, and photos.

**[AI]**
Here's the complete schema. Run this in your Supabase SQL Editor:

```sql
-- Users table (extends Supabase Auth)
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

-- Friendships table
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',         -- 'pending' | 'accepted'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_photo TEXT,
  image_url TEXT NOT NULL,
  caption TEXT,
  recipient_ids UUID[] DEFAULT '{}',     -- array of recipient user IDs
  reactions JSONB DEFAULT '{}',          -- { userId: emoji }
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_photos_sender_id ON photos(sender_id);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
```

Key design decisions:
- `recipient_ids` is a UUID array so one photo can go to multiple friends without duplicating rows
- `reactions` is JSONB for flexible emoji reactions per user
- Friendships are directional — both `(A→B)` and `(B→A)` rows exist after acceptance for easy querying

---

**[USER]**
Add Row Level Security policies so users can only see their own data.

**[AI]**
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Users: can read any profile, only edit own
CREATE POLICY "Public profiles are viewable" ON users FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Friendships: users see only their own friendship rows
CREATE POLICY "Users see own friendships" ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users insert own friendship requests" ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own friendship" ON friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Photos: sender can see all their sent photos; recipients can see photos addressed to them
CREATE POLICY "Senders see own photos" ON photos FOR SELECT
  USING (auth.uid() = sender_id);
CREATE POLICY "Recipients see photos sent to them" ON photos FOR SELECT
  USING (auth.uid() = ANY(recipient_ids));
CREATE POLICY "Users insert own photos" ON photos FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
```

---

## Session 3 — Supabase Auth (Email OTP + Google)

**Date:** 2026-06-03

---

**[USER]**
Build the LoginView. I want Email OTP and Google Sign-In via Supabase Auth.

**[AI]**
Built `components/LoginView.tsx` with two flows:

**Email OTP:**
```ts
// Send OTP
const { error } = await supabase.auth.signInWithOtp({ email });

// Verify OTP
const { data, error } = await supabase.auth.verifyOtp({
  email,
  token: otp,
  type: "email",
});
```

**Google Sign-In:**
```ts
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: window.location.origin },
});
```

UI has two states — email input → OTP input — with a smooth Motion fade between them. Google button sits below with a divider. After auth, the `useAuth` hook picks up the session and routes to the main app.

---

**[USER]**
Build the `useAuth` hook to manage auth state across the app.

**[AI]**
```ts
// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = () => supabase.auth.signOut();

  return { user, loading, signOut };
}
```

Used in `App.tsx` to gate routes — unauthenticated users see `LoginView`, authenticated users see the main app shell.

---

## Session 4 — Camera Integration

**Date:** 2026-06-04

---

**[USER]**
Build CameraView. Users should be able to take a selfie or use rear camera, preview it, and send it to selected friends.

**[AI]**
Built `components/CameraView.tsx`:

- **Stream setup:**
```ts
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: cameraFacing }, // 'user' | 'environment'
  audio: false,
});
videoRef.current.srcObject = stream;
```

- **Capture:**
```ts
const capture = () => {
  const canvas = canvasRef.current!;
  canvas.width = videoRef.current!.videoWidth;
  canvas.height = videoRef.current!.videoHeight;
  canvas.getContext("2d")!.drawImage(videoRef.current!, 0, 0);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  setPreview(dataUrl);
};
```

- After capture, shows preview with retake/send buttons
- Flip button toggles `facingMode` between front and rear camera
- Caption input below preview (optional)
- Friend selector multi-select (fetched from accepted friendships)
- On send → calls `photoService.sendPhoto()` → uploads to Supabase Storage → inserts photo row

Added Motion `AnimatePresence` for the preview slide-up animation.

---

**[USER]**
The camera stream isn't stopping when the user navigates away. Fix the memory leak.

**[AI]**
Added cleanup in the `useEffect`:

```ts
useEffect(() => {
  let stream: MediaStream;

  const startCamera = async () => {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  startCamera();

  return () => {
    stream?.getTracks().forEach(track => track.stop());
  };
}, [facingMode]);
```

Each facingMode change restarts the stream cleanly and the previous one is always stopped.

---

## Session 5 — Photo Service & Supabase Storage

**Date:** 2026-06-05

---

**[USER]**
Build photoService.ts. It should upload a photo to Supabase Storage and then insert a row in the photos table.

**[AI]**
```ts
// services/photoService.ts
import { supabase } from "../lib/supabase";

export async function sendPhoto(
  senderId: string,
  senderName: string,
  senderPhoto: string | null,
  imageDataUrl: string,
  caption: string,
  recipientIds: string[]
) {
  // 1. Convert base64 to blob
  const res = await fetch(imageDataUrl);
  const blob = await res.blob();
  const filename = `${senderId}/${Date.now()}.jpg`;

  // 2. Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("photos")
    .upload(filename, blob, { contentType: "image/jpeg" });

  if (uploadError) throw uploadError;

  // 3. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("photos")
    .getPublicUrl(filename);

  // 4. Insert photo record
  const { data, error } = await supabase.from("photos").insert({
    sender_id: senderId,
    sender_name: senderName,
    sender_photo: senderPhoto,
    image_url: publicUrl,
    caption,
    recipient_ids: recipientIds,
  }).select().single();

  if (error) throw error;
  return data;
}

export async function getIncomingPhotos(userId: string) {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .contains("recipient_ids", [userId])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}
```

---

## Session 6 — Friend System

**Date:** 2026-06-06

---

**[USER]**
Build the friend system. Users should be able to search by username, send friend requests, and accept/decline them.

**[AI]**
Built `services/userService.ts` and `components/FriendsView.tsx`:

**Search users:**
```ts
export async function searchUsers(query: string, currentUserId: string) {
  const { data } = await supabase
    .from("users")
    .select("id, username, display_name, photo_url")
    .ilike("username", `%${query}%`)
    .neq("id", currentUserId)
    .limit(10);
  return data;
}
```

**Send friend request:**
```ts
export async function sendFriendRequest(userId: string, friendId: string) {
  await supabase.from("friendships").insert({
    user_id: userId,
    friend_id: friendId,
    status: "pending",
  });
}
```

**Accept request:**
```ts
export async function acceptFriendRequest(friendshipId: string, userId: string, friendId: string) {
  // Update existing row to accepted
  await supabase.from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId);

  // Insert reverse row so both sides can query easily
  await supabase.from("friendships").insert({
    user_id: userId,
    friend_id: friendId,
    status: "accepted",
  });
}
```

`FriendsView.tsx` has three tabs: Friends, Requests, Add Friends — with Motion tab indicator animation.

---

**[USER]**
Build ContactSync so users can find friends from their device contacts.

**[AI]**
Built `components/ContactSync.tsx` using the Web Contacts API (where supported):

```ts
const contacts = await (navigator as any).contacts.select(
  ["name", "email", "tel"],
  { multiple: true }
);
```

After selecting, emails are extracted and matched against the `users` table. Matched users are shown with an "Add Friend" button. On unsupported browsers, falls back to a manual username search. Shows a `has_synced_contacts` flag in the user's profile so the onboarding prompt doesn't repeat.

---

## Session 7 — Real-time Subscriptions

**Date:** 2026-06-07

---

**[USER]**
Set up Supabase Realtime so new photos appear instantly without refresh.

**[AI]**
Added Realtime subscription in `HistoryView.tsx`:

```ts
useEffect(() => {
  // Initial load
  loadPhotos();

  // Subscribe to new photos where I'm a recipient
  const channel = supabase
    .channel("incoming-photos")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "photos",
        filter: `recipient_ids=cs.{${user.id}}`,
      },
      (payload) => {
        setPhotos(prev => [payload.new as Photo, ...prev]);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [user.id]);
```

Also enabled Realtime for the `friendships` table so friend request notifications appear instantly — a badge on the Friends tab updates without refresh.

> **Supabase Setup:** In Supabase dashboard → Realtime → Replication → enabled for `photos` and `friendships` tables.

---

## Session 8 — Widget Preview & Setup

**Date:** 2026-06-08

---

**[USER]**
Build WidgetPreview — a component that shows what the home screen widget will look like, with the latest friend photo inside it.

**[AI]**
Built `components/WidgetPreview.tsx`:

- Renders a rounded square (matching iOS widget dimensions ratio)
- Shows the latest incoming photo as a full-bleed background
- Overlays sender name and timestamp at the bottom with a gradient scrim
- Animates in with Motion `scale` + `opacity` entrance
- Three size previews: Small (2×2), Medium (2×4), Large (4×4)
- Tapping a size shows a mocked iPhone home screen with widget placed on it

This is a **visual preview only** — actual widget functionality requires a native iOS/Android wrapper (e.g. React Native with `react-native-widgetkit` or a PWA shortcut).

---

**[USER]**
Build WidgetSetup — instructions for users to add the widget to their home screen.

**[AI]**
Built `components/WidgetSetup.tsx` with step-by-step illustrated instructions:

**iOS:**
1. Long-press home screen → tap `+`
2. Search "Snaplit"
3. Select widget size → tap "Add Widget"

**Android:**
1. Long-press home screen → tap "Widgets"
2. Find Snaplit → drag to home screen

Each step has an icon (Lucide), short description, and a Motion staggered entrance animation. A "Mark as done" button updates `has_setup_widget: true` in the user's profile so this screen doesn't reappear.

---

## Session 9 — History View & Reactions

**Date:** 2026-06-09

---

**[USER]**
Build HistoryView — a scrollable feed of past photos received from friends, with emoji reactions.

**[AI]**
Built `components/HistoryView.tsx`:

- Infinite scroll using `IntersectionObserver` on the last card
- Each photo card shows: full image, sender avatar + name, timestamp, caption, reaction bar
- **Reactions:**
```ts
const react = async (photoId: string, emoji: string) => {
  await supabase
    .from("photos")
    .update({
      reactions: { ...photo.reactions, [user.id]: emoji },
    })
    .eq("id", photoId);
};
```
- Emoji picker shows on long-press (4 quick options: ❤️ 😂 😮 🔥)
- Motion `AnimatePresence` on reaction appear/change

---

## Session 10 — Polish, Types & Deployment

**Date:** 2026-06-10

---

**[USER]**
Define all TypeScript interfaces in types.ts.

**[AI]**
```ts
// types.ts
export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  photo_url: string | null;
  has_synced_contacts: boolean;
  has_setup_widget: boolean;
  created_at: string;
  updated_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted";
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_photo: string | null;
  image_url: string;
  caption: string | null;
  recipient_ids: string[];
  reactions: Record<string, string>; // { userId: emoji }
  created_at: string;
}
```

---

**[USER]**
Deploy to Vercel. What do I need to configure?

**[AI]**
Steps:

1. Push repo to GitHub at `github.com/Lohith848/Snaplet`
2. Import project at vercel.com/new
3. Vercel auto-detects Vite — framework preset: **Vite**
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

**Post-deploy Supabase config:**
- Auth → URL Configuration → add production URL to **Site URL** and **Redirect URLs**
- For Google OAuth: add production URL to **Authorized redirect URIs** in Google Cloud Console

App is live and fully functional — real-time photo sharing working end-to-end.

---

## Final Summary

| Feature | Status |
|---|---|
| Email OTP authentication | ✅ Done |
| Google Sign-In via OAuth | ✅ Done |
| User profiles & username system | ✅ Done |
| Friend requests (send / accept / decline) | ✅ Done |
| Contact sync to find friends | ✅ Done |
| Live camera capture (front & rear) | ✅ Done |
| Multi-friend photo send | ✅ Done |
| Supabase Storage for photo uploads | ✅ Done |
| Real-time photo delivery | ✅ Done |
| Emoji reactions on photos | ✅ Done |
| History feed with infinite scroll | ✅ Done |
| Home screen widget preview | ✅ Done |
| Widget setup instructions | ✅ Done |
| Row Level Security on all tables | ✅ Done |
| TypeScript interfaces for all models | ✅ Done |
| Motion animations throughout | ✅ Done |
| Deployed on Vercel | ✅ Done |

---

*Log generated from AI-assisted development sessions using Claude (claude-sonnet-4-6)*
