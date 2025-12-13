# TrainSurf — Smart Seat-Hop Search for Indian Railways

<p align="center">
  <img src="public/train-icon-512.png" alt="TrainSurf Logo" width="120" />
</p>

<p align="center">
  <strong>Find confirmed train seats when direct bookings are waitlisted</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#algorithm">Algorithm</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-integration">API Integration</a>
</p>

---

## Developer

**Jaya Soorya**

📧 Email: amjayasoorya@gmail.com

📞 Phone: +91 9345259635

🔗 GitHub: https://github.com/amsoorya

---

## Real Problem and Motivation

TrainSurf is a developer-built, algorithm-driven project that explores a real-world problem faced by Indian Railways passengers: direct tickets often show unavailable even when a journey is still possible by intelligently booking shorter segments on the same train.

This project was designed and implemented during my free time as a student developer, motivated by personal experience as a frequent hostel traveller.

### My Story

I am a hosteller, and trains are usually my default mode of transport.

During one such journey, every direct ticket from my source to destination showed unavailable. I tried nearby stations as well, but still had no luck. Out of necessity, I manually checked segment-wise availability within the same train:

- Source to next station
- That station to next
- And so on…

Surprisingly, I was able to complete my entire journey by booking multiple short segments on the same train. I ended up doing around four seat hops across nearly ten stations, but it worked and got me home.

That experience led to an important realization:

**Existing railway apps like ixigo, ConfirmTkt, etc. do not attempt this computation at all.**

The reason is understandable — the search space grows quickly and can be computationally heavy. But with the right techniques such as pruning, memoization, and priority-based search, it becomes manageable.

This insight became the foundation of TrainSurf.

---

## Overview

TrainSurf is a Progressive Web Application (PWA) that helps Indian Railways travelers find confirmed seat combinations when direct bookings show waitlisted status. Using an intelligent backward binary search algorithm, TrainSurf identifies optimal seat-stitching paths with minimal seat changes during the journey.

### The Problem

When booking long-distance trains on IRCTC, travelers often face situations where:
- Direct bookings (Source → Destination) are waitlisted
- Shorter segments might have confirmed availability
- Manual checking of all segment combinations is time-consuming

### The Solution

TrainSurf automatically:
1. Fetches the complete train route
2. Checks availability for all possible segment combinations
3. Finds the optimal path with minimum seat changes
4. Presents a clear booking plan to the user

---

## Features

### Core Features
- 🎯 **Smart Seat Stitching**: Backward binary search algorithm finds optimal paths
- ⚡ **Real-time Availability**: Live data from IRCTC via RapidAPI
- 📊 **Optimal Results**: Minimizes seat changes for comfortable journeys
- 📱 **PWA Support**: Install as native app on mobile devices
- 🔐 **User Authentication**: Secure login with email/password
- 📜 **Search History**: Track and revisit previous searches

### User Experience
- 🎨 **Modern UI**: Beautiful purple-blue gradient theme
- ✨ **Smooth Animations**: Polished micro-interactions
- 🌓 **Dark Mode**: Full dark theme support
- 📍 **Station Autocomplete**: 120+ major stations with offline search
- 🧪 **Sandbox Mode**: Test the algorithm without API calls

### Additional Features
- 🔑 **Forgot Password**: Email-based password recovery
- 📋 **Export Results**: Copy or download booking plans
- 🕐 **Journey History**: View past searches and results

---

## How It Works

### User Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Enter Train   │────▶│  Run TrainSurf   │────▶│  View Results   │
│   Details       │     │  Algorithm       │     │  & Book         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
  • Train Number           • Fetch Route            • Segment Plan
  • Source Station         • Check Availability     • Copy/Export
  • Destination            • Find Optimal Path      • Save to History
  • Date & Class           • Calculate Changes
```

### Example Scenario

**Journey**: New Delhi (NDLS) → Howrah (HWH)  
**Train**: 12301 Rajdhani Express  
**Direct Status**: Waitlisted (WL 45)

**TrainSurf Solution**:
```
Segment 1: NDLS → CNB (Available: 28 seats)
Segment 2: CNB → PNBE (Available: 15 seats)  
Segment 3: PNBE → HWH (Available: 22 seats)

Result: 2 seat changes, 3 confirmed bookings
```

---

## Algorithm

### Backward Binary Search Approach

The algorithm uses a **backward binary search** strategy to find the optimal seat-stitching combination with minimum seat changes:

```
┌─────────────────────────────────────────────────────────────────┐
│                     ALGORITHM OVERVIEW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. FETCH ROUTE                                                 │
│     ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐           │
│     │ A   │───│ B   │───│ C   │───│ D   │───│ E   │           │
│     └─────┘   └─────┘   └─────┘   └─────┘   └─────┘           │
│                                                                 │
│  2. CHECK AVAILABILITY (Starting from destination)              │
│     Current position: E (destination)                           │
│     Check: A → E  [If available, done!]                        │
│     Check: A → D  [Binary search backward]                     │
│     Check: A → C  [Continue until available segment found]     │
│                                                                 │
│  3. RECURSIVE OPTIMIZATION                                      │
│     Found: A → C (Available)                                    │
│     Remaining: C → E                                            │
│     Recursively find: C → E path                               │
│                                                                 │
│  4. RESULT                                                      │
│     Path: [A→C, C→E] with 1 seat change                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Pseudocode

```typescript
function findOptimalPath(stations, source, destination, classType, quota) {
  // Base case: Check if direct path is available
  const directStatus = await checkAvailability(source, destination);
  if (isAvailable(directStatus)) {
    return [{ from: source, to: destination, status: directStatus }];
  }

  // Binary search for the furthest reachable station
  let left = sourceIndex;
  let right = destIndex;
  let bestReachable = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const status = await checkAvailability(source, stations[mid]);
    
    if (isAvailable(status)) {
      bestReachable = mid;
      left = mid + 1;  // Try to reach further
    } else {
      right = mid - 1;  // Look closer
    }
  }

  if (bestReachable === -1) {
    return null;  // No path found
  }

  // Recursively find remaining path
  const currentSegment = { 
    from: source, 
    to: stations[bestReachable] 
  };
  const remainingPath = await findOptimalPath(
    stations, 
    stations[bestReachable], 
    destination
  );

  return [currentSegment, ...remainingPath];
}
```

### Time Complexity

| Operation | Complexity |
|-----------|------------|
| Route Fetch | O(1) |
| Binary Search per Segment | O(log n) |
| Total API Calls | O(k × log n) |

Where:
- `n` = Number of stations in route
- `k` = Number of seat changes needed

### Availability Status Parsing

The algorithm recognizes these IRCTC statuses:

| Status | Meaning | Available? |
|--------|---------|------------|
| `AVAILABLE-*` | Confirmed seats available | ✅ Yes |
| `AVL *` | Seats available | ✅ Yes |
| `RAC *` | Reservation Against Cancellation | ⚠️ Conditional |
| `WL *` | Waitlisted | ❌ No |
| `REGRET/WL` | Fully waitlisted | ❌ No |
| `NOT AVAILABLE` | No seats | ❌ No |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Tailwind CSS** | Styling |
| **Shadcn/UI** | Component Library |
| **React Router** | Navigation |
| **TanStack Query** | Data Fetching |
| **Lucide Icons** | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend as a Service |
| **PostgreSQL** | Database |
| **Edge Functions** | Serverless API |
| **Row Level Security** | Data Protection |

### External APIs
| API | Purpose |
|-----|---------|
| **IRCTC via RapidAPI** | Train routes & availability |

### PWA
| Feature | Implementation |
|---------|----------------|
| Installable | Web App Manifest |
| Offline Support | Service Worker |
| Icons | Multiple sizes |

---

## Project Structure

```
trainsurf/
├── public/
│   ├── data/
│   │   └── stations.json        # Offline station database
│   ├── train-icon-*.png         # PWA icons
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── ui/                  # Shadcn UI components
│   │   ├── Header.tsx           # App header
│   │   ├── Logo.tsx             # Brand logo
│   │   ├── LoadingSpinner.tsx   # Loading states
│   │   ├── ResultsDisplay.tsx   # Algorithm results
│   │   ├── SegmentCard.tsx      # Journey segment
│   │   └── StationAutocomplete.tsx  # Station search
│   ├── hooks/
│   │   ├── use-mobile.tsx       # Mobile detection
│   │   └── use-toast.ts         # Toast notifications
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts        # Supabase client
│   │       └── types.ts         # Database types
│   ├── pages/
│   │   ├── Auth.tsx             # Login/Signup/Forgot
│   │   ├── Dashboard.tsx        # Main search page
│   │   ├── History.tsx          # Search history
│   │   ├── Sandbox.tsx          # Test mode
│   │   └── NotFound.tsx         # 404 page
│   ├── types/
│   │   └── trainsurf.ts         # App types
│   ├── App.tsx                  # App root
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── supabase/
│   ├── config.toml              # Supabase config
│   ├── functions/
│   │   └── trainsurf/
│   │       └── index.ts         # Edge function
│   └── migrations/              # Database migrations
├── index.html
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.3.4 or higher
- [Node.js](https://nodejs.org/) v18+ (for some tools)
- RapidAPI account with IRCTC API subscription

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd trainsurf
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   
   The `.env` file is auto-generated by Supabase. Required secrets:
   - `RAPIDAPI_KEY` - Your RapidAPI key for IRCTC access

4. **Start development server**
   ```bash
   bun run dev
   ```

5. **Open the app**
   ```
   http://localhost:5173
   ```

### Building for Production

```bash
bun run build
```

The build output will be in the `dist/` directory.

---

## API Integration

### IRCTC API (via RapidAPI)

TrainSurf uses the IRCTC API through RapidAPI for:

1. **Get Train Route**
   ```
   GET /api/v1/getTrainRoute
   Headers: x-rapidapi-key, x-rapidapi-host
   Params: trainNo
   ```

2. **Check Seat Availability**
   ```
   GET /api/v3/checkSeatAvailability
   Headers: x-rapidapi-key, x-rapidapi-host
   Params: trainNo, fromStation, toStation, date, classType, quota
   ```

### Edge Function

The `trainsurf` edge function handles:
- Route fetching
- Availability checking
- Algorithm execution
- Error handling

Located at: `supabase/functions/trainsurf/index.ts`

---

## Database Schema

### Tables

#### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Auth user reference |
| email | text | User email |
| created_at | timestamptz | Creation timestamp |

#### `search_history`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Auth user reference |
| train_no | text | Train number |
| source | text | Source station code |
| destination | text | Destination station code |
| journey_date | date | Travel date |
| class_type | text | Travel class |
| quota | text | Booking quota |
| seat_changes | integer | Number of seat changes |
| success | boolean | Path found status |
| segments | jsonb | Journey segments |
| created_at | timestamptz | Search timestamp |

### Row Level Security (RLS)

All tables have RLS enabled:
- Users can only view/edit their own data
- Policies use `auth.uid() = user_id`

---

## Security

### Best Practices Implemented

1. **Authentication**
   - Email/password via Supabase Auth
   - Secure password requirements (8+ chars, letters + numbers)
   - Email redirect validation

2. **API Security**
   - API keys stored as Supabase secrets
   - Edge functions handle sensitive requests
   - CORS properly configured

3. **Data Protection**
   - RLS on all tables
   - User data isolation
   - No sensitive data in client

4. **Input Validation**
   - Client-side validation
   - Server-side validation in edge functions
   - Sanitized inputs

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## License

This project is for educational and personal use. The IRCTC API is subject to RapidAPI terms of service.

---

## Acknowledgments

- Indian Railways for the extensive rail network
- RapidAPI for API hosting
- Supabase for backend infrastructure
- Shadcn for the beautiful UI components

---

<p align="center">
  Made with ❤️ by Jaya Soorya for Indian Railway Travelers
</p>
