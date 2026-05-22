# Test Credentials

## Seeded Accounts (auto-created on backend startup)

### Admin
- Username: `admin`
- Password: `admin123`
- Role: admin
- Access: `/admin/*` routes

### Student
- Username: `student`
- Password: `student123`
- Role: student
- Access: `/` student routes

## Notes
- Both demo credentials are visible on the login screen for easy testing.
- Login is **username + password** only (no email).
- New registrations default to `role: student`.
- Change password endpoint: `POST /api/auth/change-password` with `{ current_password, new_password }`.
