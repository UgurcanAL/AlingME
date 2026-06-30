# AlingME Login Application

A modern web application featuring a TARDIS-themed user interface with secure authentication and profile management.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with:

```
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=tardis_db

# JWT
JWT_SECRET=your_secret_key
```

3. Start the development server:

```bash
npm run dev
```

## Features

- TARDIS-themed UI with Gallifreyan-inspired design elements
- Secure user authentication
- Profile management for seekers and employers
- PostgreSQL database for data persistence
- JWT-based authentication
- Responsive design for all screen sizes

## Project Structure

```
AlingME-app/
├── src/
│   ├── config/        # Configuration files
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── middleware/    # Custom middleware
│   └── server.js      # Main server file
├── public/
│   ├── css/          # Stylesheets
│   ├── js/           # Client-side JavaScript
│   └── index.html    # Main HTML file
└── package.json
```

## API Endpoints

- POST /api/users/register - Register new user
- POST /api/users/login - User login
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update user profile

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
