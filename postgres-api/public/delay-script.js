// Importing pastDueRowCount
let pastDueRowCount = 0;

async function fetchAndPopulateTable(selectedCategory) {
    if (selectedCategory == "New R&D") {
        selectedCategory = "New";
    }

    try {
        console.log("SELECTED CATEGORY " + selectedCategory);
        const apiUrl = selectedCategory
            ? `http://103.113.142.236:3002/api/filter/team_data?category=${selectedCategory}`
            : `http://103.113.142.236:3002/api/team_data`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (response.ok) {
            const tableBody = document.getElementById("tableBody");
            tableBody.innerHTML = ""; // Clearing the table body

            // Sort data.rows by oa_date in ascending order
            data.rows.sort((b, a) => new Date(a.oa_date) - new Date(b.oa_date));

            let pastDueRowCount = 0;
            const currentDate = new Date();

            data.rows.forEach((row) => {
                // Skip rows where row.complete or row.accounts_invoicing is not null
                if (row.complete || row.accounts_invoicing !== null) {
                    return;
                }

                // Parse delivery_date and check if it has passed
                const deliveryDate = new Date(row.delivery_date);
                if (deliveryDate <= currentDate) {
                    pastDueRowCount++;

                    // Calculate days difference
                    const daysDifference = calculateDaysDifference(row.delivery_date);

                    const tableRow = document.createElement("tr");
                    tableRow.className = "past-due-row"; // Add a specific class for past-due rows
                    tableRow.innerHTML = `
                        <td>${row.oa_number}</td>
                        <td>${formatDate(row.oa_date)}</td>
                        <td>${row.customer_name || ""}</td>
                        <td>${row.item_code}</td>
                        <td>${row.order_qty || ""}</td>
                        <td>${row.dc_qty || "0"}</td>
                        <td>${row.bal_qty || ""}</td>
                        <td>${row.balance_amount}</td>
                        <td>${formatDate(row.delivery_date)}</td>
                        <td>${daysDifference} days</td>
                       <td>
                            ${
                                row.stage === 1 ? "Sales" :
                                row.stage === 2 ? "Purchase" :
                                row.stage === 3 ? "Stores" :
                                row.stage === 4 ? "R&D" :
                                row.stage === 5 ? "Production" :
                                row.stage === 6 ? "QC" : 
                                row.stage === 7 ? "Accounts" : row.stage
                            }
                        </td>
                        <td>${row.notes || ""}</td> 

                    `;
                    tableBody.appendChild(tableRow);
                }
            });

            // Update the count in the HTML element with the ID 'countValue'
            document.getElementById("countValue").innerHTML = pastDueRowCount;
        } else {
            console.error("Error fetching data:", data.error);
        }
    } catch (error) {
        console.error("Error fetching team data:", error.message);
    }
}


// Call fetchAndPopulateTable on window load
window.addEventListener("load", () => {
    fetchAndPopulateTable();
});

// Helper functions for date formatting
let year, month, day;

function formatDate(dateString) {
    if (!dateString) return ""; // Return empty string for null or undefined dates
    const date = new Date(dateString);
    day = date.getDate().toString().padStart(2, "0");
    month = (date.getMonth() + 1).toString().padStart(2, "0");
    year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

let yeardb, monthdb, daydb;

function formatDatedb(dateString) {
    if (!dateString) return ""; // Return empty string for null or undefined dates
    const date = new Date(dateString);
    daydb = date.getDate().toString().padStart(2, "0");
    monthdb = (date.getMonth() + 1).toString().padStart(2, "0");
    yeardb = date.getFullYear();
    return `${day}-${month}-${year}`;
}
function calculateDaysDifference(deliveryDate) {
    if (!deliveryDate) return ""; // Return an empty string for null or undefined dates
    const currentDate = new Date();
    const delivery = new Date(deliveryDate);
    const timeDifference = currentDate - delivery; // Difference in milliseconds
    const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
    return daysDifference;
}
// Add this code to your JavaScript file or script section
window.addEventListener("load", () => {
    // Fetch the select input element
    const orderCategoryFilter = document.getElementById("orderCategoryFilter");

    // Add event listener for change event
    orderCategoryFilter.addEventListener("change", () => {
        // Retrieve the selected value
        const selectedValue = orderCategoryFilter.value;

        // Fetch and populate table with the selected category
        fetchAndPopulateTable(selectedValue);
    });
});