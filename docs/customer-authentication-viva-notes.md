# Customer Registration and AI Access - Viva Notes

## Why was authentication added?

The AI module needs to know which customer is requesting support. A visitor must therefore create an account or log in before opening the package recommendation and AI chat pages. This also allows vehicle details and AI recommendation history to be linked to the correct customer.

## Registration flow

1. The customer opens `register.html`.
2. JavaScript sends the form data to `/api/register` as JSON.
3. Flask validates the name, username, email, phone, vehicle and password.
4. Werkzeug converts the password into a secure hash.
5. SQLite saves the customer account in the `users` table.
6. The customer is redirected to the login page.

## Login flow

1. The customer enters a username and password in `login.html`.
2. JavaScript sends the credentials to `/api/login`.
3. Flask finds the user and checks the password hash.
4. A server session is created after a successful login.
5. Customers are redirected to `customer-ai.html`.

## Protecting the AI feature

The `login_required` decorator checks the server session before `/api/recommend` or `/api/assistant` can run. An unauthenticated request receives HTTP status `401`. Flask also redirects direct visits to the secure AI pages back to the login page.

## Database tables

- `users` stores the customer profile, vehicle details, password hash, role and dates.
- `ai_requests` stores the logged-in user's AI request type and result summary.

## Important security point

Passwords are never stored as normal text. `generate_password_hash()` stores a hash, and `check_password_hash()` verifies the password during login.
