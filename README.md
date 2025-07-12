# Shopping List Web App

![Shopping List Screenshot](./screenshot.png)

A modern, collaborative shopping list web application built with Python, Flask, and Bootstrap 5. Features drag-and-drop sorting, priority levels, frequent items, and real-time updates.

## Features

- 🛒 **Interactive Shopping List**
  - Add, edit, and remove items
  - Mark items as purchased
  - Drag-and-drop sorting
- 🏷️ **Priority Levels**
  - High/Medium/Low priority indicators
  - Color-coded for quick visual reference
- 🔄 **Frequent Items**
  - Smart suggestions for commonly bought items
  - One-click add for quick list building
- 📱 **Responsive Design**
  - Works on desktop and mobile devices
  - Clean, intuitive interface
- 🐳 **Docker Support**
  - Easy deployment with Docker
  - Pre-configured development environment

## Technologies Used

- **Backend**: Python with Flask
- **Frontend**: Bootstrap 5, JavaScript
- **Database**: SQLite (with Flask-SQLAlchemy)
- **Deployment**: Docker
- **Additional Libraries**:
  - SortableJS (for drag-and-drop)
  - Gunicorn (production server)

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- Git for version control

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/royen99/shopping-list.git
   cd shopping-list

2. Build and start the containers:
   ```bash
   docker-compose up --build

3. Access the application at `http://localhost:5000` (or the port that you chose).
   