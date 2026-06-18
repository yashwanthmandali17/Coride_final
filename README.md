# CoRide

CoRide is a modern, real-time ride-sharing application designed to connect drivers with empty seats to passengers traveling in the same direction. Built with a sleek, glassmorphism-inspired UI and a robust Python backend, CoRide offers a seamless and interactive experience for managing daily commutes or long-distance trips.

## 🌟 Key Features

* **Real-time Chat:** Built-in WebSocket integration allows drivers and passengers to communicate live without leaving the app.
* **Ride Publishing & Searching:** Drivers can easily publish their upcoming routes, and passengers can search for rides using advanced filtering.
* **Request Management:** Passengers can request to join rides, and drivers can accept or reject requests with ease.
* **Dynamic Dashboards:** Dedicated views for users to track their published rides (as drivers) and their booked rides (as passengers).
* **Rating System:** A comprehensive 5-star rating system ensures trust and reliability within the community.
* **Notifications:** Keep track of accepted requests, new messages, and ride status updates.
* **Premium UI/UX:** A beautiful, responsive frontend featuring a vibrant dark/light mode toggle with smooth glassmorphism styling and interactive micro-animations.

## 💻 Tech Stack

### Frontend
* **Framework:** React.js powered by Vite
* **Routing:** React Router DOM
* **Styling:** Vanilla CSS with custom CSS variables, gradients, and a glassmorphism design system
* **Icons:** Lucide React

### Backend
* **Framework:** FastAPI (Python)
* **Database:** SQLAlchemy ORM (configured for SQLite/PostgreSQL)
* **Authentication:** JWT (JSON Web Tokens) with secure bcrypt password hashing
* **Real-time:** FastAPI WebSockets for live chat

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

* Node.js (v18 or higher recommended)
* Python (3.9 or higher)
* Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/CoRide.git
   cd CoRide
   ```

2. **Backend Setup**
   ```bash
   cd backend
   
   # Create a virtual environment
   python -m venv venv
   
   # Activate the virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Create a .env file based on the example
   cp .env.example .env
   
   # Run the FastAPI server
   uvicorn app.main:app --reload
   ```
   *The backend will run at `http://localhost:8000`.*

3. **Frontend Setup**
   Open a new terminal window/tab:
   ```bash
   cd frontend
   
   # Install dependencies
   npm install
   
   # Start the development server
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`.*

## 📂 Project Structure

```
CoRide/
├── backend/                  # FastAPI Backend application
│   ├── app/                  # Application source code (routers, models, schemas)
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment variables template
├── frontend/                 # React Frontend application
│   ├── src/                  # Source files (components, pages, services, contexts)
│   ├── public/               # Static assets
│   ├── index.html            # Main HTML entry point
│   ├── vite.config.js        # Vite configuration
│   └── package.json          # Node dependencies
└── README.md                 # Project documentation
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
