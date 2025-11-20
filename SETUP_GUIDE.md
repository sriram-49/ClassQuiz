# Quiz Platform Setup Guide

## ✅ Implementation Complete!

Your React quiz application now has a **SQLite database backend** for persistent data storage.

## 📁 Project Structure

```
classquiz (2)/
├── backend/                 # Node.js + Express + SQLite backend
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   ├── quiz.db            # SQLite database (auto-created)
│   └── README.md          # Backend documentation
├── src/
│   ├── services/
│   │   ├── authService.ts    # ✅ Updated to use API
│   │   └── quizService.ts    # ✅ Updated to use API
│   ├── components/
│   └── ...
└── package.json           # React app dependencies
```

## 🚀 How to Run

### 1. Start the Backend Server

Open a terminal and run:

```bash
cd "d:\Sem 5\Project\NBA\classquiz (2)\backend"
npm run dev
```

You should see:
```
✅ Server running on http://localhost:5000
✅ Database: quiz.db
Connected to SQLite database
Database tables initialized
```

**Keep this terminal running!**

### 2. Start the React Frontend

Open a **new terminal** and run:

```bash
cd "d:\Sem 5\Project\NBA\classquiz (2)"
npm run dev
```

The app will open at `http://localhost:3000`

## ✨ What Changed?

### Before (LocalStorage)
- ❌ Data stored only in browser
- ❌ Data lost on clearing browser cache
- ❌ No real authentication
- ❌ Can't share data between users

### After (SQLite Backend)
- ✅ Data stored in database file
- ✅ Data persists permanently
- ✅ Real JWT authentication
- ✅ Multi-user support
- ✅ Proper security with password hashing

## 🎯 Features

### Authentication
- User registration with email/password
- Secure login with JWT tokens
- Password hashing with bcrypt
- Role-based access (Instructor/Student)

### Quiz Management
- Create quizzes with AI (Gemini integration still available)
- Unique quiz codes
- Auto-grading based on correct answers
- Timer functionality
- Multiple difficulty levels

### Results & Analytics
- Student attempt history
- Instructor can view all quiz results
- Detailed scoring breakdown
- Registration number tracking for students

## 🧪 Testing the App

### Test as Instructor:
1. Register a new account with role "Instructor"
2. Create a quiz (you can use AI generation if Gemini API is configured)
3. Note the quiz code
4. View quiz results dashboard

### Test as Student:
1. Register a new account with role "Student"
2. Enter the quiz code from instructor
3. Take the quiz
4. View your results and history

## 🔒 Security

- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens for authentication
- Token expires after 24 hours
- CORS enabled for localhost development
- Input validation on all endpoints

## 📊 Database

The database file `quiz.db` is created automatically in the backend folder.

**To view the database:**
- Download [DB Browser for SQLite](https://sqlitebrowser.org/)
- Open `d:\Sem 5\Project\NBA\classquiz (2)\backend\quiz.db`

**To reset everything:**
```bash
cd "d:\Sem 5\Project\NBA\classquiz (2)\backend"
rm quiz.db
# Restart the server - database will be recreated
```

## 🛠️ API Endpoints

All endpoints are documented in `backend/README.md`

Base URL: `http://localhost:5000/api`

- **Auth**: `/auth/register`, `/auth/login`
- **Quizzes**: `/quizzes`, `/quizzes/instructor`, `/quizzes/code/:code`
- **Attempts**: `/attempts`, `/attempts/student`, `/quizzes/:id/results`

## 🐛 Troubleshooting

### Backend won't start
```bash
# Make sure you're in the backend folder
cd "d:\Sem 5\Project\NBA\classquiz (2)\backend"

# Install dependencies
npm install

# Try starting again
npm run dev
```

### Frontend can't connect to backend
- Check backend is running on http://localhost:5000
- Check browser console for CORS errors
- Make sure both servers are running

### Database errors
- Delete `quiz.db` and restart the server
- Check file permissions in the backend folder

### "Token expired" errors
- Log out and log in again
- Tokens expire after 24 hours

## 📝 Next Steps

### Optional Enhancements:
1. **Add Gemini AI Integration to Backend**
   - Move AI quiz generation to backend
   - Add endpoint `/api/quizzes/generate`

2. **Add More Features**
   - Quiz editing
   - Quiz duplication
   - Archive/unarchive quizzes
   - Export results to CSV

3. **Improve Security**
   - Add rate limiting
   - Implement refresh tokens
   - Add password reset functionality

4. **Production Deployment**
   - Use environment variables
   - Set up HTTPS
   - Use a production database (PostgreSQL/MySQL)

## 💡 Tips

- The backend runs on port **5000**
- The frontend runs on port **3000**
- Both must be running simultaneously
- Database is in `backend/quiz.db`
- Check backend terminal for API logs

## ✅ Verification Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can register a new user
- [ ] Can login successfully
- [ ] Can create a quiz as instructor
- [ ] Can take a quiz as student
- [ ] Results are saved and viewable
- [ ] Data persists after browser refresh

---

**🎉 Your quiz platform is now fully functional with SQLite database integration!**
