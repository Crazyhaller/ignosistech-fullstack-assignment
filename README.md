# 🗺️ RetailScope — Interactive US Retail Locations Map

An interactive, high-performance retail intelligence map built for large-scale geospatial visualization of 150k+ retail locations across the United States.

The application dynamically adapts rendering based on zoom level, viewport bounds, and server-side filtering to ensure scalable performance and a smooth user experience.

---

## ✨ Features

### Three Dynamic Zoom Tiers

- **Tier 1 — State Aggregation (Zoom 0-4):** At low zoom levels, the map displays aggregated state-level retail counts positioned at state centroids.
- **Tier 2 — Cluster Visualization (Zoom 5-9):** At mid zoom levels, nearby stores are grouped into dynamic clusters using Supercluster.
- **Tier 3 — Individual Store Rendering (Zoom 10+):** At deep zoom levels, individual retail locations are rendered with interactive store markers and detailed info windows.

### Viewport-Based Fetching

The frontend only requests data for the currently visible map viewport. On every significant **pan**, **zoom**, or **viewport change**, the frontend sends:

- North/South/East/West bounds
- Current zoom level
- Active filters

The backend returns only relevant data for the visible region, preventing the browser from loading the entire 150k+ dataset into memory.

### Server-Side Filtering

Supported filters:

- **State**
- **Status**

Filtering is handled entirely on the backend and seamlessly integrated with viewport queries.

### Performance Optimizations

- Viewport-based querying
- Debounced map requests
- Client-side viewport caching
- Dynamic clustering & zoom-tier rendering
- PostgreSQL spatial indexing
- PostGIS-enabled architecture

---

## 🛠️ Tech Stack

**Frontend**

- React & TypeScript
- Vite
- Tailwind CSS
- Zustand (State Management)
- Axios
- Google Maps JavaScript API (`@vis.gl/react-google-maps`)

**Backend**

- Node.js & Express
- TypeScript
- PostgreSQL & PostGIS
- Supercluster

---

## 🏗️ Architecture Overview

### Frontend Responsibilities

- Google Maps rendering & Viewport tracking
- Debounced API requests & Client-side caching
- Marker rendering & Info windows
- Filter UI

### Backend Responsibilities

- Viewport-based querying & Zoom-tier logic
- State aggregation & Cluster generation
- Dynamic SQL filtering & Geospatial querying

### Zoom Tier Logic

| Zoom Level | Mode              |
| :--------- | :---------------- |
| **0–4**    | State Aggregation |
| **5–9**    | Clusters          |
| **10+**    | Individual Stores |

---

## 📂 Project Structure

```text
frontend/
├── src/
│   ├── api/
│   ├── components/
│   │   ├── map/
│   │   ├── ui/
│   ├── hooks/
│   ├── store/
│   ├── types/

backend/
├── src/
│   ├── controllers/
│   ├── db/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── server.ts
│
├── scripts/
│   ├── importCsv.ts
```

````

---

## ⚙️ Environment Variables

### Frontend

Create a `.env` file in the `frontend/` directory:

```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
VITE_API_URL=http://localhost:5000

```

### Backend

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
DATABASE_URL=YOUR_NEON_DATABASE_URL

```

---

## 🗄️ Database Setup

We use **Neon PostgreSQL** for this project.

**1. Enable PostGIS**

```sql
CREATE EXTENSION postgis;

```

**2. Create Stores Table**

```sql
CREATE TABLE stores (
  id TEXT PRIMARY KEY,
  brand_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT,
  state TEXT,
  city TEXT,
  geom GEOGRAPHY(POINT, 4326)
);

```

**3. Create Spatial Index**

```sql
CREATE INDEX stores_geom_idx
ON stores
USING GIST (geom);

```

**4. CSV Import**
Place your dataset inside `backend/data/my_pois.csv` and run the importer script:

```bash
cd backend
npm run import:csv

```

---

## 🚀 Local Development

**Frontend**

```bash
cd frontend
npm install
npm run dev

```

**Backend**

```bash
cd backend
npm install
npm run dev

```

---

## 🔌 API Endpoint

### `GET /api/locations`

**Query Parameters**

| Param    | Description                |
| -------- | -------------------------- |
| `north`  | Northern viewport latitude |
| `south`  | Southern viewport latitude |
| `east`   | Eastern viewport longitude |
| `west`   | Western viewport longitude |
| `zoom`   | Current map zoom level     |
| `state`  | (Optional) State filter    |
| `status` | (Optional) Status filter   |

**Example Request:**

```http
GET /api/locations?north=49&south=24&east=-66&west=-125&zoom=5

```

---

## 🤔 Tradeoffs & Decisions

### Why Server-Side Clustering?

Clustering on the backend reduces frontend rendering overhead and scales significantly better for massive datasets.

### Why Viewport Fetching?

Fetching only visible data dramatically improves performance. Loading 150k+ points into the browser at once would:

- Increase memory usage
- Slow down rendering
- Hurt overall UX
- Increase network payload size dramatically

### Why Standard Markers Instead of AdvancedMarker?

Google `AdvancedMarker` requires Cloud Map IDs and additional setup. For reliability, delivery speed, and lower integration complexity, standard markers with custom styling were used instead. This provided stable rendering and a clean UX out of the box.

---

## 🔮 Future Improvements

If given more time, I would implement:

- Proper branded SVG store logos
- Animated cluster transitions
- Polygon/state boundaries & Heatmap visualization
- Persistent viewport caching & Redis caching layer
- Full-text location search
- Mobile-responsive sidebar
- Virtualized marker rendering
- WebSocket live updates

---

## 🤖 AI Usage Disclosure

AI tooling was used to:

- Accelerate scaffolding and generate boilerplate
- Assist in debugging
- Discuss architecture tradeoffs

_All implementation decisions, debugging, architecture integration, and final modifications were manually validated and adapted for this project._

---

## 🎥 Demo Checklist

The walkthrough/demo highlights:

- [x] All three zoom tiers in action
- [x] Viewport-based network requests
- [x] Dynamic clustering
- [x] Server-side filtering
- [x] Interactive info windows
- [x] Debounced fetching
- [x] Handling of large (150k+) datasets gracefully

---

## 👨‍💻 Author

**Suvigya**

_Full Stack Developer_

React • TypeScript • Node.js • PostgreSQL • Maps & Geospatial Systems

```
````
