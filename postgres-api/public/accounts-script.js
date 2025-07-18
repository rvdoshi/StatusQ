// Importing pastDueRowCount
let pastDueRowCount = 0;

async function fetchAndPopulateTable(selectedCategory) {
    if (selectedCategory == "New R&D") {
        selectedCategory = "New";
    }
    // console.log( selectedCategory);
    try {
        const apiUrl = selectedCategory ? `http://103.113.142.236:3002/api/filter/accounts_data?category=${selectedCategory}` : 'http://103.113.142.236:3002/api/filter/accounts_data';
        //   console.log(apiUrl);
        const response = await fetch(apiUrl);
        //   console.log(response);
        const data = await response.json();
        console.log(data);

        if (response.ok) {
            const tableBody = document.getElementById('tableBody');
            tableBody.innerHTML = ''; // Clearing the table body

            // Sort data.rows by delivery_date in ascending order
            data.rows.sort((a, b) => new Date(b.delivery_date) - new Date(a.delivery_date));

            pastDueRowCount = 0;
            data.rows.forEach((row, index) => {
                const tableRow = document.createElement('tr');

                // Check if the delivery_date has passed and apply the appropriate class
                const currentDate = new Date();
                formatDate(currentDate);
                formatDatedb(row.delivery_date);
                let rowColorClass;
                if (year > yeardb) {
                    rowColorClass = 'past-due-row';
                } else if (year === yeardb) {
                    if (month > monthdb) {
                        rowColorClass = 'past-due-row';
                    } else if (month === monthdb) {
                        if (day > daydb) {
                            rowColorClass = 'past-due-row';
                        }
                    }
                }

                if (rowColorClass === 'past-due-row') {
                    pastDueRowCount++;
                }

                tableRow.className = rowColorClass || ''; // If no past-due condition, set class to empty string
                tableRow.innerHTML = `
                <td>${row.order_category}</td>
                <td>${row.oa_number}</td>
                <td>${formatDate(row.oa_date)}</td>
                <td>${row.customer_name || ''}</td>
                <td>${row.item_code}</td>
                <td>${row.order_qty || ''}</td>
                <td>${row.dc_qty || ''}</td>
                <td>${row.bal_qty || ''}</td>
                <td>${row.balance_amount}</td>
                <td>${formatDate(row.delivery_date)}</td>
                <td>${formatDate(row.gst_number || '')}</td>
                <td>${formatDate(row.statutory_details||'')}</td>
                <td>${formatDate(row.terms_of_payment || '')}</td>
                <td>${formatDate(row.advanced_received || '')}</td>
                <td>${formatDate(row.invoicing|| '')}</td>
                <td>${(row.notes || '')}</td>
        `;
                tableBody.appendChild(tableRow);
            });

            // Update the count in the HTML element with the ID 'countValue'
            document.getElementById('countValue').innerHTML = pastDueRowCount;

        } else {
            console.error('Error fetching  data:', data.error);
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

// Add this code to your JavaScript file or script section

window.addEventListener('load', () => {
    // Fetch the select input element
    const orderCategoryFilter = document.getElementById('orderCategoryFilter');
    // console.log(orderCategoryFilter);

    // Add event listener for change event
    orderCategoryFilter.addEventListener('change', () => {
        // Retrieve the selected value
        const selectedValue = orderCategoryFilter.value;

        // Log the selected value to the console
        //  console.log('Selected value:', selectedValue);
        fetchAndPopulateTable(selectedValue);
    });
});