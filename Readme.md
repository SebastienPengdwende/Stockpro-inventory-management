# StockPro - Inventory Management System

## Overview
StockPro is a modern, client-side inventory management application designed for small businesses and demo environments. It features a single-page architecture, interactive dashboards, real-time data visualization, and user-friendly product management—all in just three files (HTML, CSS, JS).

## Features
- **Single Page Application (SPA):** All functionality in one HTML file
- **Interactive Dashboard:** Real-time charts and summary cards
- **Product Management:** Add, edit, delete, and filter products
- **Stock Alerts:** Visual notifications for low and critical stock
- **CSV Export:** Download your inventory data
- **User Profile:** Customizable business and user settings
- **Local Storage:** All data is stored securely in the browser
- **Modern UI:** Responsive design, Feather icons, and Chart.js integration

## Technology Stack
- **HTML5 & CSS3:** Semantic markup and modern layouts (Flexbox, Grid)
- **JavaScript (ES6+):** Class-based, modular code
- **Chart.js:** For dynamic data visualization
- **Feather Icons:** Lightweight SVG icons

## Application Structure
- **index.html:** Main SPA container and UI
- **style.css:** All styles, including responsive and theme
- **script.js:** Application logic, data management, and event handling

## Data Model
Each product is represented as an object with:
- `id`: Unique identifier
- `name`: Product name
- `category`: Product category
- `quantity`: Stock quantity
- `price`: Product price
- `minStockLevel`: Minimum stock threshold
- `dateAdded`: Timestamp

## How It Works
1. **Initialization:** Loads products and user settings from localStorage
2. **Dashboard:** Displays key metrics and charts
3. **Product Table:** Sortable, filterable, and editable list
4. **Modals:** For product and profile management
5. **Real-Time Updates:** UI and charts update instantly on data change

## External Dependencies
- **Chart.js:** For charts ([CDN](https://cdn.jsdelivr.net/npm/chart.js))
- **Feather Icons:** For UI icons ([CDN](https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js))

## Deployment
- **Static Hosting:** Works on GitHub Pages, Netlify, Vercel, or any static host
- **No Backend Required:** 100% client-side, no server needed
- **Browser Support:** Chrome, Firefox, Safari, Edge (ES6+)

## Security & Privacy
- **Client-Side Only:** No server-side vulnerabilities
- **Data Isolation:** Each user's data is private to their browser
- **Input Sanitization:** Prevents XSS in user-generated content

## Quick Start
1. Clone or download the repository
2. Open `index.html` in your browser
3. Start managing your inventory instantly

---
## Project Contributors

- Akram Mu'min OUEDRAOGO
- Awa KABORE
- Mouniratou BOUDA
- Marc NANA
- Pengdwendé Sébastien ZOUNGRANA 