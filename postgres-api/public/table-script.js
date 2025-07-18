// Importing pastDueRowCount
let pastDueRowCount = 0;

async function fetchAndPopulateTable(selectedCategory) {
    if (selectedCategory == "New R&D") {
        selectedCategory = "New";
    }

    try {
        // console.log("SELECTED CATEGORY " + selectedCategory)
        // const apiUrl = selectedCategory ?
        //     `http://103.113.142.236:3002/api/filter/team_data?category=${selectedCategory}` :
        //     `http://103.113.142.236:3002/api/team_data`;
        const apiUrl = `http://103.113.142.236:3002/api/team_data`;
        const response = await fetch(apiUrl);
        // console.log("API " + apiUrl)
        const data = await response.json();

        if (response.ok) {
            const tableBody = document.getElementById("tableBody");
            tableBody.innerHTML = ""; // Clearing the table body

            // Sort data.rows by oa_date in ascending order
            data.rows.sort((a, b) => new Date(a.oa_date) - new Date(b.oa_date));

            pastDueRowCount = 0;
            data.rows.forEach((row, index) => {
                // Skip rows where row.complete or row.accounts_invoicing is not null
                if (row.complete || row.accounts_invoicing !== null) {
                    return;
                }

                // Replace "sales_late_clause" value if it's the default value
                if (row.sales_late_clause === "1969-12-31T18:30:00.000Z") {
                    row.sales_late_clause = row.delivery_date;
                }
                const tableRow = document.createElement("tr");

                // Check if the delivery_date has passed and apply the appropriate class
                const currentDate = new Date();
                formatDate(currentDate);
                formatDatedb(row.delivery_date);
                let rowColorClass;
                if (year > yeardb) {
                    rowColorClass = "past-due-row";
                } else if (year === yeardb) {
                    if (month > monthdb) {
                        rowColorClass = "past-due-row";
                    } else if (month === monthdb) {
                        if (day > daydb) {
                            rowColorClass = "past-due-row";
                        }
                    }
                }

                if (rowColorClass === "past-due-row") {
                    pastDueRowCount++;
                }

                tableRow.className = rowColorClass || "";
                tableRow.innerHTML = `
                    <td>${row.oa_number}</td>
                    <td>${formatDate(row.oa_date)}</td>
                    <td>${row.customer_name || ""}</td>
                    <td>${row.item_code}</td>
                    <td>${row.order_qty || ""}</td>
                    <td>${row.dc_qty || ""}</td>
                    <td>${row.bal_qty || ""}</td>
                    <td>${row.balance_amount}</td>
                    <td>${formatDate(row.delivery_date)}</td>
                    <td>${formatDate(row.sales_late_clause)}</td>
                    <td>${formatDate(row.sales_mail)}</td>
                    <td>${row.purchase_shortage || ""}</td>
                    <td>${row.purchase_price_hike || ""}</td>
                    <td>${formatDate(row.purchase_material_receipt_eta)}</td>
                    <td>${formatDate(row.rnd_specification_check)}</td>
                    <td>${formatDate(row.rnd_finished)}</td>
                    <td>${formatDate(row.prod_assembly)}</td>
                    <td>${formatDate(row.prod_f_testing)}</td>
                    <td>${formatDate(row.prod_qc)}</td>
                    <td>${formatDate(row.qc_oqc)}</td>
                    <td>${formatDate(row.stores_packing)}</td>
                    <td>${formatDate(row.stores_delivery)}</td>
                    <td>${formatDate(row.accounts_advance_received)}</td>
                    <td>${formatDate(row.accounts_invoicing)}</td>
                    <td>${row.notes || ""}</td>
                `;
                tableBody.appendChild(tableRow);
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