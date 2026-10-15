# FixNear Backend (Module 1)

This backend provides customer registration/login, profile viewing/updating, verified provider search, provider details, and comparison of 2–4 providers.

## Requirements

- Node.js installed
- XAMPP MySQL running
- The existing `fixnear_db` database and its `users` and `providers` tables

## 1. Install packages

Open a terminal in this folder and run:

```bash
npm install
```

## 2. Configure `.env`

Check the database username/password and port. The default settings assume XAMPP MySQL uses `root` with an empty password on port `3306`.

Before real use, replace `JWT_SECRET` with a long random secret. Never upload `.env` to GitHub.

## 3. Start the server

```bash
npm run dev
```

The server tests the MySQL connection before listening on port 5000.

Open http://localhost:5000 to test the basic API response.

## API endpoints

- `POST /api/auth/register` — create a customer account
- `POST /api/auth/login` — log in and receive a JWT
- `GET /api/profile` — get the signed-in user's profile; requires `Authorization: Bearer YOUR_TOKEN`
- `PUT /api/profile` — update the signed-in user's name, phone, city, and area; requires a JWT
- `GET /api/providers?category=Plumber&city=Dhaka&area=Mirpur` — search verified providers
- `GET /api/providers/1` — get a verified provider by ID
- `GET /api/providers/compare?ids=1,2` — compare 2–4 verified providers

## Registration JSON example

```json
{
  "name": "Test Customer",
  "email": "customer@example.com",
  "password": "testpass123",
  "phone": "01700000000",
  "city": "Dhaka",
  "area": "Mirpur"
}
```

## Important notes

- This code assumes the existing database has the `users` and `providers` tables described in your project setup.
- Provider search only returns providers where `is_verified = TRUE`.
- New registrations always use the `customer` role. Provider/admin registration should be controlled by a separate verification/admin workflow.
- This starter version uses bearer tokens returned to the frontend. For a production deployment, consider HttpOnly secure cookies, rate limiting, stronger validation, and a managed secret.
- `models/` is reserved for later refactoring; SQL queries currently live in the controllers to keep the first module straightforward.
