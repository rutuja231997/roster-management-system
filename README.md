# Smart Roster Management System

A full-stack application for managing employees, teams, operational requirements, and monthly workforce rosters.

The system helps operations teams manage employee allocations, generate monthly rosters, maintain staffing requirements, and identify scheduling conflicts.

## Features

- Employee, Pod, Brand, and Process Management
- Employee Allocations and Working Rules
- Employee Availability and Work Patterns
- Monthly Roster Generation
- Roster Validation and Conflict Management
- Roster Views and Editing
- Post-Generation Changes and Revalidation

## Technology Stack

**Frontend:** React.js, Vite, Tailwind CSS, Redux Toolkit

**Backend:** Node.js, Express.js, MongoDB, Mongoose

## Project Documentation

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

## Getting Started

Clone the repository:

```bash
git clone <repository-url>
cd smart-roster-management-system
```

Follow the setup and installation instructions in the respective frontend and backend README files.

---

**Project Status:** Completed as part of a Full-Stack Development Assessment.

## 8. Tell Us How You Think

### 1. How did you model employees, brands, processes, pods, and their relationships?

I modeled the system using separate MongoDB models to maintain clear relationships, avoid data duplication, and make the system easier to manage.

- Employee: Stores employee details, status, and podId referencing the assigned Pod.
- Pod: Represents a team containing multiple employees. It also maintains an optional leadEmployeeId referencing the employee who leads the Pod.
- Brand: Represents a client or business brand.
- Process: Represents the type of operational work, such as Voice Support, Email Support, Chat Support, Technical Support, or Back Office.
- Allocation: Connects an Employee with a Brand and Process, defining which brand-process combinations the employee is eligible to work on.
- WorkingRule: Connects a Brand and Process and defines their operational requirements, including operating days and minimum staffing.
  Model relationships:
- A Pod can have multiple Employees, while an Employee belongs to one Pod.
- A Pod can have one designated lead Employee.
- An Employee can have multiple Allocations.
- A Brand can have multiple Allocations and WorkingRules.
- A Process can have multiple Allocations and WorkingRules.
- Allocation establishes the many-to-many relationship between Employees, Brands, and Processes.
  I used separate Allocation records instead of storing brand and process information directly inside Employee documents. This allows employees to be assigned to multiple brand-process combinations without duplicating employee data.

Similarly, WorkingRule is maintained separately to define operational requirements for each Brand-Process combination.

This design provides a clear separation between organizational structure, employee eligibility, and operational requirements, making the system easier to maintain and extend.

### 2. How does your system generate a roster and determine whether it satisfies the required constraints?

The roster generation process is based on employee availability, allocation eligibility, working patterns, working rules, and staffing requirements.

For each date in the selected month, the system:

1. Identifies active employees.
2. Checks their effective Employee Work Patterns to determine working days and weekly offs.
3. Excludes employees with approved availability records overlapping the selected date.
4. Retrieves active allocations to determine which employees are eligible for each Brand-Process combination.
5. Evaluates the corresponding Working Rules to determine whether the brand-process combination operates on that day and how many employees are required.
6. Prioritizes combinations with fewer eligible employees to handle difficult-to-staff combinations first.
7. Assigns eligible employees while considering their existing assignments for the day.
8. Generates conflicts when staffing requirements cannot be fulfilled.

After generation, roster validation checks the generated roster against the applicable scheduling constraints. Conflicts can then be reviewed and resolved by the manager.

### 3. How did you handle the difference between single-resource brands and brands with multiple employees?

The system uses the minimum staffing requirement defined in the Working Rule for each Brand-Process combination rather than assuming that every combination requires only one employee.

For example, if a Brand-Process combination requires one employee, the generator attempts to assign one eligible employee. If it requires three employees, the generator attempts to assign three eligible employees.

The same eligibility and availability checks are applied in both cases. If the number of eligible employees is less than the required staffing level, the system generates an insufficient staffing conflict containing the staffing requirement, available employees, and shortage information.

This makes the roster generation logic configurable and supports both single-resource and multi-resource requirements without changing the scheduling algorithm for individual brands.

### 4. What happens when an employee manages all processes for a brand but is unavailable on a required working day?

The system does not automatically assign an unavailable employee.

Approved availability records and employee work patterns are considered before an employee becomes eligible for assignment. If the employee is unavailable on a required working day, they are excluded from the eligible employee list.

The roster generator then attempts to fulfil the staffing requirement using other eligible employees allocated to the same Brand-Process combination.

If the available employees are insufficient, the system generates an `INSUFFICIENT_STAFFING` conflict. The conflict provides information about the staffing requirement, available employees, shortage, and unavailable allocated employees.

This allows the manager to identify the coverage gap and resolve it manually instead of generating an invalid assignment.

### 5. How does your system handle conflicting requirements or insufficient staffing?

The system identifies scheduling constraints during roster generation and validation rather than silently assigning employees who violate those constraints.

During generation, employees are filtered based on:

- Active employee status
- Active allocations
- Employee working patterns
- Weekly offs
- Approved availability
- Brand and process eligibility
- Working Rule requirements

When a Brand-Process combination cannot meet its minimum staffing requirement, the system generates an `INSUFFICIENT_STAFFING` conflict.

The system also prioritizes difficult-to-staff combinations by processing combinations with fewer eligible employees first.

After roster generation, the manager can validate the roster, review detected conflicts, and resolve them through the conflict management interface.

The system provides visibility into scheduling problems while allowing the manager to retain control over the final resolution.

### 6. Which parts of the process did you automate, and which did you leave under human control? Why?

I automated the repetitive and constraint-based parts of roster generation, including:

- Identifying eligible employees
- Checking employee working patterns and weekly offs
- Checking approved availability
- Matching employee allocations with brands and processes
- Applying working rules and minimum staffing requirements
- Generating daily assignments
- Detecting insufficient staffing
- Validating generated rosters
- Identifying and tracking scheduling conflicts

I kept conflict resolution and final managerial decisions under human control.

The system can identify a staffing shortage and provide relevant information, but a manager may need to consider business priorities, employee suitability, operational requirements, or exceptional circumstances before resolving it.

This approach reduces manual scheduling effort while ensuring that the manager remains responsible for decisions that require operational judgment.

### 7. If the company doubled its team and brand count, what would you change about your solution?

The current solution is designed to support dynamically managed employees, pods, brands, processes, allocations, and working rules rather than relying on hardcoded values.

If the team and brand count doubled, I would focus on improving the scalability and performance of roster generation.

Potential improvements would include:

- Optimizing database queries and adding appropriate indexes.
- Reducing repeated data lookups during roster generation.
- Improving the scheduling algorithm for larger datasets.
- Processing roster generation in batches where appropriate.
- Introducing background jobs for large roster-generation operations.
- Improving pagination and filtering for large employee, allocation, and roster datasets.
- Adding more detailed monitoring and logging for generation and validation operations.

I would also evaluate the scheduling algorithm's performance with larger datasets before introducing more complex optimization techniques.

### 8. If you had one additional week to work on this, what would you improve first?

I would first focus on improving the reliability and efficiency of the roster generation and validation process.

My priorities would be:

1. Expand automated testing for roster generation, availability changes, weekly offs, allocation restrictions, and insufficient staffing scenarios.
2. Improve the handling of changes made after roster generation, especially when employee availability or allocations change.
3. Improve the conflict resolution workflow to provide managers with clearer information and better resolution options.
4. Optimize roster generation and validation for larger datasets.
5. Improve error handling and user feedback for exceptional scenarios.

I would prioritize correctness, reliability, and maintainability before introducing additional scheduling features.
