# Restaurant Management System

A comprehensive restaurant management application that integrates operational tracking, order management, and customer experience features built with React.js, Express.js, and PostgreSQL.

![Restaurant Management System](generated-icon.png)

## Features

- **Menu Management**: Create, edit and manage menu items with pricing and availability options
- **Table Management**: Track table status, occupancy, and customer seating time
- **Order Processing**: Create orders, track status through the kitchen to serving
- **Customer Database**: Maintain customer records with contact information and visit history
- **Kitchen Display System**: Real-time order status updates for kitchen staff
- **Customer History**: Track customer preferences, visit frequency, and order history

## Tech Stack

### Frontend
- React.js with TypeScript
- TanStack Query (React Query) for data fetching
- Wouter for client-side routing
- ShadCN UI components with Tailwind CSS
- React Hook Form with Zod validation

### Backend
- Express.js REST API
- PostgreSQL database
- Drizzle ORM for database interactions
- Express session handling

## Application Structure

The application consists of the following main features:

### Dashboard
- Overview of restaurant operations
- Quick access to active orders, tables, and customers

### Menu Management
- Add, edit, and delete menu items
- Set pricing and categorize menu items
- Mark items as available/unavailable

### Table Management
- View table status (vacant, occupied)
- Track customer arrival times
- Manage table capacity and availability

### Order Management
- Create new orders for customers
- Associate orders with tables
- Track order status (pending, preparing, served, completed)
- Calculate order totals

### Kitchen Display System
- View pending and in-progress orders
- Update order status as preparation progresses
- Display order details and special requirements

### Customer Management
- Store and retrieve customer information
- Track customer visit history and preferences
- View customer order history

## Database Schema

The application uses the following database models:

- **Menu Items**: Food and beverage offerings with prices
- **Tables**: Restaurant seating with capacity and occupancy status
- **Customers**: Customer profiles with contact information
- **Customer Visits**: Records of customer visits with start/end times
- **Orders**: Customer orders with status tracking
- **Order Items**: Individual items within orders

## Getting Started

### Prerequisites
- Node.js (v14+)
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/restaurant-management-system.git
cd restaurant-management-system
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```
DATABASE_URL=postgres://username:password@localhost:5432/restaurant_db
```

4. Push the database schema
```bash
npm run db:push
```

5. Start the development server
```bash
npm run dev
```

6. Open http://localhost:5000 in your browser

## Usage

### Adding Menu Items
1. Navigate to the "Menu" section
2. Click "Add Menu Item"
3. Fill in the name, description, price, and category
4. Click "Save Menu Item"

### Managing Tables
1. Navigate to the "Tables" section
2. Add tables with capacity information
3. View table status and occupancy
4. Mark tables as occupied/vacant as needed

### Creating Orders
1. Navigate to the "Orders" section
2. Click "New Order"
3. Select a customer, table, and add menu items
4. Submit the order

### Kitchen Operations
1. Navigate to the "Kitchen" section
2. View pending orders
3. Update order status as preparation progresses
4. Mark orders as served when delivered

### Customer Management
1. Navigate to the "Customers" section
2. Add new customers or select existing ones
3. View customer details and visit history
4. Track order history and preferences

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons provided by Lucide React
- UI components from ShadCN UI
- Built with React and Express