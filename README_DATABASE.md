# StudyFlow Database Integration

## Overview
This project has been integrated with a MySQL database to store chat history, user data, tasks, notes, schedule, and more.

## Setup Instructions

### 1. Database Setup

1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Click on "Import" tab
3. Select the file `database/schema.sql`
4. Click "Go" to import the database schema

Alternatively, you can run the SQL file from command line:
```bash
mysql -u root -p < database/schema.sql
```

### 2. Database Configuration

The database configuration is in `api/config/database.php`. Default settings:
- Host: localhost
- Username: root
- Password: (empty)
- Database: studyflow

If your MySQL credentials are different, update the configuration file accordingly.

### 3. Default Users

After importing the schema, two default users are created:

**Admin:**
- Username: admin
- Password: admin123

**Student:**
- Username: student
- Password: student123

### 4. API Endpoints

All API endpoints are located in the `api/` directory:

| Endpoint | Description |
|----------|-------------|
| `api/auth.php` | User authentication (login, register, profile) |
| `api/chat.php` | Chat history management |
| `api/tasks.php` | Task CRUD operations |
| `api/notes.php` | Notes CRUD operations |
| `api/schedule.php` | Schedule events CRUD |
| `api/subjects.php` | Subjects CRUD |
| `api/timer.php` | Timer session tracking |

### 5. Frontend Integration

To connect your frontend to the database API:

1. Include the API client script in your HTML:
```html
<script src="api/client.js"></script>
```

2. Use the API client methods:
```javascript
// Login
await api.login('username', 'password');

// Get tasks
const tasks = await api.getTasks();

// Create a task
await api.createTask({ title: 'New Task', subject: 'Math' });

// Save chat message
await api.saveChatMessage('User question', 'Bot response', 'gpt-4');

// Logout
api.logout();
```

### 6. Migration from localStorage

If you have existing data in localStorage, you can migrate it to the database:

```javascript
// After logging in, call the migration function
await migrateLocalStorageToDB();
```

## File Structure

```
StudyFlow/
├── api/
│   ├── config/
│   │   └── database.php      # Database connection
│   ├── utils/
│   │   └── helpers.php       # Helper functions
│   ├── auth.php              # Authentication API
│   ├── chat.php              # Chat history API
│   ├── tasks.php             # Tasks API
│   ├── notes.php             # Notes API
│   ├── schedule.php          # Schedule API
│   ├── subjects.php          # Subjects API
│   ├── timer.php             # Timer API
│   └── client.js             # Frontend API client
├── database/
│   └── schema.sql            # Database schema
└── [HTML files]
```

## Security Notes

1. **Change default passwords** after first login
2. For production, update the CORS settings in `api/utils/helpers.php` to restrict allowed origins
3. Consider implementing rate limiting for API endpoints
4. Use HTTPS in production
5. Update database credentials in `api/config/database.php` for your environment

## Troubleshooting

### Database Connection Failed
- Verify MySQL is running
- Check credentials in `api/config/database.php`
- Ensure the `studyflow` database exists

### CORS Errors
- The API includes CORS headers for all origins by default
- For production, restrict allowed origins in `api/utils/helpers.php`

### Authentication Failed
- Ensure you're sending the correct headers (Authorization or X-User-Id)
- Verify the user exists in the database
