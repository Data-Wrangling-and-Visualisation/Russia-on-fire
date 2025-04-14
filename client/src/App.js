import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import FireBarChart from './components/FireBarChart'; // Example chart
import FireMap from './components/FireMap';

// Base URL for your FastAPI backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [fireData, setFireData] = useState([]);
  const [filteredData, setFilteredData] = useState([]); // Data potentially filtered/aggregated for charts
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Filter State ---
  const [filterYear, setFilterYear] = useState(''); // e.g., '2023'
  const [filterRegion, setFilterRegion] = useState('');
  const [filterType, setFilterType] = useState(''); // 'Лесные', 'Нелесные', or '' for all
  const [limit, setLimit] = useState(1000); // Match API default or allow user change

  // --- Fetch Data Function ---
  const fetchFires = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Construct query parameters based on filter state
    const params = new URLSearchParams();
    if (filterYear) params.append('year', filterYear);
    if (filterRegion) params.append('region_name', filterRegion);
    if (filterType) params.append('fire_type', filterType);
    params.append('limit', limit);
    // Add other filters like lat/lon bounds if you implement UI for them

    try {
      const response = await fetch(`${API_BASE_URL}/fires?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
       // Convert lat/lon from string (Decimal comes as string) to number for D3
      const processedData = data.map(d => ({
        ...d,
        latitude: d.latitude ? parseFloat(d.latitude) : null,
        longitude: d.longitude ? parseFloat(d.longitude) : null,
        // Convert other decimals if needed
      })).filter(d => d.latitude != null && d.longitude != null); // Ensure points are plottable

      setFireData(processedData);
      // Example: Prepare data for bar chart (aggregate here or in component)
      // This could be moved to a separate useEffect or memoized calculation
      setFilteredData(processedData); // Initially just pass all data

    } catch (e) {
      console.error("Failed to fetch fire data:", e);
      setError(`Failed to load data: ${e.message}`);
      setFireData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterRegion, filterType, limit]); // Dependencies for useCallback

  // --- Initial Fetch and Refetch on Filter Change ---
  useEffect(() => {
    fetchFires();
  }, [fetchFires]); // fetchFires is stable due to useCallback

  // --- Event Handlers for Filters ---
  const handleApplyFilters = () => {
     fetchFires(); // Manually trigger fetch if needed, or rely on useEffect
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Wildfire Dashboard</h1>
      </header>

      <div className="filters">
        <label>
          Year:
          <input
            type="number"
            placeholder="e.g., 2023"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          />
        </label>
        <label>
          Region:
          <input
            type="text"
            placeholder="e.g., Siberia"
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
          />
        </label>
        <label>
          Type:
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All</option>
            <option value="Лесные">Лесные (Forest)</option>
            <option value="Нелесные">Нелесные (Non-Forest)</option>
          </select>
        </label>
         <label>
          Limit:
          <input
            type="number"
            value={limit}
            min="1"
            max="10000"
            onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value) || 1000))}
          />
        </label>
        {/* Remove button if fetch triggers automatically on input change */}
        {/* <button onClick={handleApplyFilters} disabled={loading}>
          Apply Filters
        </button> */}
      </div>

      <main className="visualizations">
        {loading && <p className="loading-message">Loading data...</p>}
        {error && <p className="error-message">{error}</p>}

        <section className="viz-section">
          <h2>Fire Locations Map</h2>
          <div className='chart-container'>
             {/* Pass only valid data to map */}
             <FireMap fireData={fireData.filter(d => d.latitude && d.longitude)} width={800} height={500} />
          </div>
        </section>

        <section className="viz-section">
           <h2>Fires by Year (Example Bar Chart)</h2>
           <div className='chart-container'>
              {/* Bar chart might need aggregated data */}
              <FireBarChart fireData={filteredData} width={600} height={300} />
           </div>
        </section>

        {/* Add more visualization components here */}

      </main>
    </div>
  );
}

export default App;