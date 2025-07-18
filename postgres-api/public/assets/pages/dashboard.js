"use strict";

$(document).ready(function() {
    dashboard();

    /*Counter Js Starts*/
    $(".counter").counterUp({
        delay: 10,
        time: 400,
    });
    /*Counter Js Ends*/

    // Resource bar
    $(".resource-barchart").sparkline(
        [5, 6, 2, 4, 9, 1, 2, 8, 3, 6, 4, 2, 1, 5], {
            type: "bar",
            barWidth: "15px",
            height: "80px",
            barColor: "#fff",
            tooltipClassname: "abc",
        }
    );

    function setHeight() {
        var $window = $(window);
        var windowHeight = $(window).height();
        if ($window.width() >= 380) {
            $(".user-list").parent().parent().css("min-height", windowHeight);
            $(".chat-window-inner-content").css("max-height", windowHeight);
            $(".user-list").parent().parent().css("right", -300);
        }
    }
    setHeight();

    $(window).on("load", function() {
        setHeight();
    });

    $(window).resize(function() {
        dashboard();
        // Resource bar
        $(".resource-barchart").sparkline(
            [5, 6, 2, 4, 9, 1, 2, 8, 3, 6, 4, 2, 1, 5], {
                type: "bar",
                barWidth: "15px",
                height: "80px",
                barColor: "#fff",
                tooltipClassname: "abc",
            }
        );
    });
});

async function dashboard() {
    const orderCategories = [
        "Amazon",
        "Demo",
        "Export",
        "Flipkart",
        "Maruti",
        "New R&D",
        "OEM",
        "Regular",
        "Related Party",
        "Repeat",
        "Replacement",
        "Satara",
        "Stock",
        "Trading"
    ];

    const rowsCountMap = await fetchRowsCountForEachCategory(orderCategories);
    updateHighcharts(rowsCountMap, orderCategories);
}

async function fetchRowsCountForEachCategory() {
    const rowsCountMap = {};

    try {
        const response = await fetch(
            "http://192.168.131.92:3002/api/total_balance_amount"
        );
        const data = await response.json();

        if (response.ok) {
            data.rows.forEach((row) => {
                // Group all "Maruti-*" categories under "Maruti"
                const category = row.order_category.startsWith("Maruti") ? "Maruti" : row.order_category;

                // Sum up the total_balance_amount for each grouped category
                if (!rowsCountMap[category]) {
                    rowsCountMap[category] = 0;
                }
                rowsCountMap[category] += parseFloat(row.total_balance_amount) || 0;
            });
        } else {
            console.error("Error fetching order categories data:", data.error);
        }
    } catch (error) {
        console.error("Error fetching order categories data:", error.message);
    }

    return rowsCountMap;
}

function updateHighcharts(rowsCountMap, orderCategories) {
    const seriesData = orderCategories.map((category) => {
        return {
            name: category,
            data: [rowsCountMap[category] || 0], // Set count for the category, default to 0 if not found
            type: "column",
            color: category === "OEM" ? "#FF0000" : null, // Color for OEM category
        };
    });

    Highcharts.chart("barchart", {
        title: {
            text: "Order Amount Per Category",
        },
        xAxis: {
            categories: orderCategories,
            title: {
                text: "Order Categories",
            },
        },
        yAxis: {
            min: 0,
            title: {
                text: "Total Balance Amount",
            },
        },
        series: seriesData,
        plotOptions: {
            column: {
                pointPadding: 0.1,
                groupPadding: 0.1,
            },
        },
    });
}

// Call the dashboard function to initialize
dashboard();