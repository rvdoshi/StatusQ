//LIVE FILE 

async function fetchTotalBalanceAmountOfPendingOrders() {
    try {
        const response = await fetch("http://103.113.142.236:3002/api/team_data");
        const data = await response.json();
        let sum = 0;

        if (response.ok) {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth(); // 0-based (Jan = 0, Dec = 11)
            const currentYear = currentDate.getFullYear();

            const pastDueOrderCount = data.rows.reduce((count, row) => {
                const deliveryDate = new Date(row.delivery_date);

                // Exclude rows where accounts_invoicing or complete is not null
                if ((row.complete === false || row.complete === null)) {
                    // Exclude rows with delivery dates in the current month and year
                    const isNotCurrentMonth =
                        deliveryDate.getMonth() !== currentMonth || deliveryDate.getFullYear() !== currentYear;

                    // Count as past due if delivery date is before the current date and not in the current month
                    if (deliveryDate < currentDate && isNotCurrentMonth) {
                        const totalBalanceAmount = parseFloat(row.balance_amount) || 0;
                        sum = totalBalanceAmount + sum;

                        return count + 1;
                    }
                }
                return count;
            }, 0);

            // console.log("Past Due Order Count:", pastDueOrderCount);
            return sum;
        } else {
            console.error("Error fetching team data:", data.error);
            return null;
        }
    } catch (error) {
        console.error("Error:", error.message);
        return null;
    }
}

// Example usage:
async function processTotalBalanceAmountOfPendingOrders() {
    const totalBalanceAmountOfPendingOrders = await fetchTotalBalanceAmountOfPendingOrders();

    if (totalBalanceAmountOfPendingOrders !== null) {
        // Format totalBalanceAmountOfPendingOrders as currency (INR)
        const formattedTotalBalance = totalBalanceAmountOfPendingOrders.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        });

        // Update the HTML element with the formatted total balance amount
        document.getElementById("totalbalancePendingOrders").innerHTML = formattedTotalBalance;

        // Log the formatted total balance amount
        // console.log("Total Balance Amount of Pending Orders:", formattedTotalBalance);
    } else {
        console.log("Failed to fetch total balance amount of pending orders.");
    }
}

// Call the function to fetch and process the total balance amount of pending orders
processTotalBalanceAmountOfPendingOrders();

async function fetchPastDueOrderCount() {
    try {
        const response = await fetch("http://103.113.142.236:3002/api/team_data");
        const data = await response.json();

        if (response.ok) {
            const currentDate = new Date();

            const pastDueOrderCount = data.rows.reduce((count, row) => {
                const deliveryDate = new Date(row.delivery_date);

                // Only consider rows where 'accounts_invoicing' is null AND 'complete' is false or null
                if (

                    (row.complete === false || row.complete === null)
                ) {
                    // Count as past due if delivery date is before the current date
                    if (deliveryDate < currentDate) {
                        return count + 1;
                    }
                }
                return count;
            }, 0);

            return pastDueOrderCount;
        } else {
            console.error("Error fetching team data:", data.error);
            return null;
        }
    } catch (error) {
        console.error("Error:", error.message);
        return null;
    }
}

// Example usage:
async function processPastDueOrderCount() {
    const pastDueOrderCount = await fetchPastDueOrderCount();

    if (pastDueOrderCount !== null) {
        document.getElementById("countValuerow").innerHTML = pastDueOrderCount;

        // console.log("Past Due Order Count:", pastDueOrderCount);
    } else {
        console.log("Failed to fetch past due order count.");
    }
}

// Call the function to fetch and process the past due order count
processPastDueOrderCount();
processTotalOEMOrdersCount();

async function fetchTotalBalanceAmount() {
    try {
        console.log("Fetching team data...");
        const response = await fetch("http://103.113.142.236:3002/api/team_data");
        const data = await response.json();

        if (response.ok) {
            // console.log("Data fetched successfully:", data);

            // Step 1: Filter rows where 'complete' is false or null
            const incompleteRows = data.rows.filter(row => row.complete !== true);
            // console.log("Rows where 'complete' is false or null:", incompleteRows);

            // Step 3: Calculate the total balance amount
            const totalBalanceAmount = incompleteRows.reduce((total, row) => {
                const balanceAmount = parseFloat(row.balance_amount) || 0;
                return total + balanceAmount;
            }, 0);

            // console.log("Total balance amount (filtered rows):", totalBalanceAmount);

            return totalBalanceAmount;
        } else {
            console.error("Error fetching team data:", data.error);
            return null;
        }
    } catch (error) {
        console.error("Error fetching team data:", error.message);
        return null;
    }
}

// Example usage:
async function processTotalBalanceAmount() {
    const totalBalanceAmount = await fetchTotalBalanceAmount();

    if (totalBalanceAmount !== null) {
        // Format totalBalanceAmount as currency (INR)
        const formattedTotalBalance = totalBalanceAmount.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        });

        // Update the HTML element with the formatted total balance amount
        document.getElementById("totalbalance").innerHTML = formattedTotalBalance;

        // Log the formatted total balance amount
        // console.log("Total Balance Amount (filtered):", formattedTotalBalance);
    } else {
        console.log("Failed to fetch total balance amount.");
    }
}

// Call the function to fetch and process the total balance amount
processTotalBalanceAmount();


var $window = $(window);
var nav = $(".fixed-button");
$window.scroll(function() {
    if ($window.scrollTop() >= 200) {
        nav.addClass("active");
    } else {
        nav.removeClass("active");
    }
});

async function fetchTotalOEMOrdersCount() {
    try {
        const response = await fetch(
            "http://103.113.142.236:3002/api/filter/team_data"
        );
        const data = await response.json();

        if (response.ok) {
            // Filter rows where 'accounts_invoicing' or 'complete' is not null
            const filteredOEMOrders = data.rows.filter(
                (row) => (row.complete === null || row.complete === false)
            );

            // Get the count of filtered 'OEM' orders
            const oemOrdersCount = filteredOEMOrders.length;

            return oemOrdersCount;
        } else {
            console.error("Error fetching OEM orders data:", data.error);
            return null;
        }
    } catch (error) {
        console.error("Error fetching OEM orders data:", error.message);
        return null;
    }
}

// Example usage:
async function processTotalOEMOrdersCount() {
    const totalOEMOrdersCount = await fetchTotalOEMOrdersCount();

    if (totalOEMOrdersCount !== null) {
        // Update the HTML element with the total count of OEM orders
        document.getElementById("openOrderValue").innerHTML = totalOEMOrdersCount;

        // Log the total count of OEM orders
        // console.log("Total OEM Orders Count:", totalOEMOrdersCount);
    } else {
        console.log("Failed to fetch total OEM orders count.");
    }
}

async function fetchDataAndFilter() {
    try {
        // Get the selected date range
        const fromDate = document.getElementById("from-date").value;
        const toDate = document.getElementById("to-date").value;

        // If only one date is missing, allow fetching without showing the alert
        if (!fromDate || !toDate) {
            return; // Do not proceed with filtering if either date is missing
        }

        const response = await fetch("http://103.113.142.236:3002/api/team_data");
        const data = await response.json();

        if (response.ok) {
            // console.log("Response is OK!")
            // Convert the date strings into Date objects
            const fromDateObj = new Date(fromDate);
            const toDateObj = new Date(toDate);

            // Filter the data based on the date range
            const filteredData = data.rows.filter(row => {
                const deliveryDate = new Date(row.delivery_date);
                return deliveryDate >= fromDateObj && deliveryDate <= toDateObj;
            });
            // console.log("Filtered Data ", filteredData);
            const filteredData2 = data.rows.filter(row => {
                const oaDate = new Date(row.oa_date);
                return oaDate >= fromDateObj && oaDate <= toDateObj;
            });

            // Update the dashboard values based on the filtered data
            updateDashboard(filteredData, filteredData2);
        } else {
            console.error("Error fetching team data:", data.error);
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

function updateDashboard(filteredData, filteredData2) {
    // Calculate the values for the dashboard based on filtered data
    const lateOrdersCount = filteredData.filter(row => row.complete !== true).length;
    const lateOrdersBalance = filteredData.reduce((sum, row) => {
        if (row.complete !== true) {
            return sum + parseFloat(row.balance_amount) || 0;
        }
        return sum;
    }, 0);

    // Update the HTML with the calculated values
    // document.getElementById("pastDueOrderCount").innerText = lateOrdersCount;
    // document.getElementById("totalbalancePendingOrders").innerText = lateOrdersBalance.toLocaleString("en-IN", {
    //     style: "currency",
    //     currency: "INR",
    //     minimumFractionDigits: 2,
    // });

    const pendingOrderCount = filteredData2.filter(row => row.complete !== true).length;
    const pendingOrderBalance = filteredData2.reduce((sum, row) => {
        if (row.complete !== true) {
            return sum + parseFloat(row.balance_amount) || 0;
        }
        return sum;
    }, 0);
    document.getElementById("openOrderValue").innerText = pendingOrderCount;
    document.getElementById("totalbalance").innerText = pendingOrderBalance.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
    });
}

// Event listener for when the user changes the dates
document.getElementById("from-date").addEventListener("change", fetchDataAndFilter);
document.getElementById("to-date").addEventListener("change", fetchDataAndFilter);

// Call fetchDataAndFilter once when the page loads to populate initial values (optional)
fetchDataAndFilter();

async function renderPieChart() {
    try {
        // Fetch data from the endpoint
        const response = await fetch("/api/total_balance_amount");
        const data = await response.json();

        if (response.ok) {
            // Initialize a map for grouped data
            const groupedData = {};

            data.rows.forEach(row => {
                const categoryName = row.order_category;

                // Check if the category starts with "Maruti"
                if (categoryName.startsWith("Maruti")) {
                    // Group all "Maruti" orders together
                    if (!groupedData["Maruti"]) {
                        groupedData["Maruti"] = 0;
                    }
                    groupedData["Maruti"] += parseInt(row.total_rows, 10);
                } else {
                    // Add other categories as-is
                    groupedData[categoryName] = parseInt(row.total_rows, 10);
                }
            });

            // Prepare the data for the pie chart
            const chartData = Object.entries(groupedData).map(([name, y]) => ({
                name,
                y
            }));

            // Initialize Pie Chart with dynamic data
            Highcharts.chart('piechart', {
                chart: {
                    type: 'pie' // Set the chart type to pie chart
                },
                title: {
                    text: 'Order Percentage Per Category' // Set the chart title
                },
                tooltip: {
                    pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>' // Tooltip to show percentage on hover
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true, // Enable selection of pie slices
                        cursor: 'pointer', // Change cursor to pointer on hover
                        dataLabels: {
                            enabled: true, // Enable data labels on the chart
                            format: '<b>{point.name}</b>: {point.percentage:.1f}%' // Format for data labels
                        }
                    }
                },
                series: [{
                    name: 'Share',
                    colorByPoint: true, // Randomly color each slice
                    data: chartData // Dynamic data from the API
                }]
            });
        } else {
            console.error("Failed to fetch data:", data.error);
        }
    } catch (error) {
        console.error("Error rendering pie chart:", error.message);
    }
}

// Call the function to render the pie chart
renderPieChart();