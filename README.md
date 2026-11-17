# Smart Roster Management System

A backend application for managing employees, teams, client-specific working rules, and monthly workforce rosters.

The Smart Roster Management System is designed for operations and customer experience (CX) teams that manage multiple brands, processes, and employee schedules. It aims to simplify roster generation, identify scheduling conflicts, and maintain adequate staffing coverage.

## Technology Stack

- **Runtime:** Node.js
- **Backend Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **API Style:** REST API
- **Language:** JavaScript

## Core Features

The project is organized around six core functional modules.

### A. Team, Brand and Process Management

Manage the organizational structure and workforce information.

- Create, retrieve, update, and manage employee records.
- Organize employees into Pods (teams).
- Assign Pod leads.
- Manage multiple brands and their associated processes.
- Allocate employees to specific brand and process combinations.
- Manage employee and organizational statuses.

### B. Client-Specific Working Rules

Configure working schedules and staffing requirements for different brands and processes.

- Define operating days for each brand and process.
- Configure whether operations continue on public holidays.
- Define minimum staffing requirements for different days.
- Support different working rules for different client operations.

### C. Monthly Roster Generation

Generate monthly employee schedules based on operational requirements and employee availability.

- Generate rosters for a selected month.
- Consider employee allocations and working patterns.
- Account for weekly offs, approved leaves, and holidays.
- Maintain required staffing levels.
- Store generated rosters for further review and editing.

### D. Conflict Detection and Validation

Identify scheduling issues and validate roster correctness.

- Detect employees assigned to multiple processes on the same day.
- Identify assignments during approved leave or unavailability.
- Detect weekly-off and holiday scheduling conflicts.
- Validate minimum staffing requirements.
- Identify uncovered processes or insufficient staffing.

### E. Roster Views and Editing

Provide different ways to retrieve and manage roster information.

- Company-level roster view.
- Pod-level roster view.
- Brand-level roster view.
- Process-level roster view.
- Employee-level roster view.
- Support manual roster modifications with validation.

### F. Handling Changes

Handle changes that occur after a roster has been generated.

- Update employee availability and leave information.
- Modify existing roster assignments.
- Revalidate rosters after manual changes.
- Detect newly introduced conflicts.
- Maintain consistency in staffing coverage.

## Backend Project Structure

```text
server/
├── config/
│   └── database.js
├── controllers/
│   ├── employeeController.js
│   └── podController.js
├── models/
│   ├── Employee.js
│   ├── Pod.js
│   ├── Brand.js
│   ├── Process.js
│   ├── Allocation.js
│   ├── WorkingRule.js
│   ├── Availability.js
│   ├── EmployeeWorkPattern.js
│   ├── Roster.js
│   └── RosterEntry.js
├── routes/
│   ├── employeeRoutes.js
│   └── podRoutes.js
├── services/
├── seed/
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

## Database Models

| Model               | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| Employee            | Stores employee information and Pod assignment.            |
| Pod                 | Stores team details and optional Pod lead information.     |
| Brand               | Stores client/brand information.                           |
| Process             | Stores operational process information.                    |
| Allocation          | Connects employees with brands and processes.              |
| WorkingRule         | Defines brand- and process-specific working rules.         |
| Availability        | Tracks employee leave and unavailability.                  |
| EmployeeWorkPattern | Stores employee working days and weekly offs.              |
| Roster              | Stores monthly roster details and status.                  |
| RosterEntry         | Stores individual employee assignments for specific dates. |

## API Development Progress

| Module                            | Status      |
| --------------------------------- | ----------- |
| Employee Management APIs          | Implemented |
| Pod Management APIs               | Implemented |
| Brand Management APIs             | Pending     |
| Process Management APIs           | Pending     |
| Employee Allocation APIs          | Pending     |
| Working Rules APIs                | Pending     |
| Availability APIs                 | Pending     |
| Monthly Roster Generation         | Pending     |
| Conflict Detection and Validation | Pending     |
| Roster Views and Editing          | Pending     |
| Post-Generation Changes           | Pending     |

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
```

### 2. Navigate to the backend directory

```bash
cd <repository-name>/server
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the `server` directory.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Refer to `.env.example` for the required environment variables.

### 5. Start the server

```bash
npm run dev
```

The backend server will run on:

```text
http://localhost:5000
```

## Development Approach

The backend is being developed in a modular manner, keeping data relationships, business rules, and roster validation separate.

The implementation prioritizes:

- Maintainable backend architecture.
- Clear relationships between employees, Pods, brands, and processes.
- Accurate scheduling and staffing coverage.
- Reliable conflict detection.
- Validation of manual changes after roster generation.

## Project Scope

This repository currently focuses on backend development and REST API implementation. Frontend development and user interface integration are outside the scope of the current backend implementation.

---

**Project:** Smart Roster Management System  
**Status:** Backend Development in Progress
