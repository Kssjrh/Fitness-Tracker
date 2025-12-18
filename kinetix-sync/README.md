# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/22116321-77fa-4a59-929a-f2de9fa63d66

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/22116321-77fa-4a59-929a-f2de9fa63d66) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Backend (Express + MongoDB)

The project now includes a backend at `server/` with Express, MongoDB (Mongoose), and JWT auth.

### Setup

1. Install backend deps and start the server:

```
cd server
npm install
npm run dev
```

2. Environment variables

Create a `.env` file in `server/` with:

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/kinetix_sync
JWT_SECRET=change_this_in_prod
```

3. MongoDB Compass

- Open MongoDB Compass and connect to `mongodb://127.0.0.1:27017`
- Database name: `kinetix_sync`

### API

- POST `/api/auth/register` { name, email, password, age?, gender?, height?, weight?, goals? }
- POST `/api/auth/login` { email, password }
- GET `/api/auth/me` (Bearer token)
- POST `/api/workouts` (Bearer) { date, type, duration, intensity, calories, notes? }
- GET `/api/workouts` (Bearer)
- DELETE `/api/workouts/:id` (Bearer)

## Frontend config

Set the API base URL via Vite env var. Create `kinetix-sync/.env.local` with:

```
VITE_API_URL=http://localhost:5000
```

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/22116321-77fa-4a59-929a-f2de9fa63d66) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
