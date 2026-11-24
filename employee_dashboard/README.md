# DEP Employee Dashboard

## Employee Analytics & Workforce Overview

A lightweight, web-based employee analytics dashboard designed to provide a centralized view of employee information, workforce distribution, technical skills, certifications, billing status, background verification, client allocation, and employee data completeness.

The DEP Employee Dashboard was developed to reduce manual Excel-based analysis and provide a simple, interactive, and cost-effective solution for accessing employee information.

---

## 1. Project Overview

The DEP Employee Dashboard is an internal employee analytics application that transforms employee information maintained in Excel into an interactive dashboard.

Users can view important workforce metrics, analyze employee distribution, explore technical skills, search employee records, apply filters, identify missing information, and export filtered employee data.

The application provides a centralized view of employee information, helping teams access relevant data quickly without manually navigating large Excel spreadsheets.

### Project Objectives

- Centralize employee information in a single dashboard.
- Reduce manual effort involved in Excel-based data analysis.
- Provide quick access to key workforce metrics.
- Understand employee distribution across locations.
- Analyze employee experience levels.
- Identify available technical skills within the workforce.
- Monitor certification and billing status.
- Track background verification status.
- Identify incomplete employee records.
- Enable employee search and filtering.
- Export filtered employee information to Excel.
- Build a lightweight and cost-effective alternative to additional BI licensing for this use case.

---

## 2. Business Problem

Employee information is often maintained in Excel files. While Excel is useful for storing information, manually analyzing large datasets can become time-consuming.

Some common challenges include:

- Manually calculating employee counts.
- Checking certification status employee by employee.
- Identifying billable and non-billable resources.
- Checking background verification status.
- Understanding employee distribution across locations.
- Identifying technical skills available within the team.
- Analyzing employee experience levels.
- Finding employee information using manual Excel searches.
- Identifying missing or incomplete employee details.
- Preparing data for reporting and sharing.

The DEP Employee Dashboard addresses these challenges by presenting the information through an interactive interface with KPIs, charts, search, filters, and export functionality.

---

## 3. Solution

The dashboard reads employee information from an Excel data source and processes the data using Python.

The processed information is exposed through the backend and displayed through a web-based frontend.

Users can access the dashboard through their browser and interact with the available metrics, charts, employee directory, filters, and export functionality.

The application is designed to provide a simple user experience without requiring users to have advanced technical or data-analysis knowledge.

---

## 4. Key Features

### 4.1 Workforce Overview

The main dashboard provides a consolidated overview of employee information.

Users can quickly understand the current workforce status through key metrics and visualizations.

### 4.2 Key Performance Indicators (KPIs)

The dashboard provides the following KPI cards:

| KPI | Description |
|---|---|
| Total Employees | Total employee records available in the dashboard |
| Certified | Number of employees who have completed their certifications |
| Billable | Number of employees classified as billable |
| Non-Billable | Number of employees classified as non-billable |
| BGV Pending | Number of employees with background verification marked as pending |

These metrics provide a quick overview without requiring users to manually calculate values from Excel.

### 4.3 Employee Location Analysis

The Employees by Location chart displays the distribution of employees across different locations.

This helps users:

- Understand location-wise workforce distribution.
- Compare employee counts between locations.
- Quickly identify where the workforce is concentrated.

### 4.4 Years of Experience Analysis

The Years of Experience chart groups employees into experience categories.

This provides visibility into the experience distribution across the workforce and helps users understand the available experience levels.

### 4.5 Technical Skills Analysis

The Technical Skills chart displays the distribution of employee technical skills.

Skills represented in the dashboard may include:

- Python
- SQL
- Databricks
- PySpark
- AWS
- Azure
- GCP
- Cloud

This helps users understand the technical capabilities available within the workforce.

### 4.6 Client Distribution

The Client Distribution section provides an overview of employee allocation across different clients.

This helps users understand how employee resources are distributed across client engagements.

### 4.7 Missing Employee Details

The Missing Employee Details section identifies employee records with incomplete information.

This feature helps:

- Identify missing information.
- Improve employee data completeness.
- Reduce manual data-quality checks.
- Locate records requiring updates.

### 4.8 Employee Directory

The Employee Directory provides employee-level information in a tabular format.

Users can:

- View employee records.
- Search for employees.
- Apply available column filters.
- Narrow down employee records based on specific criteria.
- Find employee information without manually searching Excel.

### 4.9 Search and Filtering

Search and filtering functionality allows users to narrow down the displayed employee information.

This helps users find relevant employee records quickly and analyze specific subsets of the workforce.

### 4.10 Excel Export

The dashboard provides functionality to export employee information to Excel.

Users can export filtered employee records for:

- Further analysis.
- Reporting.
- Data sharing.
- Offline review.

### 4.11 Data Refresh

The dashboard includes a refresh functionality to reload employee information from the configured data source.

The dashboard also includes live monitoring and workbook connection status indicators to provide visibility into the data source connection and last-read information.

### 4.12 Authentication

The application includes a login interface to restrict access to the dashboard.

The dashboard setup includes a login configuration process for creating the initial private dashboard credentials.

---

## 5. Technology Stack

### Backend

| Technology | Purpose |
|---|---|
| Python | Application development and data processing |
| FastAPI | Backend API and application framework |
| Uvicorn | Application server |
| Pandas | Excel data processing and transformation |

### Frontend

| Technology | Purpose |
|---|---|
| HTML | Web page structure |
| CSS | Styling and responsive layout |
| JavaScript | Frontend functionality and interactivity |
| Chart.js | Interactive charts and visualizations |

### Data Source

| Technology | Purpose |
|---|---|
| Microsoft Excel | Employee data source |
| XLSX | Employee data file format |

### Development and Runtime

| Component | Purpose |
|---|---|
| Python Virtual Environment | Isolated project dependencies |
| pip | Python package installation |
| Windows Batch Script | One-click startup automation |
| Git | Version control |

---

## 6. Application Architecture

The application follows a simple frontend-backend architecture.

### Architecture Flow

Excel Employee Data  
↓  
Python Data Processing  
↓  
FastAPI Backend  
↓  
Frontend – HTML, CSS, JavaScript  
↓  
Dashboard UI and Charts  
↓  
User Search, Filters and Export

### Components

#### Data Source Layer

Employee information is maintained in the configured Excel workbook.

The workbook acts as the source of employee information consumed by the application.

#### Data Processing Layer

Python processes the employee information and prepares it for dashboard calculations and visualizations.

Processing includes the preparation of information required for:

- Employee counts.
- Certification metrics.
- Billing metrics.
- Background verification metrics.
- Location distribution.
- Experience distribution.
- Technical skills.
- Client distribution.
- Missing employee details.

#### Backend Layer

FastAPI provides the backend application functionality.

The backend handles application requests and provides employee data and dashboard information to the frontend.

#### Frontend Layer

The frontend is developed using HTML, CSS, and JavaScript.

It provides:

- Dashboard layout.
- KPI cards.
- Charts.
- Employee directory.
- Search.
- Filters.
- Excel export.
- Refresh functionality.
- Login interface.

#### Visualization Layer

Chart.js is used to present employee information through visual charts.

The charts help users understand employee distribution and workforce characteristics.

---

## 7. Project Structure

The project structure may look similar to the following:

    employee_dashboard/
    │
    ├── backend/
    │   ├── main.py
    │   └── ...
    │
    ├── frontend/
    │   ├── ...
    │   └── ...
    │
    ├── .venv/
    │
    ├── requirements.txt
    ├── setup_login.py
    ├── start_dashboard.bat
    ├── .env
    ├── DEP_filtered_employees.xlsx
    └── README.md

### Folder and File Description

| File/Folder | Description |
|---|---|
| backend/ | Backend application components |
| frontend/ | Frontend UI and related assets |
| .venv/ | Python virtual environment |
| requirements.txt | Python package dependencies |
| setup_login.py | Initial dashboard login setup |
| start_dashboard.bat | Windows startup script |
| .env | Local application configuration and credentials |
| DEP_filtered_employees.xlsx | Employee data source |
| README.md | Project documentation |

> The exact project structure may vary based on the current implementation.

---

## 8. System Requirements

### Operating System

- Windows 10 or Windows 11.

### Software Requirements

- Python installed on the system.
- Internet connectivity during initial package installation.
- Web browser such as Google Chrome, Microsoft Edge, or Firefox.

### Recommended Python Setup

Install a supported Python version from the official website:

https://www.python.org/downloads/windows/

During installation, enable:

- Add Python to PATH.

The application startup script checks for Python and attempts to create the project virtual environment automatically.

---

## 9. Installation and Setup

### Step 1 – Download the Project

Download or clone the DEP Employee Dashboard project repository.

Extract the project completely into a local folder.

Do not execute the startup script directly from inside a compressed ZIP file.

### Step 2 – Install Python

Install Python on the local system if it is not already installed.

Verify the installation using Command Prompt:

    python --version

If Python is available, the command should return the installed Python version.

### Step 3 – Navigate to the Project Folder

Open the project folder where the dashboard files are available.

Ensure the following files are present:

- requirements.txt
- start_dashboard.bat
- setup_login.py
- backend folder
- frontend folder

### Step 4 – Start the Dashboard

Double-click:

    start_dashboard.bat

The startup script is designed to automate the following operations:

1. Navigate to the project directory.
2. Check whether Python is available.
3. Create a Python virtual environment if it does not exist.
4. Install the required packages.
5. Run the initial login setup if the configuration file is missing.
6. Start the FastAPI application.
7. Open the dashboard login page in the browser.

---

## 10. Running the Application Manually

If the startup script is not used, the application can be started manually.

### Navigate to the Project Folder

Open Command Prompt or PowerShell and navigate to the project directory.

### Create Virtual Environment

    python -m venv .venv

### Activate Virtual Environment

For PowerShell:

    .\.venv\Scripts\Activate.ps1

For Command Prompt:

    .venv\Scripts\activate.bat

### Install Dependencies

    python -m pip install -r requirements.txt

### Start the Backend

    python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

### Access the Dashboard

Open the following URL in your browser:

    http://127.0.0.1:8000/login

---

## 11. Login Setup

The application includes an initial login configuration process.

When the application is started for the first time and the local environment configuration file is not present, the startup script runs:

    setup_login.py

This script is used to configure the initial dashboard login.

After login setup is completed, the application can be accessed through the login page.

### Important

The `.env` file contains local application configuration and potentially sensitive information.

It should not be shared publicly or committed to a public Git repository.

---

## 12. Data Source

### Excel-Based Data Input

The dashboard currently uses an Excel workbook as its employee data source.

The workbook contains employee-related information required for dashboard calculations and visualizations.

The application reads and processes this data to populate the dashboard.

### Data Categories

The dashboard uses employee information related to categories such as:

- Employee details.
- Location.
- Years of experience.
- Technical skills.
- Certifications.
- Billing status.
- Background verification.
- Client allocation.
- Data completeness.

### Data Update Process

The employee Excel source should be updated with the latest information.

The dashboard refresh functionality can then be used to reload the information from the configured data source.

### Data Quality

The Missing Employee Details section helps identify incomplete employee information.

Maintaining accurate and complete source data is important for ensuring that dashboard metrics and charts are reliable.

---

## 13. Dashboard Navigation

### Overview

The Overview page provides the main dashboard summary.

It includes:

- Workforce KPI cards.
- Employee location chart.
- Experience distribution chart.
- Technical skills chart.
- Client distribution.
- Missing employee details.

### Employee Directory

The Employee Directory provides employee-level information.

It includes search and filtering capabilities to help users locate employee records.

### Logout

The dashboard includes a sign-out functionality to exit the current session.

---

## 14. Cost-Effective Approach

One of the key objectives of this project was to build a cost-effective employee analytics solution.

Instead of introducing an additional BI licensing requirement for this use case, the dashboard was developed using Python-based technologies and standard web development components.

### Cost Considerations

The application was designed to minimize additional software licensing costs by using:

- Python.
- FastAPI.
- HTML.
- CSS.
- JavaScript.
- Chart.js.
- Excel as the data source.

### Objective

The objective is to provide the required dashboard capabilities without introducing additional BI licensing costs for the current use case.

> Infrastructure, hosting, maintenance, and enterprise deployment costs may still apply depending on how the application is deployed in the future.

---

## 15. Troubleshooting

### Problem: Python is not recognized

Error:

    'python' is not recognized as an internal or external command

Solution:

1. Install Python.
2. Enable Add Python to PATH during installation.
3. Close and reopen Command Prompt.
4. Run:

       python --version

### Problem: `py` is not recognized

Error:

    'py' is not recognized as an internal or external command

Solution:

The Windows Python Launcher may not be installed.

Install Python and ensure Python is available through the `python` command.

The startup script should use the available Python command rather than depending exclusively on `py`.

### Problem: Virtual environment creation fails

Solution:

1. Confirm Python is installed.
2. Confirm you are running the startup script from the extracted project folder.
3. Check whether the project folder is accessible.
4. Try creating the virtual environment manually:

       python -m venv .venv

### Problem: Package installation fails

Solution:

Check internet connectivity and try:

    .venv\Scripts\python.exe -m pip install -r requirements.txt

If a package installation fails, review the error message displayed in the terminal.

### Problem: Dashboard does not open

Solution:

Start the application manually:

    .venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

Then open:

    http://127.0.0.1:8000/login

### Problem: Port 8000 is already in use

Another application may already be running on port 8000.

Stop the existing application or configure the dashboard to use another available port.

### Problem: Employee data is not updated

Solution:

1. Verify that the Excel source has been updated.
2. Confirm that the application is reading the expected workbook.
3. Use the dashboard refresh functionality.
4. Verify the source workbook data.

---

## 16. Security Considerations

The dashboard is intended for internal employee analytics use.

Employee data may contain sensitive information. Therefore, the following practices should be followed:

- Do not publicly share employee data files.
- Do not commit sensitive credentials to Git.
- Do not publicly expose the application without appropriate security controls.
- Protect the `.env` configuration file.
- Use appropriate access controls.
- Avoid sharing screenshots containing sensitive employee information.
- Ensure the application is deployed according to internal security requirements.

The current local setup uses the application on:

    127.0.0.1

This means the application is intended to run locally on the machine unless its deployment configuration is changed.

---

## 17. Current Status

### Completed / Implemented Features

- Dashboard interface.
- Employee KPI cards.
- Location distribution chart.
- Years of experience chart.
- Technical skills chart.
- Client distribution.
- Missing employee details.
- Employee directory.
- Search functionality.
- Employee filtering.
- Excel export.
- Dashboard refresh functionality.
- Login interface.
- Windows startup automation.

### Remaining Improvements

The remaining enhancements depend on the current project requirements, validation, feedback, and testing.

The project is currently under development and should be validated against the final business requirements before being considered fully completed.

---

## 18. Future Enhancements

Potential future improvements may include:

- Improved responsive design for different screen sizes.
- Enhanced search and filtering.
- Additional workforce metrics.
- Improved data validation.
- More detailed data quality monitoring.
- Automated data refresh.
- Better error handling.
- Enhanced user management.
- Deployment on an internal server.
- Centralized access for multiple users.
- Role-based access control.
- Audit logging.
- Improved monitoring.
- Automated testing.
- Production deployment configuration.

These enhancements can be prioritized based on business requirements and user feedback.

---

## 19. Project Benefits

The DEP Employee Dashboard provides the following benefits:

### Centralized Information

Employee information is presented in a single dashboard.

### Reduced Manual Effort

Users no longer need to manually calculate every metric or search through large Excel files for basic information.

### Faster Access to Insights

Important workforce information can be accessed quickly through KPIs and charts.

### Improved Workforce Visibility

The dashboard provides visibility into employee location, experience, skills, certifications, billing, and client distribution.

### Better Data Completeness

The Missing Employee Details section helps identify incomplete employee records.

### Easy Employee Search

Users can quickly search and filter employee records.

### Cost-Effective Solution

The dashboard was developed using Python and open-source technologies to reduce additional licensing costs for the current use case.

---

## 20. Project Summary

The DEP Employee Dashboard is a lightweight employee analytics application designed to simplify workforce data analysis.

It transforms Excel-based employee information into an interactive web dashboard that provides visibility into employee metrics, technical skills, experience, locations, certification status, billing status, client allocation, and data completeness.

The application uses Python and FastAPI for the backend and HTML, CSS, and JavaScript for the frontend.

The main objective is to reduce manual Excel-based analysis, improve access to employee information, and provide a cost-effective solution for the team's employee analytics requirements.

---

## 21. Quick Start

### Windows

1. Download the project.
2. Extract the project folder.
3. Ensure Python is installed.
4. Double-click `start_dashboard.bat`.
5. Complete login setup if prompted.
6. Open the dashboard in your browser.

### Dashboard URL

    http://127.0.0.1:8000/login

---

## 22. Disclaimer

This application is developed for internal employee analytics and workforce information visualization.

Dashboard metrics are dependent on the quality, completeness, and accuracy of the underlying employee data source.

The application should be validated against the organization's business requirements and security standards before being used for production or broader enterprise deployment.

---

**Project:** DEP Employee Dashboard  
**Purpose:** Employee Analytics and Workforce Overview  
**Backend:** Python, FastAPI  
**Frontend:** HTML, CSS, JavaScript  
**Visualization:** Chart.js  
**Data Source:** Excel  
**Platform:** Windows-based local application

python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000