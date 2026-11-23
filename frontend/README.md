# Smart Roster Management System — Frontend

The frontend application for the Smart Roster Management System, providing an admin interface to manage employees, Pods, brands, processes, allocations, working rules, availability, rosters, and scheduling conflicts.

## Tech Stack

- **Frontend:** React.js
- **Build Tool:** Vite
- **Language:** JavaScript (JSX)
- **State Management:** Redux Toolkit
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS

## Features

- Dashboard overview
- Employee and Pod management
- Brand and Process management
- Employee allocations
- Working rules configuration
- Employee availability management
- Monthly roster generation and management
- Roster views and manual assignment updates
- Conflict detection, validation, and resolution

## Project Structure

```text
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── allocation/
│   │   ├── availability/
│   │   ├── brands/
│   │   ├── common/
│   │   ├── employee/
│   │   ├── layout/
│   │   ├── pod/
│   │   ├── process/
│   │   ├── roster/
│   │   └── workingRule/
│   ├── pages/
│   ├── utils/
│   │   ├── redux/
│   │   ├── validations/
│   │   └── axiosInstance.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── .env.example
├── package.json
└── vite.config.js
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-name>/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
VITE_BACKEND_URL=/api
```

### 4. Start the development server

```bash
npm run dev
```

The frontend will be available at the URL provided by Vite, usually:

```text
http://localhost:5173
```

## Architecture

The frontend follows a modular component-based architecture. Feature-specific components are organized into separate directories, while shared components, Redux state management, API configuration, and validation logic are maintained independently.

---

**Project:** Smart Roster Management System  
**Application:** Frontend  
**Status:** Implemented
