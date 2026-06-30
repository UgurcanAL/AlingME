# 🚀 AlignME Database Setup Guide

This guide will help you set up the AlignME database with all the models, migrations, and sample data from your TARDIS design.

## 📋 Prerequisites

1. **PostgreSQL** installed and running
2. **Node.js** (v18 or higher)
3. **npm** package manager

## 🔧 Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your database credentials
# Update the DATABASE_URL or individual DB_* variables
```

### 3. Setup Database (Full Setup)

```bash
# This will run migrations and seed data
npm run db:setup
```

## 🛠️ Individual Commands

### Run Migrations Only

```bash
npm run db:migrate
```

### Run Seeds Only (after migrations)

```bash
npm run db:seed
```

### Reset Database (⚠️ Destructive!)

```bash
npm run db:reset
```

### Show Help

```bash
npm run setup-db -- --help
```

## 📊 What Gets Created

### Database Tables:

- **users** - User accounts (seekers, employers, admins)
- **seeker_profiles** - Detailed seeker information
- **education** - Academic history
- **work_experiences** - Professional background
- **jobs** - Job postings from employers
- **applications** - Job applications and tracking

### Sample Data Includes:

- **Uğurcan AL** (your profile) - Senior Full Stack Developer
- **John Smith** (Time Lord) - Universe protection specialist
- **Clara Oswald** (Teacher) - English Literature educator
- **Sarah Connor** (Employer) - Cyberdyne Systems
- **Amy Pond** (Employer) - Leadworth Hospital

### Sample Jobs:

- Senior Software Engineer - AI Defense Systems
- Staff Nurse - Emergency Department
- Frontend Developer - User Interface Design

## 🔍 Verifying Setup

After running the setup, you should see:

```
✅ Database connection established
✅ Database schema synchronized
✅ Created user: Uğurcan AL
✅ Created user: Sarah Connor
✅ Created user: John Smith
... (more users and data)
🎉 Full database setup completed successfully!
📊 Your AlignME database is ready to use!
```

## 🚨 Troubleshooting

### Connection Issues

- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists (create it manually if needed)

### Permission Issues

- Check database user has CREATE privileges
- Verify connection string format

### Module Import Errors

- Run `npm run build` to compile TypeScript
- Ensure all dependencies are installed

## 🔄 Development Workflow

1. **Make model changes** in `src/data/models/`
2. **Run migrations** with `npm run db:migrate`
3. **Update seed data** in `src/seeds/DatabaseSeeder.ts`
4. **Re-seed** with `npm run db:seed`

## 🎯 Next Steps

After database setup is complete:

1. **Start the server**: `npm run dev`
2. **Check API endpoints** at http://localhost:3000
3. **View the dashboard** at http://localhost:3000/dashboard.html
4. **Test authentication** with sample users

## 📚 Database Schema

The schema supports the full TARDIS job matching platform:

- **User Management**: Authentication, roles, verification
- **Seeker Profiles**: Skills, experience, preferences
- **Job Matching**: Requirements, applications, tracking
- **Rich Metadata**: Education, work history, portfolios

## 🔐 Security Features

- **Password hashing** with bcrypt
- **Email verification** system
- **Role-based access** (seeker/employer/admin)
- **Data validation** and sanitization
- **Audit trails** for applications

---

Happy coding! 🎉 Your TARDIS-themed job platform database is ready to go!
