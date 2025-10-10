# Student-Teacher Appointment System

A comprehensive React application for managing student-teacher appointments with role-based access control and Firebase backend integration.

## Features

### 🔐 Authentication & Authorization

### 👨‍🎓 Student Features

### 👨‍🏫 Teacher Features

### 👨‍💼 Admin Features

## Admin Approval System

### How It Works

1. **Student Registration**:
   - Students register with email, password, name, student ID, and phone
   - Registration is automatically marked as "pending approval"
   - Students cannot login until approved by an admin

2. **Admin Review Process**:
   - Admins can view all pending student registrations
   - Each registration shows student details (name, email, student ID, phone, registration date)
   - Admins can approve or reject registrations

3. **Approval Actions**:
   - **Approve**: Student account is activated and can login immediately
   - **Reject**: Student account is marked as rejected with optional reason
   - **Refresh**: Check for new pending registrations

4. **Post-Approval**:
   - Approved students can login and access all student features
   - Rejected students cannot access the system
   - All actions are logged with timestamps

## Getting started (quick)

### How to create an admin (simple idea)

1. Register a new user using the app's registration form (this will create a student by default).
2. Go to your Firebase Console → Firestore Database → `users` collection.
3. Find the document for the newly registered user (document ID matches their UID).
4. Edit the document:
   - Change `role` to `admin`
   - Set `approved` to `true`
5. Now you can log in with this account as an admin.

### Default Admin Credentials


You can change these in Firebase Authentication and Firestore as needed.

These steps get the project running locally for development.

Prerequisites:
- Node.js (v16+ recommended) and npm installed
- A Firebase project (Firestore + Authentication). You can also use the Firebase Local Emulator Suite for local development.

Clone and install:

```powershell
git clone <your-repo-url>
cd studentTeacherAppointment
npm install
```

Configure Firebase:
- The project reads Firebase configuration from `src/config/firebase.js`. Replace the placeholder config with your Firebase project's config object (or update the file to read from environment variables).

Run the dev server:

```powershell
npm run dev
```

Open http://localhost:5173 (Vite default) in your browser.

## Development workflow (roles & flow)

High level workflow for how the application is used and developed:

- Registration
   - Students register via the `/register` page. Student accounts are created but flagged as `approved: false` and stored in `pendingRegistrations`.
   - Teachers and Admins are created by admins (or via the admin UI).

- Admin review
   - Admins visit the Admin Dashboard (`/admin`) → Student Approvals to approve or reject pending student registrations.
   - Approving sets `approved: true` on the student user document so the student can login.

- Teacher schedule & appointment flow
   - Teachers create schedule slots (date/time/duration/max students) in their Scheduler.
   - Students search for teachers and available slots, then book appointments.
   - Teachers review appointment requests and change status (approve/reject/complete/cancel).

- Messaging
   - Each appointment can have threaded messages between student and teacher using the `messages` collection.

## Project scripts

From the project root run with npm:

- `npm run dev` — start the Vite dev server (hot reload)
- `npm run build` — build production assets to `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint across the codebase

## Project structure (important files)

- `index.html` — app entry HTML
- `src/main.jsx` — app bootstrapping
- `src/App.jsx` — application routes and ProtectedRoute wrapper
- `src/config/firebase.js` — Firebase initialization (replace with your own config or switch to env variables)
- `src/context/AuthContext.jsx` — authentication context and helpers
- `src/components/` — feature components for Admin, Teacher, Student, Auth
- `src/services/` — API/service layer that talks to Firestore and Auth
- `src/styles/` (`index.css`, `App.css`) — global styles and Tailwind setup

## Environment & Firebase notes

- This repo currently includes a `src/config/firebase.js` file with a placeholder config. For production you should:
   - Remove hard-coded credentials and read them from environment variables, or
   - Use a separate, non-committed config file that your deployment injects.

- To use Firebase emulators (recommended for local dev):
   1. Install the Firebase CLI: `npm install -g firebase-tools`.
   2. Run `firebase emulators:start` in a directory with a `firebase.json` configured for `auth` and `firestore`.
   3. Modify `src/config/firebase.js` to call `connectAuthEmulator` and `connectFirestoreEmulator` in development when desired.

## Linting & quality

- ESLint is configured. Run:

```powershell
npm run lint
```

Fixes should be applied by developers before opening PRs.

## Building & deployment

- Build for production:

```powershell
npm run build
```

- Deploy the contents of `dist/` to any static host (Vercel, Netlify, GitHub Pages) or a Node-capable host if you add a server.

## Troubleshooting

- If you see Firebase initialization errors, check `src/config/firebase.js` and ensure the config values are correct and the Firebase project exists.
- If authentication looks successful but the UI behaves as if the user is not logged in, check the Firestore `users` document for the user: `approved` must be `true` for students to gain access.
- If linting fails on CI, run `npm install` locally and then `npm run lint` to reproduce and fix issues.

## Contributing

- Fork the repo, create a branch, add tests for new features if possible, and open a PR with a clear description.

## Notes

- There are no automated tests included with the starter project. Adding unit/integration tests (Jest, React Testing Library) is recommended before production.

---

If you want, I can also:

- Convert `src/config/firebase.js` to read config from environment variables and add a sample `.env.example` file.
- Add a short GitHub Actions workflow that runs `npm ci && npm run lint` on PRs.
### Admin Dashboard Features

- **Overview Tab**: System statistics and quick action buttons
- **Student Approvals Tab**: Manage pending student registrations
- **Teacher Management Tab**: View and edit teacher information
- **Real-time Updates**: Statistics refresh automatically
- **Error Handling**: Comprehensive error messages and loading states

## Technology Stack

- **Frontend**: React 19, React Router DOM 6
- **Styling**: Tailwind CSS with custom component classes
- **Backend**: Firebase (Authentication + Firestore)
- **Build Tool**: Vite
- **Package Manager**: npm

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project setup

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd studentTeacherAppointment
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Update `src/config/firebase.js` with your Firebase credentials
   - Set up Firestore database with appropriate security rules

4. Start the development server:
```bash
npm run dev
```

### Demo Credentials

The system includes demo accounts for testing:

- **Admin**: admin@university.edu / admin123
- **Teacher**: john.smith@university.edu / teacher123  
- **Student**: alice.brown@student.edu / student123

## Firebase Collections

### Users Collection
- Stores user profiles with role-based access control
- Students require admin approval before login
- Teachers are automatically approved

### Pending Registrations Collection
- Tracks student registrations awaiting approval
- Includes status tracking (pending, approved, rejected)
- Timestamps for all approval actions

## Security Features

- **Role-based routing** prevents unauthorized access
- **Firebase security rules** protect data at the database level
- **Input validation** on all forms
- **Protected API endpoints** for admin functions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
