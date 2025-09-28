const stores = [
    {
        id: 1,
        name: "Store 1",
        items: [
            { id: "1-1", name: "Wireless Headphones", price: 79.99, img: "https://via.placeholder.com/160x120?text=Headphones", desc: "Comfortable, noise-isolating over-ear cans." },
            { id: "1-2", name: "Bluetooth Speaker", price: 49.99, img: "https://via.placeholder.com/160x120?text=Speaker", desc: "Portable and water-resistant." },
            { id: "1-3", name: "USB-C Hub", price: 24.99, img: "https://via.placeholder.com/160x120?text=USB-C+Hub", desc: "Add ports for your laptop." }
        ]
    },
    {
        id: 2,
        name: "Store 2",
        items: [
            { id: "2-1", name: "Smartwatch", price: 129.0, img: "https://via.placeholder.com/160x120?text=Smartwatch", desc: "Track fitness, sleep, and notifications." },
            { id: "2-2", name: "External SSD 1TB", price: 119.99, img: "https://via.placeholder.com/160x120?text=External+SSD", desc: "Fast portable storage." }
        ]
    },
    {
        id: 3,
        name: "Store 3",
        items: [
            { id: "3-1", name: "Mechanical Keyboard", price: 99.0, img: "https://via.placeholder.com/160x120?text=Keyboard", desc: "Tactile keys with RGB lighting." },
            { id: "3-2", name: "Gaming Mouse", price: 39.5, img: "https://via.placeholder.com/160x120?text=Mouse", desc: "Ergonomic with adjustable DPI." }
        ]
    },
    {
        id: 4,
        name: "Store 4",
        items: [
            { id: "4-1", name: "4K Monitor", price: 299.99, img: "https://via.placeholder.com/160x120?text=4K+Monitor", desc: "Crisp display for work and play." }
        ]
    },
    { id: 5, name: "Store 5", items: [] },
    { id: 6, name: "Store 6", items: [] },
    { id: 7, name: "Store 7", items: [] },
    { id: 8, name: "Store 8", items: [] }
];

const grid = document.getElementById("product-grid");
const searchInput = document.getElementById("searchInput");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.getElementById("nav-menu");
const yearEl = document.getElementById("year");

// Add CSV data storage
let csvData = [];
let salesData = [];

// Function to load CSV file
async function loadCSVFile() {
    try {
        const response = await fetch('./data/synthetic_us_stores_sales.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error('Error loading CSV file:', error);
        return [];
    }
}

// CSV parsing function
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Handle CSV parsing with potential commas in quoted fields
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/"/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/"/g, ''));

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        data.push(row);
    }
    return data;
}

// Function to process CSV data and update stores
function processCSVData(data) {
    console.log('Processing CSV data:', data);
    csvData = data;

    // Group data by store
    const storeGroups = {};
    data.forEach(row => {
        console.log('Processing row:', row);
        const storeId = row.store_id || 'US_Store_Unknown';
        // Extract location from store_id (e.g., "US_Store_NYC" -> "NYC Store")
        const locationMatch = storeId.match(/US_Store_(.+)/);
        const storeName = locationMatch ? `${locationMatch[1]} Store` : storeId;

        if (!storeGroups[storeId]) {
            storeGroups[storeId] = {
                id: storeId,
                name: storeName,
                items: [],
                sales: 0,
                totalRevenue: 0
            };
        }

        // Add item if not exists or update sales
        const productName = row.product_name;
        let existingItem = storeGroups[storeId].items.find(item =>
            item.name === productName
        );

        if (!existingItem && productName) {
            existingItem = {
                id: `${storeId}-${row.product_id}`,
                name: productName,
                price: parseFloat(row.price) || 0,
                img: `https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fdevelopers.elementor.com%2Fdocs%2Fassets%2Fimg%2Felementor-placeholder-image.png&f=1&nofb=1&ipt=c1cbaa0288fd1e85c71c87d21fe79b329970d161fe906de8578f2e2f05ae8863`,
                desc: `${row.category} product - Stock: ${row.stock_on_hand}`,
                sales: 0,
                category: row.category,
                stockOnHand: parseInt(row.stock_on_hand) || 0,
                soldOut: row.sold_out_flag === 'true' || row.sold_out_flag === '1'
            };
            storeGroups[storeId].items.push(existingItem);
        }

        // Update sales for existing items
        if (existingItem) {
            const quantity = parseInt(row.units_sold) || 0;
            existingItem.sales += quantity;
        }

        // Update store totals
        const quantity = parseInt(row.units_sold) || 0;
        const price = parseFloat(row.price) || 0;
        storeGroups[storeId].sales += quantity;
        storeGroups[storeId].totalRevenue += quantity * price;
    });

    console.log('Store groups:', storeGroups);

    // Update global stores array
    stores.length = 0;
    Object.values(storeGroups).forEach(store => stores.push(store));

    // Fill remaining slots if needed - generate unique store IDs
    const existingLocations = stores.map(s => s.id);
    const cityNames = ['LA', 'Chicago', 'Miami', 'Boston', 'Seattle', 'Denver', 'Austin'];
    let locationIndex = 0;

    while (stores.length < 8) {
        let newStoreId = `US_Store_${cityNames[locationIndex] || `Store${stores.length + 1}`}`;
        locationIndex++;

        // Make sure we don't duplicate existing store IDs
        while (existingLocations.includes(newStoreId)) {
            newStoreId = `US_Store_Store${stores.length + 1}`;
        }

        stores.push({
            id: newStoreId,
            name: `${cityNames[locationIndex - 1] || `Store ${stores.length + 1}`} Store`,
            items: [],
            sales: 0,
            totalRevenue: 0
        });
        existingLocations.push(newStoreId);
    }

    // Process sales data for visualization
    salesData = data.filter(row => row.date && row.units_sold);
    console.log('Sales data for visualization:', salesData);
}

// Demand forecasting function
function calculateDemandForecast(itemData, periods = 3) {
    if (!itemData || itemData.length < 2) {
        return {
            forecast: [],
            trend: 'stable',
            confidence: 'low',
            avgDemand: 0
        };
    }

    // Group by month and sum sales
    const monthlyData = d3.rollup(itemData,
        v => d3.sum(v, d => parseInt(d.units_sold) || 0),
        d => {
            const date = new Date(d.date);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
    );

    const sortedData = Array.from(monthlyData.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, sales]) => ({ month, sales }));

    if (sortedData.length < 2) {
        return {
            forecast: [],
            trend: 'stable',
            confidence: 'low',
            avgDemand: sortedData[0]?.sales || 0
        };
    }

    // Calculate moving average
    const windowSize = Math.min(3, sortedData.length);
    const movingAvg = sortedData.slice(-windowSize).reduce((sum, d) => sum + d.sales, 0) / windowSize;

    // Calculate trend
    const recentData = sortedData.slice(-3);
    let trend = 'stable';
    if (recentData.length >= 2) {
        const firstHalf = recentData.slice(0, Math.ceil(recentData.length / 2));
        const secondHalf = recentData.slice(Math.floor(recentData.length / 2));
        const firstAvg = firstHalf.reduce((sum, d) => sum + d.sales, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, d) => sum + d.sales, 0) / secondHalf.length;

        if (secondAvg > firstAvg * 1.1) trend = 'increasing';
        else if (secondAvg < firstAvg * 0.9) trend = 'decreasing';
    }

    // Generate forecasts
    const forecast = [];
    let baseValue = movingAvg;
    const trendMultiplier = trend === 'increasing' ? 1.05 : trend === 'decreasing' ? 0.95 : 1.0;

    for (let i = 1; i <= periods; i++) {
        const lastMonth = new Date(sortedData[sortedData.length - 1].month + '-01');
        const forecastMonth = new Date(lastMonth);
        forecastMonth.setMonth(forecastMonth.getMonth() + i);

        const forecastValue = Math.max(0, Math.round(baseValue * Math.pow(trendMultiplier, i)));
        forecast.push({
            month: `${forecastMonth.getFullYear()}-${String(forecastMonth.getMonth() + 1).padStart(2, '0')}`,
            predictedSales: forecastValue
        });
    }

    return {
        forecast,
        trend,
        confidence: sortedData.length >= 6 ? 'high' : sortedData.length >= 3 ? 'medium' : 'low',
        avgDemand: Math.round(movingAvg),
        historicalData: sortedData
    };
}

// Supply forecasting function
function calculateSupplyForecast(item, demandForecast, store) {
    const currentStock = item.stockOnHand || 0;
    const avgDemand = demandForecast.avgDemand || 0;
    const trend = demandForecast.trend;

    // Calculate safety stock (20% of average demand)
    const safetyStock = Math.ceil(avgDemand * 0.2);

    // Calculate reorder point
    const leadTime = 1; // months
    const reorderPoint = (avgDemand * leadTime) + safetyStock;

    // Determine if reorder is needed
    const needsReorder = currentStock <= reorderPoint;

    // Calculate suggested order quantity
    const economicOrderQty = Math.ceil(avgDemand * 2); // 2 months supply

    // Adjust for trend
    let trendAdjustment = 1.0;
    if (trend === 'increasing') trendAdjustment = 1.2;
    else if (trend === 'decreasing') trendAdjustment = 0.8;

    const adjustedOrderQty = Math.ceil(economicOrderQty * trendAdjustment);

    // Calculate predicted stock levels
    const stockForecast = [];
    let currentPredictedStock = currentStock;

    demandForecast.forecast.forEach((demand, index) => {
        // Assume reorder happens if stock is low
        if (currentPredictedStock <= reorderPoint && index === 0) {
            currentPredictedStock += adjustedOrderQty;
        }

        currentPredictedStock -= demand.predictedSales;
        stockForecast.push({
            month: demand.month,
            predictedStock: Math.max(0, currentPredictedStock),
            demand: demand.predictedSales
        });
    });

    return {
        currentStock,
        safetyStock,
        reorderPoint,
        needsReorder,
        suggestedOrderQty: adjustedOrderQty,
        stockForecast,
        recommendation: needsReorder ?
            `Reorder ${adjustedOrderQty} units immediately` :
            `Stock adequate for ${Math.floor(currentStock / Math.max(avgDemand, 1))} months`
    };
}

// Create enhanced sales chart with forecasting
function createSalesChart(container, data, selectedItem = null) {
    // Clear any existing content
    d3.select(container).selectAll("*").remove();

    // Filter data by selected item if provided
    let filteredData = data;
    if (selectedItem) {
        filteredData = data.filter(row =>
            row.product_name === selectedItem.name ||
            row.product_id === selectedItem.id.split('-')[1]
        );
    }

    console.log('Creating chart with data:', filteredData);

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 400 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process data by month with sold/unsold breakdown
    const salesByMonth = d3.rollup(filteredData,
        v => {
            const totalSold = d3.sum(v, d => parseInt(d.units_sold) || 0);
            // Use the most recent stock_on_hand for each month
            const latestEntry = v[v.length - 1];
            const stockOnHand = parseInt(latestEntry.stock_on_hand) || 0;
            const unsold = Math.max(0, stockOnHand);

            return {
                sold: totalSold,
                unsold: unsold,
                total: totalSold + unsold
            };
        },
        d => {
            const date = new Date(d.date);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
    );

    console.log('Sales by month:', salesByMonth);

    const chartData = Array.from(salesByMonth, ([month, data]) => ({
        month,
        sold: data.sold,
        unsold: data.unsold,
        total: data.total
    })).sort((a, b) => a.month.localeCompare(b.month));

    console.log('Chart data:', chartData);

    if (chartData.length === 0) {
        // Show "No data" message
        g.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', '#666')
            .text(selectedItem ? `No sales data for ${selectedItem.name}` : 'No sales data available');
        return;
    }

    // Add forecasting if selectedItem is provided
    if (selectedItem) {
        const itemSpecificData = filteredData.filter(row =>
            row.product_name === selectedItem.name ||
            row.product_id === selectedItem.id.split('-')[1]
        );

        if (itemSpecificData.length > 0) {
            const demandForecast = calculateDemandForecast(itemSpecificData);

            // Add forecast data to chart
            const forecastData = demandForecast.forecast.map(f => ({
                month: f.month,
                sold: f.predictedSales,
                unsold: 0,
                total: f.predictedSales,
                isForecast: true
            }));

            chartData.push(...forecastData);
        }
    }

    const xScale = d3.scaleBand()
        .domain(chartData.map(d => d.month))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.total)])
        .range([height, 0]);

    // Create stacked data
    const stack = d3.stack()
        .keys(['sold', 'unsold'])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const stackedData = stack(chartData);

    // Color scale with forecast colors
    const colorScale = d3.scaleOrdinal()
        .domain(['sold', 'unsold'])
        .range(['#87CEEB', '#ff6b6b']);

    // Add stacked bars with different styling for forecasts
    g.selectAll('.stack')
        .data(stackedData)
        .enter().append('g')
        .attr('class', 'stack')
        .attr('fill', d => colorScale(d.key))
        .selectAll('rect')
        .data(d => d)
        .enter().append('rect')
        .attr('x', d => xScale(d.data.month))
        .attr('width', xScale.bandwidth())
        .attr('y', height)
        .attr('height', 0)
        .attr('opacity', d => d.data.isForecast ? 0.5 : 0.8)
        .attr('stroke', d => d.data.isForecast ? '#333' : 'none')
        .attr('stroke-width', d => d.data.isForecast ? 1 : 0)
        .attr('stroke-dasharray', d => d.data.isForecast ? '5,5' : 'none')
        .transition()
        .duration(800)
        .delay((d, i) => i * 100)
        .attr('y', d => yScale(d[1]))
        .attr('height', d => yScale(d[0]) - yScale(d[1]));

    // Add axes
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('font-size', '10px');

    g.append('g')
        .call(d3.axisLeft(yScale));

    // Add legend
    const legend = g.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 100}, 10)`);

    const legendData = [
        { key: 'sold', label: 'Sold', color: '#87CEEB' },
        { key: 'unsold', label: 'Unsold', color: '#ff6b6b' }
    ];

    const legendItem = legend.selectAll('.legend-item')
        .data(legendData)
        .enter().append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendItem.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', d => d.color)
        .attr('opacity', 0.8);

    legendItem.append('text')
        .attr('x', 16)
        .attr('y', 6)
        .attr('dy', '0.32em')
        .style('font-size', '10px')
        .text(d => d.label);

    // Add value labels on top of bars
    g.selectAll('.total-label')
        .data(chartData)
        .enter().append('text')
        .attr('class', 'total-label')
        .attr('x', d => xScale(d.month) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.total) - 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#333')
        .text(d => d.total);

    // Add forecast line to separate historical from predicted
    if (selectedItem && chartData.some(d => d.isForecast)) {
        const firstForecastIndex = chartData.findIndex(d => d.isForecast);
        if (firstForecastIndex > 0) {
            const x = xScale(chartData[firstForecastIndex].month) - xScale.bandwidth() * 0.1;
            g.append('line')
                .attr('x1', x)
                .attr('x2', x)
                .attr('y1', 0)
                .attr('y2', height)
                .attr('stroke', '#666')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '3,3')
                .attr('opacity', 0.7);

            g.append('text')
                .attr('x', x + 5)
                .attr('y', 15)
                .attr('font-size', '10px')
                .attr('fill', '#666')
                .text('Forecast →');
        }
    }
}

function formatPrice(n) {
    return `$${n.toFixed(2)}`;
}

function createCard(store) {
    const items = store.items || [];
    const el = document.createElement("details");
    el.className = "card";
    el.style.gridColumn = "1 / -1";
    el.setAttribute("data-id", String(store.id));

    // Enhanced store summary with sales data
    const salesInfo = store.sales ?
        `${store.sales} units sold • $${(store.totalRevenue || 0).toFixed(2)} revenue` :
        `${items.length} item${items.length === 1 ? "" : "s"}`;

    el.innerHTML = `
      <summary class="card-title" aria-label="Toggle ${store.name}">
        <span>${store.name}</span>
        <span class="price" style="font-weight: normal; opacity: 0.7;">${salesInfo}</span>
      </summary>
      <div class="card-body">
        ${items.length ? `
          <ul class="store-items" style="display: grid; gap: 0.75rem; padding: 0; margin: 0; list-style: none;">
            ${items.map(it => `
              <li class="store-item" data-item-id="${it.id}" style="display: grid; grid-template-columns: 96px 1fr; gap: 0.75rem; align-items: start; cursor: pointer;">
                <img src="${it.img}" alt="${it.name}" loading="lazy" style="width: 96px; height: 72px; object-fit: cover; border-radius: 6px;" />
                <div>
                  <div style="display:flex; justify-content: space-between; gap: 0.5rem;">
                    <strong>${it.name}</strong>
                    <span class="price">${formatPrice(it.price)}</span>
                  </div>
                  <p class="desc" style="margin: 0.25rem 0 0; opacity: 0.8;">${it.desc}</p>
                  ${it.sales ? `<p style="margin: 0.25rem 0 0; font-size: 0.9em; color: #22c55e;">📊 ${it.sales} sold</p>` : ''}
                  ${it.soldOut ? `<p style="margin: 0.25rem 0 0; font-size: 0.9em; color: #ef4444;">❌ Sold Out</p>` : ''}
                </div>
              </li>
            `).join("")}
          </ul>
        ` : `<p class="desc" style="margin: 0; opacity: 0.8;">No items available.</p>`}
      </div>
    `;

    // Add sales chart if data exists - use setTimeout to ensure DOM is ready
    if (store.sales > 0) {
        setTimeout(() => {
            const chartContainer = el.querySelector('.sales-chart');
            const storeData = csvData.filter(row => row.store_id === store.id);
            console.log(`Store ${store.id} data:`, storeData);
            if (chartContainer && storeData.length > 0) {
                createSalesChart(chartContainer, storeData);
            } else {
                console.warn(`No chart data found for store ${store.id}`);
            }
        }, 100);
    }

    return el;
}

// Create the expandable panel shown under an item
function createItemPanel(item) {
    const panel = document.createElement("li");
    panel.className = "store-item-panel";
    panel.style.display = "grid";
    panel.style.gridTemplateColumns = "96px 1fr";
    panel.style.gap = "0.75rem";

    // Get the store that contains this item
    const currentStore = stores.find(store =>
        store.items && store.items.some(storeItem => storeItem.id === item.id)
    );

    // Calculate forecasts
    let demandForecast = null;
    let supplyForecast = null;

    if (currentStore) {
        const itemData = csvData.filter(row =>
            row.store_id === currentStore.id &&
            (row.product_name === item.name || row.product_id === item.id.split('-')[1])
        );

        if (itemData.length > 0) {
            demandForecast = calculateDemandForecast(itemData);
            supplyForecast = calculateSupplyForecast(item, demandForecast, currentStore);
        }
    }

    // Enhanced store analysis for particle flows with more lenient criteria
    const storeAnalysis = stores.map((store, storeIndex) => {
        const storeItemData = csvData.filter(row =>
            row.store_id === store.id &&
            (row.product_name === item.name || row.product_id === item.id.split('-')[1])
        );

        let demandIndicator = 'stable';
        let supplyStatus = 'ok';
        let avgDemand = 0;
        let currentStock = 0;

        // Find the item in this store
        const storeItem = store.items?.find(si => si.id === item.id || si.name === item.name);

        if (storeItemData.length > 0) {
            const forecast = calculateDemandForecast(storeItemData);
            demandIndicator = forecast.trend;
            avgDemand = forecast.avgDemand;

            if (storeItem) {
                currentStock = storeItem.stockOnHand || 0;
                const supply = calculateSupplyForecast(storeItem, forecast, store);
                supplyStatus = supply.needsReorder ? 'reorder' : 'ok';
            }
        } else if (storeItem) {
            // Even without sales data, use stock information
            currentStock = storeItem.stockOnHand || 0;
            supplyStatus = currentStock <= 5 ? 'reorder' : 'ok';
        }

        // More lenient criteria for demonstration
        const isOutOfStock = currentStock === 0 || (supplyStatus === 'reorder' && currentStock <= 3);
        const hasLowDemand = (demandIndicator === 'decreasing') ||
            (demandIndicator === 'stable' && avgDemand < 3) ||
            (currentStock > 15); // Consider high stock as potential source

        // For demo purposes, ensure we have some sources and targets
        const forceSource = storeIndex % 4 === 0 && currentStock > 5; // Every 4th store with stock
        const forceTarget = storeIndex % 4 === 2 && currentStock <= 8; // Every 4th store (offset) with low stock

        return {
            id: store.id,
            name: store.name,
            demandTrend: demandIndicator,
            supplyStatus,
            avgDemand,
            currentStock,
            isOutOfStock: isOutOfStock || forceTarget,
            hasLowDemand: hasLowDemand || forceSource,
            storeIndex
        };
    });

    console.log('Store Analysis for', item.name, ':', storeAnalysis);

    // Empty first column to visually align under the item's text column
    panel.innerHTML = `
      <div></div>
      <div style="display: flex; flex-direction: column; gap: 20px;">
        ${demandForecast && supplyForecast ? `
          <div class="forecast-summary" style="
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            padding: 1rem; 
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
            border-radius: 12px;
            border: 1px solid #dee2e6;
          ">
            <div class="demand-forecast" style="
              padding: 15px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
              <h4 style="margin: 0 0 10px; color: #495057; font-size: 14px;">📈 Demand Forecast</h4>
              <div style="font-size: 12px; color: #6c757d;">
                <div>Trend: <span style="color: ${demandForecast.trend === 'increasing' ? '#28a745' : demandForecast.trend === 'decreasing' ? '#dc3545' : '#6c757d'}; font-weight: bold;">${demandForecast.trend}</span></div>
                <div>Avg Monthly Demand: <strong>${demandForecast.avgDemand}</strong></div>
                <div>Confidence: <span style="color: ${demandForecast.confidence === 'high' ? '#28a745' : demandForecast.confidence === 'medium' ? '#ffc107' : '#dc3545'};">${demandForecast.confidence}</span></div>
                <div style="margin-top: 8px;">Next 3 months:</div>
                ${demandForecast.forecast.map(f => `
                  <div style="margin-left: 10px;">• ${f.month}: ${f.predictedSales} units</div>
                `).join('')}
              </div>
            </div>
            <div class="supply-forecast" style="
              padding: 15px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
              <h4 style="margin: 0 0 10px; color: #495057; font-size: 14px;">📦 Supply Forecast</h4>
              <div style="font-size: 12px; color: #6c757d;">
                <div>Current Stock: <strong>${supplyForecast.currentStock}</strong></div>
                <div>Reorder Point: <strong>${supplyForecast.reorderPoint}</strong></div>
                <div>Safety Stock: <strong>${supplyForecast.safetyStock}</strong></div>
                <div style="margin: 8px 0; padding: 8px; background: ${supplyForecast.needsReorder ? '#fff3cd' : '#d1edff'}; border-radius: 4px; color: ${supplyForecast.needsReorder ? '#856404' : '#004085'};">
                  <strong>${supplyForecast.needsReorder ? '⚠️ Reorder Needed' : '✅ Stock OK'}</strong>
                </div>
                <div><strong>Recommendation:</strong></div>
                <div style="margin-left: 10px; font-style: italic;">${supplyForecast.recommendation}</div>
              </div>
            </div>
          </div>
        ` : ''}
        
        ${item.sales > 0 ? `
          <div class="item-sales-chart-container" style="padding: 1rem; background: #f8f9fa; border-radius: 8px;">
            <h4 style="margin: 0 0 1rem; font-size: 1rem;">Sales Trend & Forecast - ${item.name}</h4>
            <div class="item-sales-chart" style="min-height: 250px;"></div>
          </div>
        ` : ''}
        
        <div class="store-circles-container" style="
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 100px;
          justify-items: center;
          align-items: center;
          padding: 20px 0;
          max-width: 600px;
          position: relative;
          min-height: 300px;
        ">
          <svg class="particle-flow-svg" style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
          "></svg>
          ${stores.map((store, index) => {
        const analysis = storeAnalysis[index];
        return `
            <div class="store-circle-item" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              cursor: pointer;
              transition: transform 0.2s ease;
              position: relative;
              z-index: 2;
            " data-store-id="${store.id}" 
               data-demand-trend="${analysis.demandTrend}" 
               data-supply-status="${analysis.supplyStatus}"
               data-store-index="${index}"
               data-has-low-demand="${analysis.hasLowDemand}"
               data-is-out-of-stock="${analysis.isOutOfStock}">
              <div class="circle-with-arrows" style="
                display: flex;
                align-items: center;
                gap: 15px;
              ">
                <svg class="circle-svg" width="80" height="80">
                </svg>
                <svg class="arrows-svg" width="30" height="80">
                </svg>
              </div>
              <div class="store-label" style="
                text-align: center;
                font-size: 12px;
                font-weight: 500;
                color: var(--text, #333);
                margin-top: 8px;
              ">${store.name}</div>
              <div class="forecast-indicators" style="
                display: flex;
                gap: 5px;
                margin-top: 4px;
                font-size: 10px;
              ">
                <span style="color: ${analysis.demandTrend === 'increasing' ? '#28a745' : analysis.demandTrend === 'decreasing' ? '#dc3545' : '#6c757d'};">
                  📈${analysis.demandTrend === 'increasing' ? '↗' : analysis.demandTrend === 'decreasing' ? '↘' : '→'}
                </span>
                <span style="color: ${analysis.supplyStatus === 'reorder' ? '#dc3545' : '#28a745'};">
                  📦${analysis.supplyStatus === 'reorder' ? '⚠' : '✓'}
                </span>
                ${analysis.hasLowDemand ? '<span style="color: #3742fa;">📤</span>' : ''}
                ${analysis.isOutOfStock ? '<span style="color: #ff4757;">📥</span>' : ''}
              </div>
            </div>
          `;
    }).join('')}
        </div>
      </div>
    `;

    // Enhanced particle flow system with better positioning
    function createParticleFlows() {
        const container = panel.querySelector('.store-circles-container');
        const particleSvg = d3.select(panel.querySelector('.particle-flow-svg'));

        if (!container || particleSvg.empty()) {
            console.log('Container or SVG not found');
            return;
        }

        // Wait for elements to be rendered
        setTimeout(() => {
            const storeElements = panel.querySelectorAll('.store-circle-item');

            // Get store positions relative to the container
            const storePositions = Array.from(storeElements).map((el, index) => {
                const rect = el.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const analysis = storeAnalysis[index];

                return {
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top + rect.height / 2,
                    element: el,
                    analysis: analysis
                };
            });

            console.log('Store Positions:', storePositions);

            // Find source and target stores with more lenient criteria
            const sourceStores = storePositions.filter(pos => pos.analysis.hasLowDemand);
            const targetStores = storePositions.filter(pos => pos.analysis.isOutOfStock);

            console.log('Source stores (excess inventory):', sourceStores.map(s => s.analysis.name));
            console.log('Target stores (need inventory):', targetStores.map(s => s.analysis.name));

            if (sourceStores.length === 0 || targetStores.length === 0) {
                console.log('No valid flows found. Creating demo flows...');
                // Create demo flows between first few stores
                if (storePositions.length >= 4) {
                    sourceStores.push(storePositions[0], storePositions[1]);
                    targetStores.push(storePositions[2], storePositions[3]);
                }
            }

            if (sourceStores.length === 0 || targetStores.length === 0) {
                console.log('Still no flows possible');
                return;
            }

            // Create particle flows
            const flows = [];
            sourceStores.forEach(source => {
                targetStores.forEach(target => {
                    if (source.analysis.id !== target.analysis.id) {
                        flows.push({ source, target });
                    }
                });
            });

            console.log(`Creating ${flows.length} particle flows`);

            // Animate particles along paths
            function animateParticles() {
                flows.forEach((flow, flowIndex) => {
                    setTimeout(() => {
                        createParticleFlow(particleSvg, flow, flowIndex);
                    }, flowIndex * 500); // Stagger flow starts
                });
            }

            // Start animations
            animateParticles();

            // Repeat animation every 8 seconds
            setInterval(animateParticles, 8000);
        }, 500); // Give time for DOM to settle
    }

    function createParticleFlow(svg, flow, flowIndex) {
        const dx = flow.target.x - flow.source.x;
        const dy = flow.target.y - flow.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Create a more pronounced curve
        const midX = flow.source.x + dx / 2;
        const midY = flow.source.y + dy / 2;
        const offsetX = -dy / distance * 50; // Perpendicular offset
        const offsetY = dx / distance * 50;

        const controlX = midX + offsetX;
        const controlY = midY + offsetY;

        const pathData = `M${flow.source.x},${flow.source.y} Q${controlX},${controlY} ${flow.target.x},${flow.target.y}`;

        // Create visible path for debugging (remove in production)
        const visiblePath = svg.append('path')
            .attr('d', pathData)
            .attr('stroke', '#4facfe')
            .attr('stroke-width', 1)
            .attr('fill', 'none')
            .attr('opacity', 0.3)
            .attr('stroke-dasharray', '2,2');

        // Remove visible path after a while
        setTimeout(() => visiblePath.remove(), 6000);

        // Create invisible path for particle animation
        const path = svg.append('path')
            .attr('d', pathData)
            .attr('stroke', 'none')
            .attr('fill', 'none')
            .attr('id', `flow-path-${flowIndex}-${Date.now()}`);

        // Create multiple particles
        const particleCount = 4;
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                createSingleParticle(svg, path, flowIndex, i, flow);
            }, i * 600);
        }

        // Clean up path after all particles are done
        setTimeout(() => path.remove(), 4000);
    }

    function createSingleParticle(svg, pathElement, flowIndex, particleIndex, flow) {
        // Add glow filter if not exists
        let defs = svg.select('defs');
        if (defs.empty()) {
            defs = svg.append('defs');
        }

        const filterID = `glow-${flowIndex}-${particleIndex}-${Date.now()}`;
        const filter = defs.append('filter')
            .attr('id', filterID)
            .attr('x', '-100%')
            .attr('y', '-100%')
            .attr('width', '300%')
            .attr('height', '300%');

        filter.append('feGaussianBlur')
            .attr('stdDeviation', '4')
            .attr('result', 'coloredBlur');

        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Create particle group
        const particle = svg.append('g')
            .attr('class', 'particle')
            .attr('opacity', 0);

        // Main particle
        particle.append('circle')
            .attr('r', 5)
            .attr('fill', '#4facfe')
            .attr('filter', `url(#${filterID})`);

        // Particle trail
        particle.append('circle')
            .attr('r', 3)
            .attr('fill', '#87ceeb')
            .attr('opacity', 0.6)
            .attr('transform', 'translate(-10, 0)');

        console.log(`Animating particle ${particleIndex} for flow ${flowIndex}`);

        // Animate particle
        particle.transition()
            .duration(300)
            .attr('opacity', 1)
            .transition()
            .duration(3000)
            .ease(d3.easeLinear)
            .attrTween('transform', () => {
                const pathLength = pathElement.node().getTotalLength();
                return (t) => {
                    const point = pathElement.node().getPointAtLength(t * pathLength);
                    return `translate(${point.x}, ${point.y})`;
                };
            })
            .transition()
            .duration(300)
            .attr('opacity', 0)
            .on('end', () => {
                particle.remove();
                // Clean up filter
                defs.select(`#${filterID}`).remove();

                // Create arrival burst
                createArrivalBurst(svg, flow.target.x, flow.target.y);
            });
    }

    function createArrivalBurst(svg, x, y) {
        const burst = svg.append('g')
            .attr('transform', `translate(${x}, ${y})`)
            .attr('opacity', 0);

        // Create burst particles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const burstParticle = burst.append('circle')
                .attr('r', 3)
                .attr('fill', '#00d4ff')
                .attr('cx', 0)
                .attr('cy', 0);

            burstParticle.transition()
                .duration(800)
                .attr('cx', Math.cos(angle) * 20)
                .attr('cy', Math.sin(angle) * 20)
                .attr('r', 0)
                .attr('opacity', 0);
        }

        burst.transition()
            .duration(100)
            .attr('opacity', 1)
            .transition()
            .delay(800)
            .duration(200)
            .attr('opacity', 0)
            .on('end', () => burst.remove());
    }

    // Create D3.js circles and arrows
    panel.querySelectorAll('.store-circle-item').forEach(storeItem => {
        const storeId = storeItem.getAttribute('data-store-id');
        const storeIndex = parseInt(storeItem.getAttribute('data-store-index'));
        const analysis = storeAnalysis[storeIndex];
        const svg = d3.select(storeItem.querySelector('.circle-svg'));
        const arrowsSvg = d3.select(storeItem.querySelector('.arrows-svg'));

        // Create gradient definition with colors based on forecasts
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', `gradient-${storeId}-${Date.now()}`)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '100%');

        // Enhanced gradient colors based on flow participation
        let gradientColors;
        if (analysis.isOutOfStock) {
            gradientColors = ['#ff4757', '#c44569']; // Red for receivers
        } else if (analysis.hasLowDemand) {
            gradientColors = ['#3742fa', '#2f3542']; // Blue for senders
        } else if (analysis.supplyStatus === 'reorder') {
            gradientColors = ['#ff6348', '#e55039']; // Orange for reorder needed
        } else {
            gradientColors = ['#26de81', '#20bf6b']; // Green for healthy stock
        }

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', gradientColors[0]);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', gradientColors[1]);

        // Create circle with enhanced effects for flow participants
        const circle = svg.append('circle')
            .attr('cx', 40)
            .attr('cy', 40)
            .attr('r', 0)
            .attr('fill', `url(#gradient-${storeId}-${Date.now()})`)
            .style('cursor', 'pointer');

        // Add enhanced glow for flow participants
        if (analysis.isOutOfStock || analysis.hasLowDemand) {
            circle.style('filter', 'drop-shadow(0 0 15px rgba(79, 172, 254, 0.8))');
        } else {
            circle.style('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.1))');
        }

        // Animate circle appearance
        circle.transition()
            .duration(800)
            .delay(storeIndex * 100)
            .attr('r', 30);

        // Add store ID text
        const text = svg.append('text')
            .attr('x', 40)
            .attr('y', 35)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', 'white')
            .attr('font-weight', 'bold')
            .attr('font-size', '12px')
            .style('opacity', 0)
            .text(storeId);

        // Add stock info
        svg.append('text')
            .attr('x', 40)
            .attr('y', 50)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '8px')
            .style('opacity', 0)
            .text(`Stock: ${analysis.currentStock}`)
            .transition()
            .delay(storeIndex * 100 + 600)
            .duration(400)
            .style('opacity', 0.8);

        text.transition()
            .duration(400)
            .delay(storeIndex * 100 + 400)
            .style('opacity', 1);
    });

    // Initialize particle flow system
    setTimeout(() => {
        createParticleFlows();
    }, 1500);

    // Create item-specific sales chart with forecasting if data exists
    if (item.sales > 0 && currentStore) {
        setTimeout(() => {
            const chartContainer = panel.querySelector('.item-sales-chart');
            const storeData = csvData.filter(row => row.store_id === currentStore.id);
            console.log(`Item ${item.id} data from store ${currentStore.id}:`, storeData);
            if (chartContainer && storeData.length > 0) {
                createSalesChart(chartContainer, storeData, item);
            } else {
                console.warn(`No chart data found for item ${item.id} in store ${currentStore.id}`);
            }
        }, 100);
    }

    // Animate open
    const wrapper = panel.querySelector(".item-panel");
    requestAnimationFrame(() => {
        if (wrapper) {
            wrapper.style.maxHeight = wrapper.scrollHeight + "px";
            wrapper.style.opacity = "1";
        }
    });

    return panel;
}

function collapsePanel(panel) {
    if (!panel) return;
    const wrapper = panel.querySelector(".item-panel");
    if (!wrapper) {
        panel.remove();
        return;
    }
    // Animate close then remove
    wrapper.style.maxHeight = "0px";
    wrapper.style.opacity = "0";
    wrapper.addEventListener("transitionend", () => panel.remove(), { once: true });
}

function getItemByIds(storeId, itemId) {
    const store = stores.find(s => s.id === storeId);
    if (!store) return null;
    return (store.items || []).find(it => String(it.id) === String(itemId)) || null;
}

function onStoreItemClick(e) {
    const li = e.target.closest("li.store-item");
    if (!li || !grid.contains(li)) return;

    const storeEl = li.closest("details.card");
    if (!storeEl) return;

    const storeId = storeEl.getAttribute("data-id");
    const itemId = li.getAttribute("data-item-id");
    const ul = li.parentElement;

    // If a panel is already open right under this item, toggle (close it)
    const next = li.nextElementSibling;
    if (next && next.classList && next.classList.contains("store-item-panel")) {
        collapsePanel(next);
        return;
    }

    // Close any other open panels within the same store
    ul.querySelectorAll("li.store-item-panel").forEach(p => collapsePanel(p));

    // Create and open a new panel for this item
    const item = getItemByIds(storeId, itemId);
    if (!item) return;

    const panel = createItemPanel(item);
    li.insertAdjacentElement("afterend", panel);
}

function render(list) {
    grid.innerHTML = "";
    if (!list.length) {
        grid.innerHTML = `<p style="grid-column: 1 / -1; color: var(--muted);">No stores found.</p>`;
        return;
    }
    const frag = document.createDocumentFragment();
    list.forEach(s => frag.appendChild(createCard(s)));
    grid.appendChild(frag);
}

function onSearch() {
    const q = (searchInput.value || "").toLowerCase().trim();
    const filtered = stores.filter(s => s.name.toLowerCase().includes(q));
    render(filtered);
}

function onNavToggle() {
    const open = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
}

async function init() {
    yearEl.textContent = new Date().getFullYear();

    // Load CSV data from file
    const csvFileData = await loadCSVFile();
    if (csvFileData.length > 0) {
        processCSVData(csvFileData);
    } else {
        console.warn('No CSV data loaded, using default store data');
    }

    render(stores);
    searchInput.addEventListener("input", onSearch);
    navToggle.addEventListener("click", onNavToggle);
    // Open/close an item panel under the clicked item
    grid.addEventListener("click", onStoreItemClick);
    navMenu.addEventListener("click", (e) => {
        if (e.target.tagName === "A" && navMenu.classList.contains("open")) {
            onNavToggle();
        }
    });
}

document.addEventListener("DOMContentLoaded", init);
