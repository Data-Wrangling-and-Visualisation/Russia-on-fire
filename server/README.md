# Wildfires API Documentation

This API provides access to a database of wildfires in Russia. It allows filtering, statistical analysis, export, and data visualization. All endpoints are prefixed with `/fires`.

---

## Endpoints

### `GET /fires/`
Retrieve a list of wildfires.

**Query Parameters:**
- `region_name`: Filter by region (partial match).
- `year`: Filter by specific year.
- `fire_type`: Filter by fire type (`Лесные`, `Нелесные`).
- `min_latitude`, `max_latitude`: Filter by latitude bounds.
- `min_longitude`, `max_longitude`: Filter by longitude bounds.
- `limit`: Number of results to return (1-1000).

### `GET /fires/paginated`
Same as `/fires/`, but with pagination.

**Query Parameters:**
- `page`: Page number (default: 1).
- `per_page`: Number of records per page (1-1000).

### `GET /fires/stats/regions`
Returns number and total area of fires grouped by region.

### `GET /fires/stats/years`
Returns number and total area of fires grouped by year.

### `GET /fires/stats/types`
Returns number and total area of fires grouped by fire type.

### `GET /fires/heatmap-points`
Returns geo points (latitude, longitude, area) for rendering heatmaps.

**Query Parameters:**
- `year`: Optional year filter.
- `limit`: Maximum number of points (100 - 50000).

### `GET /fires/stats/months`
Returns number and total area of fires grouped by month (across all years).

### `GET /fires/nearby`
Returns fires located within a radius of a specific point.

**Query Parameters:**
- `latitude`: Latitude of point.
- `longitude`: Longitude of point.
- `radius_km`: Radius in kilometers.
- `limit`: Maximum number of results.

### `GET /fires/export`
Exports all fire data to a CSV file.

**Query Parameters:**
- `format`: Only `csv` is currently supported.

### `GET /fires/stats/region-year`
Returns number and area of fires by region and year (multi-dimensional).
Useful for heatmaps or stacked bar charts.

### `GET /fires/stats/month-year`
Returns number and area of fires by month and year.
Useful for seasonal analysis.

### `GET /fires/stats/average-area-per-fire`
Returns average area of a single fire per region.
Useful for comparing fire severity.

### `GET /fires/stats/top-fires`
Returns top fires sorted by area.

**Query Parameters:**
- `limit`: Number of top fires to return (default: 10).

### `GET /fires/stats/fire-duration`
Returns average duration of fires (in days) per region.
Useful for temporal analysis.

---

## Notes
- All endpoints return JSON.
- Data is based on the `FireDB` model with attributes like: region, coordinates, fire type, area, and dates.

---

## Example Use Cases
- Visualizing number of fires per region and year using bar charts.
- Building a heatmap using `heatmap-points` endpoint.
- Tracking fire duration trends over time.
- Exporting data for offline analysis in Excel or Python.

---
API base URL: `http://localhost:8000/fires`

