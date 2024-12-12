
# MERN Stack Google Calender

A Dashboard with an google calender event crud feature with google sso

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/prabhattopi/calender_events
```

### Navigate to the Project Directory For Backend

```bash
cd backend
```

### Add variables in .env file 

You can get this variables in google console and mogodb uri either use local or atlas

```bash
PORT=3000
MONGO_URI=
GOOGLE_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_REDIRECT_URI=

```

### Run the Application

To start the application in development mode:

```bash
npm run dev
```

### Navigate to the Project Directory For Fronted

```bash
cd frontend
```
### Add variables in .env file 

You can get this variables in google console

```bash
VITE_API_GOOGLE_CLIENT_ID=
VITE_API_BACKEND_URL=http://localhost:3000/api

```

### Run the Application

To start the application in development mode:

```bash
npm run dev
```