# Smart Roster Management System — Backend

## 1. Backend Overview

The Smart Roster Management System backend is built to manage employees, Pods (teams), brands, processes, employee allocations, working rules, employee availability, and monthly rosters.

The backend provides the APIs and business logic required to generate monthly employee rosters while considering:

- Employee availability and approved leaves.
- Employee weekly offs and work patterns.
- Brand-specific and process-specific working rules.
- Public holidays and operating calendars.
- Minimum staffing requirements.
- Employee allocations across brands and processes.
- Roster conflicts and staffing coverage.
- Manual roster changes and post-generation updates.

### Backend Technology Stack

| Technology | Purpose                                |
| ---------- | -------------------------------------- |
| Node.js    | JavaScript runtime                     |
| Express.js | Backend framework and API development  |
| MongoDB    | NoSQL database                         |
| Mongoose   | MongoDB object modeling and validation |
| JavaScript | Backend application logic              |

---

## 2. Backend Development Status

### Overall Progress

| Module                   | Progress                                 | Status       |
| ------------------------ | ---------------------------------------- | ------------ |
| Database Models          | 10 models created                        | Completed    |
| Employee Management      | Create, Read, Update and assignment APIs | Implemented  |
| Pod Management           | CRUD and Pod Lead assignment APIs        | Implemented  |
| Brand Management         | CRUD APIs                                | Implemented  |
| Process Management       | CRUD APIs                                | Implemented  |
| Employee Allocation      | Create, Read and Update APIs             | Implemented  |
| Working Rules            | Model created                            | Pending APIs |
| Employee Availability    | Model created                            | Pending APIs |
| Employee Work Patterns   | Model created                            | Pending APIs |
| Roster Management        | Models created                           | Pending APIs |
| Roster Generation        | Scheduling service not implemented       | Pending      |
| Conflict Detection       | Validation logic not implemented         | Pending      |
| Roster Views and Editing | APIs not implemented                     | Pending      |
| Deployment               | Not started                              | Pending      |

### Completed Backend Work

**Database Design**

- Created 10 Mongoose models.
- Defined relationships using MongoDB ObjectId references.
- Added required-field validation and unique constraints.
- Added timestamps to maintain record creation and update dates.

**Team, Brand and Process Management**

- Implemented Employee CRUD operations.
- Implemented Employee-Pod assignment and unassignment.
- Implemented Pod CRUD operations.
- Implemented Pod Lead assignment.
- Implemented Brand CRUD operations.
- Implemented Process CRUD operations.
- Implemented Employee-Brand-Process allocation operations.
- Combined resource detail updates and status updates into single update APIs where appropriate.

**Validation and Error Handling**

- Validated MongoDB ObjectIds.
- Added duplicate record checks.
- Validated references between Employee, Pod, Brand and Process.
- Added status validation for active and inactive records.
- Used Mongoose validation during update operations.
- Implemented appropriate HTTP status codes and error responses.

---

## 3. Backend Project Structure

backend/
│
├── src/
│ │
│ ├── config/
│ │ └── database.js
│ │
│ ├── models/
│ │ ├── Employee.js
│ │ ├── Pod.js
│ │ ├── Brand.js
│ │ ├── Process.js
│ │ ├── Allocation.js
│ │ ├── WorkingRule.js
│ │ ├── Availability.js
│ │ ├── EmployeeWorkPattern.js
│ │ ├── Roster.js
│ │ └── RosterEntry.js
│ │
│ ├── controllers/
│ │ ├── employeeController.js
│ │ ├── podController.js
│ │ ├── brandController.js
│ │ ├── processController.js
│ │ └── allocationController.js
│ │
│ ├── routes/
│ │ ├── employeeRoutes.js
│ │ ├── podRoutes.js
│ │ ├── brandRoutes.js
│ │ ├── processRoutes.js
│ │ └── allocationRoutes.js
│ │
│ ├── middleware/
│ │
│ ├── utils/
│ │ └── allocationHelpers.js
│ │
│ ├── seed/
│ │ ├── employeeSeed.js
│ │ └── runEmployeeSeed.js
│ │
│ └── app.js
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── package-lock.json

---

## 4. Database Models and Their Purpose

The backend uses 10 Mongoose models to organize the application's data and relationships.

### 4.1 Employee Model

**File:** `models/Employee.js`

**Purpose:** Stores employee information and basic employment status.

| Field        | Type     | Purpose                                         |
| ------------ | -------- | ----------------------------------------------- |
| firstName    | String   | Employee's first name                           |
| lastName     | String   | Employee's last name                            |
| email        | String   | Unique employee email                           |
| employeeCode | String   | Unique employee identification code             |
| podId        | ObjectId | Reference to assigned Pod; optional             |
| status       | String   | ACTIVE or INACTIVE                              |
| timestamps   | Date     | Automatically maintains createdAt and updatedAt |

**Important points:**

- Email must be valid.
- Email and employee code must be unique.
- Employee status defaults to ACTIVE.
- Pod assignment is optional during employee creation.
- An employee can have multiple allocations across different brands and processes.
- An employee belongs to one Pod at a time under the current design.

### 4.2 Pod Model

**File:** `models/Pod.js`

**Purpose:** Stores team or department information.

| Field          | Type     | Purpose                                   |
| -------------- | -------- | ----------------------------------------- |
| name           | String   | Unique Pod name                           |
| leadEmployeeId | ObjectId | Reference to the employee leading the Pod |
| description    | String   | Pod description                           |
| status         | String   | ACTIVE or INACTIVE                        |
| timestamps     | Date     | Creation and update dates                 |

**Important points:**

- Pod name must be unique.
- Pod Lead is optional during Pod creation.
- A Pod can contain multiple employees.
- Employees can be assigned to a Pod after their creation.
- A Pod Lead must belong to the same Pod.
- Pod Lead assignment is handled separately from Pod creation.

### 4.3 Brand Model

**File:** `models/Brand.js`

**Purpose:** Stores information about the different D2C brands supported by the company.

| Field       | Type   | Purpose                   |
| ----------- | ------ | ------------------------- |
| name        | String | Brand name                |
| description | String | Brand description         |
| status      | String | ACTIVE or INACTIVE        |
| timestamps  | Date   | Creation and update dates |

A brand can have multiple processes and multiple employee allocations.

### 4.4 Process Model

**File:** `models/Process.js`

**Purpose:** Stores reusable business processes handled by employees.

Examples:

- Customer Support
- Order Management
- Returns and Refunds
- Sales Support

| Field       | Type   | Purpose                   |
| ----------- | ------ | ------------------------- |
| name        | String | Process name              |
| description | String | Process description       |
| status      | String | ACTIVE or INACTIVE        |
| timestamps  | Date   | Creation and update dates |

A process can be reused across multiple brands.

### 4.5 Allocation Model

**File:** `models/Allocation.js`

**Purpose:** Connects an employee with a particular brand and process. It determines which employees are eligible to work on which brand-process combinations.

| Field      | Type     | Purpose                                    |
| ---------- | -------- | ------------------------------------------ |
| employeeId | ObjectId | Reference to Employee                      |
| brandId    | ObjectId | Reference to Brand                         |
| processId  | ObjectId | Reference to Process                       |
| isActive   | Boolean  | Indicates whether the allocation is active |
| timestamps | Date     | Creation and update dates                  |

**Important points:**

- One employee can have multiple allocations.
- Multiple employees can be allocated to the same brand and process.
- A compound unique index prevents duplicate employee-brand-process combinations.
- Existing inactive allocations should be reactivated rather than duplicated.
- Allocation represents ongoing eligibility, not a daily roster assignment.

**Example:**

Riya can be allocated to:

- Brand A → Customer Support
- Brand A → Returns
- Brand B → Customer Support

### 4.6 WorkingRule Model

**File:** `models/WorkingRule.js`

**Purpose:** Stores brand-specific and process-specific operating requirements.

| Field                    | Type     | Purpose                                         |
| ------------------------ | -------- | ----------------------------------------------- |
| brandId                  | ObjectId | Reference to Brand                              |
| processId                | ObjectId | Reference to Process                            |
| operatingDays            | Array    | Days on which the process operates              |
| operatesOnPublicHolidays | Boolean  | Whether the process operates on public holidays |
| minimumStaffing          | Array    | Minimum required employees for each day         |
| status                   | String   | ACTIVE or INACTIVE                              |
| timestamps               | Date     | Creation and update dates                       |

**Example:**

Brand A → Customer Support:

- Operating days: Monday to Saturday.
- Sunday: Closed.
- Public holidays: Closed.
- Minimum staffing: 5 employees on weekdays.

The combination of brand and process is unique in this model.

**Future consideration:** Implement public holiday dates and calendar exceptions required by the assessment.

### 4.7 Availability Model

**File:** `models/Availability.js`

**Purpose:** Stores employee leave requests and other availability restrictions.

| Field      | Type     | Purpose                                    |
| ---------- | -------- | ------------------------------------------ |
| employeeId | ObjectId | Reference to Employee                      |
| type       | String   | LEAVE, SICK_LEAVE, COMP_OFF or UNAVAILABLE |
| startDate  | Date     | Restriction start date                     |
| endDate    | Date     | Restriction end date                       |
| reason     | String   | Reason for the request                     |
| status     | String   | PENDING, APPROVED or REJECTED              |
| reviewedBy | ObjectId | Employee who reviewed the request          |
| reviewedAt | Date     | Review date                                |
| timestamps | Date     | Creation and update dates                  |

**Important points:**

- End date cannot be earlier than start date.
- The roster generator should normally consider approved availability restrictions.
- Pending and rejected requests should not automatically block roster generation.

### 4.8 EmployeeWorkPattern Model

**File:** `models/EmployeeWorkPattern.js`

**Purpose:** Stores an employee's regular weekly working schedule and weekly offs.

| Field         | Type     | Purpose                         |
| ------------- | -------- | ------------------------------- |
| employeeId    | ObjectId | Reference to Employee           |
| weeklyOffDays | Array    | Employee's weekly off days      |
| workingDays   | Array    | Employee's regular working days |
| effectiveFrom | Date     | Start date of the work pattern  |
| effectiveTo   | Date     | End date, if applicable         |
| status        | String   | Pattern status                  |
| timestamps    | Date     | Creation and update dates       |

**Example:**

Employee: Riya

- Working days: Monday to Saturday.
- Weekly off: Sunday.

This model helps the roster generator determine an employee's normal working schedule.

**Future consideration:** Support multiple effective-dated work patterns to preserve historical schedules when an employee's working days change.

### 4.9 Roster Model

**File:** `models/Roster.js`

**Purpose:** Stores monthly roster information and its generation and publication status.

| Field       | Type     | Purpose                           |
| ----------- | -------- | --------------------------------- |
| name        | String   | Roster name                       |
| periodStart | Date     | Roster start date                 |
| periodEnd   | Date     | Roster end date                   |
| status      | String   | DRAFT, PUBLISHED or ARCHIVED      |
| generatedBy | ObjectId | Employee who generated the roster |
| generatedAt | Date     | Generation date                   |
| publishedAt | Date     | Publication date                  |
| timestamps  | Date     | Creation and update dates         |

A Roster represents the entire schedule for a particular period.

### 4.10 RosterEntry Model

**File:** `models/RosterEntry.js`

**Purpose:** Stores individual employee assignments within a roster.

| Field      | Type     | Purpose                   |
| ---------- | -------- | ------------------------- |
| rosterId   | ObjectId | Reference to Roster       |
| employeeId | ObjectId | Reference to Employee     |
| brandId    | ObjectId | Reference to Brand        |
| processId  | ObjectId | Reference to Process      |
| date       | Date     | Scheduled working date    |
| status     | String   | SCHEDULED or CANCELLED    |
| source     | String   | AUTO or MANUAL            |
| notes      | String   | Additional information    |
| timestamps | Date     | Creation and update dates |

**Example:**

Riya is assigned to:

- Brand A
- Customer Support
- 16 November 2026
- Status: SCHEDULED
- Source: AUTO

This represents an actual daily assignment, unlike Allocation, which represents ongoing eligibility.

---

## 5. Database Model Relationships

The following table describes the relationships between the backend models.

| Relationship                   | Type                     | Explanation                                             |
| ------------------------------ | ------------------------ | ------------------------------------------------------- |
| Pod → Employee                 | One-to-Many              | One Pod can contain multiple employees                  |
| Employee → Allocation          | One-to-Many              | An employee can have multiple allocations               |
| Brand → Allocation             | One-to-Many              | A brand can have multiple employee allocations          |
| Process → Allocation           | One-to-Many              | A process can have multiple employee allocations        |
| Brand → WorkingRule            | One-to-Many              | A brand can have rules for different processes          |
| Process → WorkingRule          | One-to-Many              | A process can have different rules for different brands |
| Employee → Availability        | One-to-Many              | An employee can have multiple availability records      |
| Employee → EmployeeWorkPattern | One-to-Many conceptually | Historical work patterns may be supported in the future |
| Employee → Roster              | One-to-Many              | An employee can generate multiple rosters               |
| Roster → RosterEntry           | One-to-Many              | A roster contains multiple daily assignments            |
| Employee → RosterEntry         | One-to-Many              | An employee can have multiple scheduled assignments     |

**Important design decisions:**

- The current Employee model contains one optional `podId`, so an employee belongs to one Pod at a time.
- The current EmployeeWorkPattern model supports one work-pattern record per employee. Multiple effective-dated records are a future enhancement.
- The `generatedBy` field in Roster represents the employee responsible for generating a roster; it is not the same as the employees assigned through RosterEntry.
- If employees need to belong to multiple Pods, a separate Employee-Pod association model will be required.

---

## 6. Backend API Endpoints

**Base URL:**

`http://localhost:5000/api`

The following endpoints use action-based naming for operations that create, update or assign resources.

### 6.1 Employee Management

| Method | Endpoint            | Purpose                                |
| ------ | ------------------- | -------------------------------------- |
| POST   | `/create-employee`  | Create employee                        |
| GET    | `/employees`        | Get all employees                      |
| GET    | `/employee/:id`     | Get employee by ID                     |
| PATCH  | `/employee/:id`     | Update employee details and status     |
| PATCH  | `/employee/:id/pod` | Assign or unassign employee from a Pod |

### 6.2 Pod Management

| Method | Endpoint               | Purpose                       |
| ------ | ---------------------- | ----------------------------- |
| POST   | `/create-pod`          | Create a Pod                  |
| GET    | `/pods`                | Get all Pods                  |
| GET    | `/pod/:id`             | Get Pod by ID                 |
| PATCH  | `/update-pod/:id`      | Update Pod details and status |
| PATCH  | `/assign-pod-lead/:id` | Assign or remove Pod Lead     |

### 6.3 Brand Management

| Method | Endpoint            | Purpose                         |
| ------ | ------------------- | ------------------------------- |
| POST   | `/create-brand`     | Create a brand                  |
| GET    | `/brands`           | Get all brands                  |
| GET    | `/brand/:id`        | Get brand by ID                 |
| PATCH  | `/update-brand/:id` | Update brand details and status |

### 6.4 Process Management

| Method | Endpoint              | Purpose                           |
| ------ | --------------------- | --------------------------------- |
| POST   | `/create-process`     | Create a process                  |
| GET    | `/processes`          | Get all processes                 |
| GET    | `/process/:id`        | Get process by ID                 |
| PATCH  | `/update-process/:id` | Update process details and status |

### 6.5 Employee Allocation

| Method | Endpoint                 | Purpose                              |
| ------ | ------------------------ | ------------------------------------ |
| POST   | `/create-allocation`     | Create employee allocation           |
| GET    | `/allocations`           | Get all allocations                  |
| GET    | `/allocation/:id`        | Get allocation by ID                 |
| PATCH  | `/update-allocation/:id` | Update allocation details and status |

**Note:** Working Rule, Availability, Employee Work Pattern and Roster endpoints will be documented as those APIs are implemented.

---

## 7. API Validation and Error Handling

The backend uses HTTP status codes to communicate the result of API requests.

| Status Code | Meaning                           |
| ----------- | --------------------------------- |
| 200         | Request successful                |
| 201         | Resource created                  |
| 400         | Invalid input or validation error |
| 404         | Requested resource not found      |
| 409         | Duplicate or conflicting resource |
| 500         | Internal server error             |

### Validation Implemented

- Required field validation using Mongoose schemas.
- Email format validation using the `validator` npm package.
- Unique email and employee code constraints.
- Duplicate name validation for Pods, Brands and Processes.
- MongoDB ObjectId validation.
- Reference validation for Employee, Pod, Brand and Process.
- Active-status validation when assigning employees or creating allocations.
- Pod Lead validation to ensure the employee belongs to the same Pod.
- Allocation uniqueness validation using a compound unique index.
- Update validation using Mongoose validators.

### API Response Structure

Responses use a `message` property and, where appropriate, a `data` property.

Example:

```json
{
  "message": "Employee created successfully",
  "data": {
    "firstName": "Riya",
    "lastName": "Sharma"
  }
}
```

---

## 8. Remaining Development Roadmap

The assessment has six major functional sections. The following roadmap tracks the remaining backend development and testing work.

### A. Team, Brand and Process Management

- [x] Create Employee model.
- [x] Create Pod model.
- [x] Create Brand model.
- [x] Create Process model.
- [x] Create Allocation model.
- [x] Implement Employee CRUD and status operations.
- [x] Implement Pod CRUD APIs.
- [x] Implement Brand CRUD APIs.
- [x] Implement Process CRUD APIs.
- [x] Implement Employee-Pod assignment.
- [x] Implement Pod Lead assignment.
- [x] Implement Employee-Brand-Process allocation APIs.
- [x] Complete Postman testing of all APIs.
- [ ] Verify edge cases and API error responses.

### B. Client-Specific Working Rules

- [x] Create WorkingRule model.
- [x] Create EmployeeWorkPattern model.
- [x] Create Availability model.
- [ ] Implement WorkingRule APIs.
- [ ] Implement employee weekly-off management.
- [ ] Implement leave and availability management.
- [ ] Implement public holiday calendar.
- [ ] Validate minimum staffing requirements.

### C. Monthly Roster Generation

- [x] Create Roster model.
- [x] Create RosterEntry model.
- [ ] Implement monthly roster generation service.
- [ ] Consider employee allocations.
- [ ] Consider weekly offs.
- [ ] Consider approved leaves.
- [ ] Consider public holidays.
- [ ] Consider brand and process operating rules.
- [ ] Consider minimum staffing requirements.
- [ ] Generate a monthly roster for all applicable employees.

### D. Conflict Detection and Validation

- [ ] Detect employees assigned on weekly offs.
- [ ] Detect assignments during approved leaves.
- [ ] Detect assignments on non-operating days.
- [ ] Detect insufficient staffing.
- [ ] Detect invalid employee allocations.
- [ ] Detect duplicate or overlapping assignments.
- [ ] Generate understandable conflict reports.

### E. Roster Views and Editing

- [ ] Company-level roster view APIs.
- [ ] Pod-level roster view APIs.
- [ ] Brand-level roster view APIs.
- [ ] Process-level roster view APIs.
- [ ] Employee-level roster view APIs.
- [ ] Implement manual roster assignment.
- [ ] Validate manual roster changes.
- [ ] Support roster entry updates and cancellations.

### F. Handling Changes

- [ ] Handle employee unavailability after roster generation.
- [ ] Handle employee addition after roster generation.
- [ ] Handle employee deactivation.
- [ ] Revalidate affected roster entries.
- [ ] Preserve historical roster records.
- [ ] Demonstrate at least one post-generation change.

### Final Submission

- [ ] Add at least 30 sample employees.
- [ ] Test with multiple Pods, brands and processes.
- [ ] Test employee allocations across multiple brands and processes.
- [ ] Test monthly roster generation.
- [ ] Test conflict detection and validation.
- [ ] Test post-generation changes.
- [ ] Deploy the backend application.
- [ ] Add `.env.example`.
- [ ] Complete README setup instructions.
- [ ] Record a 3–5 minute application demonstration.
- [ ] Prepare an approach note.

---

## 9. Key Backend Architectural Decisions

### 1. Separate Employee Creation from Pod Assignment

An employee can be registered without being assigned to a Pod. Pod assignment is handled through a separate API.

### 2. Use Allocation for Employee Responsibilities

Employee, Brand and Process relationships are maintained through a separate Allocation model rather than embedding brand and process IDs directly into the Employee model.

### 3. Separate Allocation from RosterEntry

Allocation defines an employee's ongoing eligibility to work on a brand-process combination.

RosterEntry records an actual employee assignment on a particular date.

### 4. Keep WorkingRule Separate from EmployeeWorkPattern

WorkingRule defines client and process operating requirements.

EmployeeWorkPattern defines an employee's regular working schedule and weekly offs.

### 5. Preserve Roster History

Employee deactivation should not delete existing roster entries or historical records.

### 6. Keep Assignment Operations Separate

Operations such as Employee-Pod assignment and Pod Lead assignment are handled separately from general resource creation and updates.

### 7. Prioritize Reliable Scheduling

The roster generation engine, validation rules and conflict detection are the core backend requirements. Scheduling correctness takes priority over unnecessary API or database complexity.

---

## 10. Current Backend Development Focus

The first assessment section, Team, Brand and Process Management, has its primary models and APIs implemented.

**Completed foundation:**

- 10 Mongoose models.
- Employee, Pod, Brand and Process management APIs.
- Employee-Pod assignment.
- Pod Lead assignment.
- Employee-Brand-Process allocation APIs.
- Initial validation and error handling.

**Next development phase:**

1. Complete Postman testing for the implemented APIs.
2. Implement WorkingRule APIs.
3. Implement EmployeeWorkPattern management.
4. Implement Availability and leave management.
5. Implement public holiday calendar support.
6. Begin the monthly roster generation service.
7. Implement conflict detection and roster validation.

**Current milestone:** Team, Brand and Process Management backend APIs have been implemented. The next milestone is Working Rules and Employee Availability management, followed by the monthly roster generation engine.

---

_This document tracks the backend architecture, API implementation and development progress of the Smart Roster Management System. The complete application overview, frontend documentation and setup instructions are maintained in the main README._
