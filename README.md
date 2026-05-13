# Switch-Market

> A lightweight, vanilla-JS shopping demo with D3-powered visualizations, real-time search, and CSV sales data integration — hosted on Firebase.

## What It Does

Switch-Market is a fast, accessible storefront demo that showcases:

- **Product Grid** — Responsive grid of products from multiple stores with images, prices, and descriptions.
- **Live Search** — Filter products instantly as you type.
- **Shopping Cart** — Add, remove, and manage items with quantity controls.
- **D3 Visualization** — Charts and data views powered by D3.js (loaded from CDN).
- **CSV Sales Data** — Loads and parses `synthetic_us_stores_sales.csv` for regional sales insights and analytics.

Built entirely with vanilla HTML, CSS, and JavaScript — zero build step, zero framework.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML5 / CSS3 / ES6 JavaScript |
| Data Viz | [D3.js](https://d3js.org/) v7 (CDN) |
| Hosting | [Firebase Hosting](https://firebase.google.com/products/hosting) |
| Data | Static CSV (`data/synthetic_us_stores_sales.csv`) |

## Quick Start

```bash
# Option 1: Open directly
open index.html

# Option 2: Serve locally
python3 -m http.server 8000
# Then open http://localhost:8000
```

### Deploy to Firebase

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Login and deploy
firebase login
firebase deploy
```

## Project Structure

```
index.html              # Main storefront page
styles.css              # Responsive styles + layout
app.js                  # All app logic (products, search, cart, D3, CSV parsing)
data/
  synthetic_us_stores_sales.csv  # Demo sales dataset
firebase.json           # Firebase Hosting configuration
.firebaserc             # Firebase project alias
```

## Features in Detail

### Product System

Products are organized by store in a hard-coded array within `app.js`. Each product has:
- `id`, `name`, `price`, `img` (placeholder or real URL), `desc`

### Search

The search input filters products in real-time across all stores by name match.

### CSV Data Loader

`app.js` fetches `./data/synthetic_us_stores_sales.csv` on load, parses it with a custom CSV tokenizer (handles quoted fields with commas), and exposes the data for D3 charts or analytics panels.

### D3 Integration

D3 is loaded via CDN (`<script defer src="https://d3js.org/d3.v7.min.js">`). The app uses D3 for data binding and DOM manipulation where standard JS would be verbose.

## Configuration

### Firebase Hosting

`firebase.json` configures:
- Static file hosting from root
- `cleanUrls` (no `.html` extensions)
- CSV cache headers (`max-age=3600`)

To switch Firebase projects, update `.firebaserc`:
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

## License

No explicit LICENSE file. Assume all rights reserved unless otherwise stated.

---

Built as a quick demo by [Reuben Roy](https://github.com/reuben-roy).
