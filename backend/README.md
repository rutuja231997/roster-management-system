# Smart Roster Management System

A backend application for managing employees, teams, brands, processes, and monthly workforce rosters. It helps operations teams generate schedules, maintain staffing requirements, and identify roster conflicts.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **API:** REST
- **Language:** JavaScript

## Features

- Employee, Pod, Brand, and Process management
- Employee allocation to Brand–Process combinations
- Configurable working rules and staffing requirements
- Employee work patterns, weekly offs, and availability management
- Monthly roster generation
- Roster validation and conflict detection
- Roster views and manual assignment updates
- Revalidation after roster or availability changes

## Database Models

| Model               | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| Employee            | Stores employee details and Pod assignment                  |
| Pod                 | Manages teams and Pod leads                                 |
| Brand               | Stores client/brand information                             |
| Process             | Stores operational processes                                |
| Allocation          | Defines employee eligibility for Brand–Process combinations |
| WorkingRule         | Defines operating days and staffing requirements            |
| Availability        | Tracks employee leave and unavailability                    |
| EmployeeWorkPattern | Stores working days and weekly offs                         |
| Roster              | Represents a monthly roster                                 |
| RosterEntry         | Stores individual daily assignments                         |
| RosterConflict      | Stores detected scheduling conflicts                        |

## Project Structure

```text
backend/
├── config/
├── controllers/
├── models/
├── routes/
├── services/
├── utils/
├── seed/
├── app.js
├── server.js
├── .env.example
└── package.json
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-name>/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
PORT=5000
DATABASE_URL=your_mongodb_connection_string
```

Refer to `.env.example` for the required configuration.

### 4. Start the server

```bash
npm run dev
```

The server runs at:

```text
http://localhost:5000
```

## Development Approach

The backend follows a modular architecture, separating models, routes, controllers, and business logic.

The system prioritizes accurate staffing coverage, configurable working rules, and reliable roster validation.

---

**Project Status:** Backend implemented  
**Project:** Smart Roster Management System
