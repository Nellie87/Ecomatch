# Entity Matching System - Frontend

A Human-in-the-Loop AI Entity Matching System built with React, TypeScript, and Tailwind CSS.

## Features

- ✅ **Admin Dashboard**: View system performance metrics, charts, and reviewer leaderboard
- ✅ **Reviewer Screen**: Interactive match review interface with keyboard shortcuts
- ✅ **Analytics Dashboard**: Track model performance improvements and feedback
- ✅ **Match Management**: Search, filter, and manage all reviewed matches with undo functionality
- ✅ **Mock Data**: Fully functional with simulated data - no backend required

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

## Usage

### Navigation
Use the top navigation bar to switch between views:
- **Admin**: Overview dashboard with metrics
- **Review**: Interactive match review interface
- **Analytics**: Performance tracking and feedback
- **Management**: Browse and manage all reviewed matches

### Reviewer Screen Features

**Keyboard Shortcuts:**
- `C` - Confirm match
- `X` - Reject match (opens dialog to select reason)
- `M` - Merge match
- `D` - Split match
- `N` - Skip to next match

**Actions:**
- Click "Why this match?" to see AI explanation panel
- Use buttons to confirm, reject, merge, or split matches
- View side-by-side comparison of all record sources

### Match Management Features

**Search:**
- Search by company name, VAT number, or reviewer name

**Filters:**
- Filter by confidence level (High >90%, Low <80%)
- Filter by date (This Week, Last 30 Days)
- Filter by status (All, Confirmed, Rejected, Needs Review)

**Actions:**
- Click the chevron to expand/collapse match details
- Click "Undo" to reverse a review decision

## Project Structure

```
T6/
├── App.tsx              # Main application component
├── components/          # React components
│   ├── AdminDashboard.tsx
│   ├── ReviewerScreen.tsx
│   ├── FeedbackDashboard.tsx
│   ├── MatchManagement.tsx
│   └── ui/             # shadcn/ui components
├── contexts/           # React Context for state management
│   └── MatchContext.tsx
├── mockData.ts         # Mock data for all entities
├── globals.css         # Global styles and Tailwind
└── src/
    └── main.tsx        # Application entry point
```

## Mock Data

The application uses mock data from `mockData.ts`:
- `currentMatchPairs`: Pending matches to review
- `reviewedMatches`: Already reviewed matches
- `performanceMetrics`: System performance data
- `reviewerLeaderboard`: Reviewer statistics

All data is stored in React Context and persists during the session.

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icons
- **Sonner** - Toast notifications

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Notes

- All data is stored in memory (React Context) - refreshing the page will reset to initial mock data
- No backend is required - everything runs on the frontend
- The application is fully interactive with all features implemented


