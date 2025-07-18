// Importing pastDueRowCount
let pastDueRowCount = 0;

async function fetchAndPopulateTable(selectedCategory) {
    if (selectedCategory == "New R&D") {
        selectedCategory = "New";
    }

    try {
        const apiUrl = selectedCategory
            ? `http://103.113.142.236:3002/api/filter/team_data?category=${selectedCategory}`
            : 'http://103.113.142.236:3002/api/team_data';
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (response.ok) {
            const currentDate = new Date();
            const currentDay = currentDate.getDay(); // 0 (Sunday) to 6 (Saturday)
            const startOfWeek = new Date(currentDate);
            const endOfWeek = new Date(currentDate);

            startOfWeek.setDate(currentDate.getDate() - currentDay + 1); // Start from Monday
            startOfWeek.setHours(0, 0, 0, 0); // Set time to start of the day
            endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Sunday
            endOfWeek.setHours(23, 59, 59, 999); // Set time to end of the day

            const filteredRows = data.rows.filter(row => {
                const deliveryDate = new Date(row.delivery_date);
                return (
                    deliveryDate >= startOfWeek &&
                    deliveryDate <= endOfWeek &&
                    row.order_category !== "OEM"
                );
            });

            let pastDueRowCount = 0;
            const tableBody = document.getElementById('tableBody');
            tableBody.innerHTML = ''; // Clear existing rows

            filteredRows.forEach((row, index) => {
                const tableRow = document.createElement('tr');
                const deliveryDate = new Date(row.delivery_date);
                let rowColorClass = '';
                let status = '';

                if (row.complete === true) {
                    status = 'Complete';
                } else if (deliveryDate < currentDate) {
                    status = 'Delay';
                    rowColorClass = 'past-due-row';
                    pastDueRowCount++;
                } else {
                    status = 'Open';
                }

                // Highlight text of the whole row in red if status is 'Delay'
                if (status === 'Delay') {
                    tableRow.style.color = 'red';
                }

                tableRow.innerHTML = `
                    <td>${row.oa_number}</td>
                    <td>${formatDate(row.oa_date)}</td>
                    <td>${row.customer_name || ''}</td>
                    <td>${row.item_code}</td>
                    <td>${row.bal_qty || ''}</td>
                    <td>${formatDate(row.delivery_date)}</td>
                    <td>${status}</td>
                `;
                tableBody.appendChild(tableRow);
            });

            // Update the count in the HTML element with the ID 'countValue'
            document.getElementById('countValue').innerHTML = pastDueRowCount;

        } else {
            console.error('Error fetching data:', data.error);
        }
    } catch (error) {
        console.error('Error fetching team data:', error.message);
    }
}



// Call fetchAndPopulateTable on window load
window.addEventListener('load', () => {
    fetchAndPopulateTable();
});

// Helper functions for date formatting
let year, month, day;

function formatDate(dateString) {
    if (!dateString) return ''; // Return empty string for null or undefined dates
    const date = new Date(dateString);
    day = date.getDate().toString().padStart(2, '0');
    month = (date.getMonth() + 1).toString().padStart(2, '0');
    year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

let yeardb, monthdb, daydb;

function formatDatedb(dateString) {
    if (!dateString) return ''; // Return empty string for null or undefined dates
    const date = new Date(dateString);
    daydb = date.getDate().toString().padStart(2, '0');
    monthdb = (date.getMonth() + 1).toString().padStart(2, '0');
    yeardb = date.getFullYear();
    return `${day}-${month}-${year}`;
}
