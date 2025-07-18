$(document).ready(function() {

    var currentDate = new Date();

    // Format the current year and month (e.g., "2024-11" for November 2024)
    var currentYearMonth = currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1).toString().padStart(2, '0');

    // Initialize Flatpickr for month and year selection
    $("#month-year-picker").flatpickr({
        plugins: [
            new monthSelectPlugin({
                shorthand: true,
                dateFormat: "Y-m",
                altFormat: "F Y",
                theme: "light",
            }),
        ],
        defaultDate: currentYearMonth, // Set default date to current month and year
    });

    $("#month-year-picker-F").flatpickr({
        plugins: [
            new monthSelectPlugin({
                shorthand: true,
                dateFormat: "Y-m",
                altFormat: "F Y",
                theme: "light",
            }),
        ],
        defaultDate: currentYearMonth, // Set default date to current month and year
    });

    loadOrders();
    loadOrders2();

    // Function to load orders based on selected month, year, and category
    function loadOrders() {
        const startMonthYear = $('#month-year-picker-F').val();
        const endMonthYear = $('#month-year-picker').val();

        const [startYear, startMonth] = startMonthYear ? startMonthYear.split('-') : [null, null];
        const [endYear, endMonth] = endMonthYear ? endMonthYear.split('-') : [null, null];
        const category = $('#order-category').val();

        if (startMonth && startYear && endMonth && endYear) {
            $.ajax({
                url: '/api/rnd',
                method: 'GET',
                data: {
                    startMonth: startMonth,
                    startYear: startYear,
                    endMonth: endMonth,
                    endYear: endYear,
                    category: category
                },
                success: function(response) {
                    const orders = response.rows;
                    const $selectOrder = $('#select-order');
                    $selectOrder.empty();
                    $selectOrder.append(
                        `<option value="">Select Order</option>`
                    );
                    orders.sort((a, b) => {
                        const oaCompare = a.oa_number.localeCompare(b.oa_number);
                        return oaCompare !== 0 ? oaCompare : a.item_code.localeCompare(b.item_code);
                    });
                    orders.forEach((order) => {
                        if (
                            order.order_category === "New R&D" && order.status !== 1 && order.complete !== true &&
                            (
                                order.specification_check === null ||
                                order.bom === null ||
                                order.rnd_complete === null ||
                                order.user_manual === null ||
                                order.storing_final_documents_in_folder === null ||
                                order.circuit_diagrams === null ||
                                order.testing_manual === null
                            )
                        ) {
                            $selectOrder.append(
                                `<option value="${order.oa_number},${order.item_code}, ${order.customer_name}">${order.oa_number} - ${order.item_code} - ${order.customer_name}</option>`
                            );
                        }
                    });
                },
                error: function(error) {
                    console.error('Error fetching orders:', error);
                }
            });
        }
    }

    function loadOrders2() {
        const startMonthYear = $("#month-year-picker-F").val();
        const endMonthYear = $("#month-year-picker").val();

        const [startYear, startMonth] = startMonthYear ? startMonthYear.split("-") : [null, null];
        const [endYear, endMonth] = endMonthYear ? endMonthYear.split("-") : [null, null];
        const category = $("#order-category").val();

        if (startMonth && startYear && endMonth && endYear) {
            $.ajax({
                url: "/api/rnd",
                method: "GET",
                data: {
                    startMonth: startMonth,
                    startYear: startYear,
                    endMonth: endMonth,
                    endYear: endYear,
                    category: category,
                },
                success: function(response) {
                    const orders = response.rows;
                    const $selectOrder = $("#select-order-2");
                    $selectOrder.empty();
                    $selectOrder.append(`<option value="">Select Order</option>`);

                    orders.sort((a, b) => {
                        const oaCompare = a.oa_number.localeCompare(b.oa_number);
                        return oaCompare !== 0 ? oaCompare : a.item_code.localeCompare(b.item_code);
                    });

                    orders.forEach((order) => {
                        if (
                            order.order_category === "New R&D" && (order.status === 0 || order.status === null) &&
                            order.specification_check !== null &&
                            order.bom !== null &&
                            order.rnd_complete !== null &&
                            order.user_manual !== null &&
                            order.storing_final_documents_in_folder !== null &&
                            order.circuit_diagrams !== null &&
                            order.testing_manual !== null
                        ) {
                            $selectOrder.append(
                                `<option value="${order.oa_number},${order.item_code}">${order.oa_number} - ${order.item_code} - ${order.customer_name}</option>`
                            );
                        }
                    });
                },
                error: function(error) {
                    console.error("Error fetching orders:", error);
                },
            });
        }
    }

    // Load orders on change
    $("#month-year-picker, #order-category").on("change", function() {
        loadOrders();
        loadOrders2();
    });

    // Load orders on change
    $("#month-year-picker-F, #order-category").on("change", function() {
        loadOrders();
        loadOrders2();
    });

    //username code
    $(document).ready(function() {
        $.ajax({
            url: '/api/user',
            method: 'GET',
            success: function(data) {
                // console.log('AJAX request successful:', data.name);
                $('#username-placeholder').text(data.name);
                $('#usernameID-placeholder').text(data.id);
            },
            error: function(err) {
                console.log('Error fetching user data:', err);
            }
        });
    });

    // Function to handle selection of an order
    $('#select-order').on('change', function() {
        const selectedValue = $(this).val(); // Get the selected value (oa_number,item_code)
        const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code
        console.log("Selected OA number:", oaNumber);
        console.log("Selected Item Code:", itemCode);
        var stage = "";
        // Make AJAX request to retrieve sales data
        $.ajax({
            url: `/api/check/rnd_data/${oaNumber}/${itemCode}`,
            method: 'GET',
            success: function(response) {
                console.log('rnd data retrieved successfully:', response);
                // Update checkboxes and auto-fill fields based on response
                const data = response.rows[0];
                const data2 = response;
                // itemCode = data.item_code;
                // console.log('Sales data retrieved successfully:', data.late_clause);
                // Auto-check checkboxes based on database values
                $('#specification_check').prop('checked', data.specification_check);
                $('#bom').prop('checked', data.bom);
                $('#rnd_complete').prop('checked', data.rnd_complete);
                $('#user_manual').prop('checked', data.user_manual);
                $('#storing_final_documents_in_folder').prop('checked', data.storing_final_documents_in_folder);
                $('#circuit_diagrams').prop('checked', data.circuit_diagrams);
                $('#testing_manual').prop('checked', data.testing_manual);
                // Auto-fill late_clause and notes
                $('#notes').val(data.notes);
                stage = data2.stageDescription;
                console.log("Satge Recieved", data2.stageDescription);
                console.log("Satge Recieved 2:", stage);
                load_progress(stage);
            },
            error: function(error) {
                console.error('Error retrieving R&D data:', error);
                // Handle error response
            }
        });
        loadOrders2();
    });

    $('#select-order-2').on('change', function() {
        const selectedValue = $(this).val(); // Get the selected value (oa_number,item_code)
        const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code
        console.log("Selected OA number:", oaNumber);
        console.log("Selected Item Code:", itemCode);
        var stage = "";
        // Make AJAX request to retrieve sales data
        $.ajax({
            url: `/api/check/rnd_data/${oaNumber}/${itemCode}`,
            method: 'GET',
            success: function(response) {
                console.log('rnd data retrieved successfully:', response);
                // Update checkboxes and auto-fill fields based on response
                const data = response.rows[0];
                const data2 = response;
                // itemCode = data.item_code;
                // console.log('Sales data retrieved successfully:', data.late_clause);
                // Auto-check checkboxes based on database values
                $('#specification_check').prop('checked', data.specification_check);
                $('#bom').prop('checked', data.bom);
                $('#rnd_complete').prop('checked', data.rnd_complete);
                $('#user_manual').prop('checked', data.user_manual);
                $('#storing_final_documents_in_folder').prop('checked', data.storing_final_documents_in_folder);
                $('#circuit_diagrams').prop('checked', data.circuit_diagrams);
                $('#testing_manual').prop('checked', data.testing_manual);
                // Auto-fill late_clause and notes
                $('#notes').val(data.notes);
                stage = data2.stageDescription;
                console.log("Satge Recieved", data2.stageDescription);
                console.log("Satge Recieved 2:", stage);
                load_progress(stage);
            },
            error: function(error) {
                console.error('Error retrieving R&D data:', error);
                // Handle error response
            }
        });
        loadOrders();
    });

    function load_progress(department_got) {
        // Get the department name from input
        const department = department_got;
        console.log("department", department);
        // List of departments in the order
        const departments = ["sales", "purchase", "stores", "r&d", "production", "qc", "accounts", ];
        // Find the index of the provided department
        const index = departments.indexOf(department);

        // Reset all circles and progress bar
        const circles = document.querySelectorAll(".circle");
        circles.forEach((circle, i) => {
            circle.innerText = (i + 1).toString(); // Reset to show step numbers
            circle.classList.remove("completed");
        });
        document.getElementById("progressBar").style.width = '0%'; // Reset progress bar

        // Check if the department exists and update the progress bar and circles
        if (index !== -1) {
            // Update completed circles and progress bar
            for (let i = 0; i <= index; i++) {
                circles[i].innerText = '✓'; // Show tick
                circles[i].classList.add("completed"); // Mark as completed
            }
            // Set the width of the progress bar based on the index
            const progressPercentage = ((index + 1) / departments.length) * 100;
            document.getElementById("progressBar").style.width = `${progressPercentage}%`;
        } else {
            alert("Invalid department name. Please enter a valid department.");
        }
    }

    // Record checkbox dates individually
    let specification_check = null;
    let bom = null;
    let rnd_complete = null;
    let user_manual = null;
    let storing_final_documents_in_folder = null;
    let circuit_diagrams = null;
    let testing_manual = null;

    // Attach event listeners to checkboxes
    $('#user_manual').on('change', function() {
        const isChecked = $(this).prop('checked');
        if (isChecked) {
            user_manual = new Date().toISOString();
        } else {
            user_manual = null;
        }
        // console.log(`SO check with quotation date: ${specification_check}`);
    });

    $('#storing_final_documents_in_folder').on('change', function() {
        const isChecked = $(this).prop('checked');
        if (isChecked) {
            storing_final_documents_in_folder = new Date().toISOString();
        } else {
            storing_final_documents_in_folder = null;
        }
        // console.log(`SO check with quotation date: ${specification_check}`);
    });

    $('#testing_manual').on('change', function() {
        const isChecked = $(this).prop('checked');
        if (isChecked) {
            testing_manual = new Date().toISOString();
        } else {
            testing_manual = null;
        }
        // console.log(`SO check with quotation date: ${specification_check}`);
    });

    $('#specification_check').on('change', function() {
        const isChecked = $(this).prop('checked');
        if (isChecked) {
            specification_check = new Date().toISOString();
        } else {
            specification_check = null;
        }
        // console.log(`SO check with quotation date: ${specification_check}`);
    });

    $('#circuit_diagrams').on('change', function() {
        const isChecked = $(this).prop('checked');
        if (isChecked) {
            circuit_diagrams = new Date().toISOString();
        } else {
            circuit_diagrams = null;
        }
        // console.log(`SO check with quotation date: ${specification_check}`);
    });
    // $('#specification_check').on('change', function() {
    //     const isChecked = $(this).prop('checked');
    //     if (isChecked) {
    //         specification_check = new Date().toISOString();
    //     } else {
    //         specification_check = null;
    //     }
    //     // console.log(`SO check with quotation date: ${specification_check}`);
    // });

    $('#bom').on('change', function() {
        const isChecked = $(this).prop('checked');
        if (isChecked) {
            bom = new Date().toISOString();
        } else {
            bom = null;
        }
        // console.log(`Specification Check date: ${bom}`);
    });

    $('#rnd_complete').on('change', function() {
        const isChecked = $(this).prop('checked');
        if (isChecked) {
            rnd_complete = new Date().toISOString();
        } else {
            rnd_complete = null;
        }
        // console.log(`Terms of Payment date: ${rnd_complete}`);
    });

    $('#sendbtn').on('click', function() {
        console.log('Send button clicked');
        const selectedValue_1 = $("#select-order").val(); // Get the selected value (oa_number,item_code)
        const selectedValue_2 = $("#select-order-2").val(); // Get the selected value (oa_number,item_code)
        console.log("Selected value 1:", selectedValue_1);
        console.log("Selected value 2:", selectedValue_2);

        if (selectedValue_1 !== null && (selectedValue_2 == null || selectedValue_2 == "")) {
            console.log("===========Pending==========");
            const selectedValue = selectedValue_1;
            const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code

            console.log("Selected OA number:", oaNumber);
            console.log("Selected Item Code:", itemCode);

            // Construct JSON data
            const notes = $('#notes').val(); // Get value of notes textarea
            const jsonData = {
                notes: notes
            };

            const jsonDataNew = {
                notes: "RND: " + notes
            };

            // Get current date if stock_check is checked
            if ($('#user_manual').prop('checked')) {
                jsonData.user_manual = new Date().toISOString();
                jsonDataNew.user_manual = new Date().toISOString();

            } else {
                jsonData.user_manual = null; // If unchecked, set to null
                jsonDataNew.user_manual = null;
            }

            if ($('#storing_final_documents_in_folder').prop('checked')) {
                jsonData.storing_final_documents_in_folder = new Date().toISOString();
                jsonDataNew.storing_final_documents_in_folder = new Date().toISOString();

            } else {
                jsonData.storing_final_documents_in_folder = null; // If unchecked, set to null
                jsonDataNew.storing_final_documents_in_folder = null;
            }

            if ($('#circuit_diagrams').prop('checked')) {
                jsonData.circuit_diagrams = new Date().toISOString();
                jsonDataNew.circuit_diagrams = new Date().toISOString();

            } else {
                jsonData.circuit_diagrams = null; // If unchecked, set to null
                jsonDataNew.circuit_diagrams = null;
            }

            if ($('#testing_manual').prop('checked')) {
                jsonData.testing_manual = new Date().toISOString();
                jsonDataNew.testing_manual = new Date().toISOString();

            } else {
                jsonData.testing_manual = null; // If unchecked, set to null
                jsonDataNew.testing_manual = null;
            }

            if ($('#specification_check').prop('checked')) {
                jsonData.specification_check = new Date().toISOString();
                jsonDataNew.rnd_specification_check = new Date().toISOString();

            } else {
                jsonData.specification_check = null; // If unchecked, set to null
                jsonDataNew.rnd_specification_check = null;
            }

            // Get current date if user_manual is checked
            if ($('#bom').prop('checked')) {
                jsonData.bom = new Date().toISOString();
            } else {
                jsonData.bom = null; // If unchecked, set to null
            }

            // Get current date if rnd_complete is checked
            if ($('#rnd_complete').prop('checked')) {
                jsonData.rnd_complete = new Date().toISOString();
                jsonDataNew.rnd_finished = new Date().toISOString();

            } else {
                jsonData.rnd_complete = null; // If unchecked, set to null
                jsonDataNew.rnd_finished = null;
            }
            // Log JSON data
            console.log('JSON data:', jsonData);

            function getCurrentDateTime() {
                const now = new Date();
                const day = String(now.getDate()).padStart(2, '0');
                const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed, so we add 1
                const year = now.getFullYear();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');

                return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
            }

            const currentDateTime = getCurrentDateTime();

            // Check if #notes is empty
            if ($("#notes").val().trim() === "") {
                jsonData.notes = ""; // Set notes to an empty string if it's empty
                jsonDataNew.notes = "";
            } else {
                jsonData.notes = $("#notes").val(); // Otherwise, set it to the value of #notes
                jsonDataNew.notes = `R&D : ${currentDateTime} - ${$("#notes").val()}`; // Otherwise, set it to the value of #notes
            }
            // Make AJAX request to update rn data
            $.ajax({
                url: `/api/rnd/${oaNumber}/${itemCode}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(jsonData),
                success: function(response) {
                    console.log('rnd data updated successfully:', response);
                    // Show success popup/notification
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'rnd data updated successfully!',
                    });
                },
                error: function(error) {
                    console.error('Error updating rnd data:', error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: 'Failed to update rnd data. Please try again later.',
                    });
                }
            });

            console.log("**********js code routine************");
            $.ajax({
                url: `/api/team_data/team/${oaNumber}/${itemCode}`,
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(jsonDataNew),
                success: function(response) {
                    console.log("Team data updated successfully:", response);
                    // Show success popup/notification
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "Team data updated successfully!",
                    });
                },
                error: function(error) {
                    console.error("Error updating rnd data:", error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "Failed to update rnd data. Please try again later.",
                    });
                },
            });
        } else {
            console.log("===========ALL Orders==========");
            const selectedValue = selectedValue_2;
            const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code

            console.log("Selected OA number:", oaNumber);
            console.log("Selected Item Code:", itemCode);

            // Construct JSON data
            const notes = $('#notes').val(); // Get value of notes textarea
            const jsonData = {
                notes: notes
            };

            const jsonDataNew = {
                notes: "RND: " + notes
            };

            // Get current date if stock_check is checked
            if ($('#user_manual').prop('checked')) {
                jsonData.user_manual = new Date().toISOString();
                jsonDataNew.user_manual = new Date().toISOString();

            } else {
                jsonData.user_manual = null; // If unchecked, set to null
                jsonDataNew.user_manual = null;
            }

            if ($('#storing_final_documents_in_folder').prop('checked')) {
                jsonData.storing_final_documents_in_folder = new Date().toISOString();
                jsonDataNew.storing_final_documents_in_folder = new Date().toISOString();

            } else {
                jsonData.storing_final_documents_in_folder = null; // If unchecked, set to null
                jsonDataNew.storing_final_documents_in_folder = null;
            }

            if ($('#circuit_diagrams').prop('checked')) {
                jsonData.circuit_diagrams = new Date().toISOString();
                jsonDataNew.circuit_diagrams = new Date().toISOString();

            } else {
                jsonData.circuit_diagrams = null; // If unchecked, set to null
                jsonDataNew.circuit_diagrams = null;
            }

            if ($('#testing_manual').prop('checked')) {
                jsonData.testing_manual = new Date().toISOString();
                jsonDataNew.testing_manual = new Date().toISOString();

            } else {
                jsonData.testing_manual = null; // If unchecked, set to null
                jsonDataNew.testing_manual = null;
            }

            if ($('#specification_check').prop('checked')) {
                jsonData.specification_check = new Date().toISOString();
                jsonDataNew.rnd_specification_check = new Date().toISOString();

            } else {
                jsonData.specification_check = null; // If unchecked, set to null
                jsonDataNew.rnd_specification_check = null;
            }

            // Get current date if user_manual is checked
            if ($('#bom').prop('checked')) {
                jsonData.bom = new Date().toISOString();
            } else {
                jsonData.bom = null; // If unchecked, set to null
            }

            // Get current date if rnd_complete is checked
            if ($('#rnd_complete').prop('checked')) {
                jsonData.rnd_complete = new Date().toISOString();
                jsonDataNew.rnd_finished = new Date().toISOString();

            } else {
                jsonData.rnd_complete = null; // If unchecked, set to null
                jsonDataNew.rnd_finished = null;
            }
            // Log JSON data
            console.log('JSON data:', jsonData);

            function getCurrentDateTime() {
                const now = new Date();
                const day = String(now.getDate()).padStart(2, '0');
                const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed, so we add 1
                const year = now.getFullYear();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');

                return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
            }

            const currentDateTime = getCurrentDateTime();

            // Check if #notes is empty
            if ($("#notes").val().trim() === "") {
                jsonData.notes = ""; // Set notes to an empty string if it's empty
                jsonDataNew.notes = "";
            } else {
                jsonData.notes = $("#notes").val(); // Otherwise, set it to the value of #notes
                jsonDataNew.notes = `R&D : ${currentDateTime} - ${$("#notes").val()}`; // Otherwise, set it to the value of #notes
            }
            // Make AJAX request to update sales data
            $.ajax({
                url: `/api/rnd/${oaNumber}/${itemCode}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(jsonData),
                success: function(response) {
                    console.log('rnd data updated successfully:', response);
                    // Show success popup/notification
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'rnd data updated successfully!',
                    });
                },
                error: function(error) {
                    console.error('Error updating rnd data:', error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: 'Failed to update rnd data. Please try again later.',
                    });
                }
            });

            console.log("**********js code routine************");
            $.ajax({
                url: `/api/team_data/team/${oaNumber}/${itemCode}`,
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(jsonDataNew),
                success: function(response) {
                    console.log("Team data updated successfully:", response);
                    // Show success popup/notification
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "Team data updated successfully!",
                    });
                },
                error: function(error) {
                    console.error("Error updating rnd data:", error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "Failed to update rnd data. Please try again later.",
                    });
                },
            });
        }
        //All check bock should br refresh
        $("#user_manual").prop("checked", false);
        $("#rnd_complete").prop("checked", false);
        $("#bom").prop("checked", false);
        $("#specification_check").prop("checked", false);
        $("#testing_manual").prop("checked", false);
        $("#circuit_diagrams").prop("checked", false);
        $("#storing_final_documents_in_folder").prop("checked", false);
        $("#notes").val("")
        loadOrders();
        loadOrders2();
    });

        // Function to update dropdown based on search
function updateDropdown(searchParams, dropdownId) {
    // Build query string dynamically
    const queryString = Object.keys(searchParams)
        .filter(key => searchParams[key]) // Include only non-empty parameters
        .map(key => `${key}=${encodeURIComponent(searchParams[key])}`)
        .join('&');

    // AJAX call to fetch filtered data
    $.ajax({
        url: `/api/check/search?${queryString}`, // Adjusted endpoint
        method: "GET",
        success: function (response) {
            const dropdown = $(`#${dropdownId}`);
            dropdown.empty(); // Clear existing options
            dropdown.append('<option value="">Select Order</option>'); // Default option

            // Populate dropdown with data
            response.forEach(item => {
                const option = `<option value="${item.oa_number},${item.item_code}">${item.oa_number} - ${item.item_code}</option>`;
                dropdown.append(option);
            });
        },
        error: function (error) {
            console.error(`Error fetching data for ${dropdownId}:`, error);
        }
    });
}

// Debounce function to optimize performance
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// Event listener for search inputs
$('#searchOANumber, #searchCustomerName, #searchItemCode').on(
    'input',
    debounce(function () {
        const searchParams = {
            oaNumber: $('#searchOANumber').val(),
            customerName: $('#searchCustomerName').val(),
            itemCode: $('#searchItemCode').val(),
            tableName: 'rnd_data'
        };
        updateDropdown(searchParams, 'select-order');
        updateDropdown(searchParams, 'select-order-2');
    }, 300)
);
    //Push BAck
    const departmentReasons = {
        1: [
            // Sales
            "Quotation failed",
            "Specification check failed",
            "FG code check failed",
            "Terms of payment check failed",
        ],
        2: [
            // Purchase
            "Material Delayed",
            "MRP check failed",
            "PO check failed",
        ],
        3: [
            // Stores
            "Stock check failed",
            "M-I-P check failed",
            "Packing check failed",
            "Delivery check failed",
        ],
        4: [
            // R&D
            "Spec check failed",
            "BOM check failed",
            "R&D complete failed",
        ],
        5: [
            // Production
            "Spec Check failed",
            "BOM check failed",
            "Work schedule failed",
            "Assembly failed",
            "Final Testing failed",
            "Production QC failed",
        ],
        6: [
            // QC
            "Spec check failed",
            "QC failed",
        ],
        7: [
            // Accounts
            "GST number failed",
            "Statutory Details failed",
            "Terms of Payment failed",
            "Advance Received failed",
            "Invoice Failed",
        ],
    };

    document.getElementById("department").addEventListener("change", function() {
        const selectedDepartment = this.value;
        const dropdownList = document.getElementById("dropdown-list");
        dropdownList.innerHTML = ""; // Clear previous options

        if (selectedDepartment) {
            departmentReasons[selectedDepartment].forEach((reason) => {
                const checkboxDiv = document.createElement("div");
                checkboxDiv.innerHTML = `
            <label>
                <input type="checkbox" value="${reason}"> ${reason}
            </label>
        `;
                dropdownList.appendChild(checkboxDiv);
            });
            dropdownList.style.display = "block"; // Show the dropdown list
        } else {
            dropdownList.style.display = "none"; // Hide the dropdown list
        }
    });

    // Toggle the dropdown when clicking the toggle
    document
        .getElementById("dropdown-toggle")
        .addEventListener("click", function() {
            const dropdownList = document.getElementById("dropdown-list");
            dropdownList.style.display =
                dropdownList.style.display === "block" ? "none" : "block";
        });

    // Close dropdown if clicked outside
    document.addEventListener("click", function(event) {
        const dropdownList = document.getElementById("dropdown-list");
        const dropdownToggle = document.getElementById("dropdown-toggle");
        if (!dropdownToggle.contains(event.target) &&
            !dropdownList.contains(event.target)
        ) {
            dropdownList.style.display = "none";
        }
    });

    // Handle Update button click
    document.getElementById("sendbtn-2").addEventListener("click", function() {
        const department = document.getElementById("department").value;
        const reasons = Array.from(
            document.querySelectorAll('#dropdown-list input[type="checkbox"]:checked')
        ).map((checkbox) => checkbox.value);

        const selectedValue = $("#select-order").val(); // Get the selected value (oa_number,item_code)
        const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code

        console.log("Selected OA number:", oaNumber);
        console.log("Selected Item Code:", itemCode);

        // Prepare the data to be sent
        const jsonDataNew = {
            department,
            reasons,
            oaNumber,
            itemCode,
        };

        var department_name = "";
        if (department == "1") {
            department_name = "Sales";
        } else if (department == "2") {
            department_name = "Purchase";
        } else if (department == "3") {
            department_name = "Stores";
        } else if (department == "4") {
            department_name = "R&D";
        } else if (department == "5") {
            department_name = "Production";
        } else if (department == "6") {
            department_name = "QC";
        } else if (department == "7") {
            department_name = "Accounts";
        }

        const department_id = $("#usernameID-placeholder").text();

        console.log("Department ID:", department_id);

        // AJAX call to send data
        $.ajax({
            url: `/api/pushback_status/${oaNumber}/${itemCode}/${department_id}`,
            method: "PUT",
            contentType: "application/json",
            data: JSON.stringify(jsonDataNew),
            success: function(response) {
                console.log("Team data updated successfully:", response);
                // Show success popup/notification
                Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text: `Order Pushed Backed to ${department_name}`,
                });
            },
            error: function(error) {
                console.error("Error updating accounts data:", error);
                // Show error popup/notification
                Swal.fire({
                    icon: "error",
                    title: "Error!",
                    text: "Failed to update Pushback. Please try again later.",
                });
            },
        });
    });
});