$(document).ready(function() {
    console.log("Document is ready."); // Debugging statement

    var oaNumber; // Declare oaNumber outside any specific event handler
    var custEmail, oadate, itemcode, orderqty; // Declare variables to hold order data

    // Fetch user data
    $.ajax({
        url: "/api/user",
        method: "GET",
        success: function(data) {
            console.log("User data received:", data); // Debugging statement
            $("#username-placeholder").text(data.name);
            $("#usernameID-placeholder").text(data.id);
        },
        error: function(err) {
            console.log("Error fetching user data:", err);
        },
    });

    // Function to format date to dd-mm-yyyy
    function formatDate(dateString) {
        var date = new Date(dateString);
        var day = String(date.getDate()).padStart(2, "0");
        var month = String(date.getMonth() + 1).padStart(2, "0"); // January is 0!
        var year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    var currentDate = new Date();

    // Format the current year and month (e.g., "2024-11" for November 2024)
    var currentYearMonth =
        currentDate.getFullYear() +
        "-" +
        (currentDate.getMonth() + 1).toString().padStart(2, "0");

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

    // Initialize Flatpickr for Late Clause date picker
    $("#material_receipt_eta").flatpickr({
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "F j, Y",
        disableMobile: true,
        defaultDate: "2024-01-01", // Set default year to 2024
        onClose: function(selectedDates, dateStr, instance) {
            late_clause = dateStr;
            console.log("Late Clause Date Selected:", late_clause);
        },
    });

    // Function to load orders based on selected month, year, and category
    function loadOrders() {
        const startMonthYear = $('#month-year-picker-F').val();
        const endMonthYear = $('#month-year-picker').val();

        const [startYear, startMonth] = startMonthYear ? startMonthYear.split('-') : [null, null];
        const [endYear, endMonth] = endMonthYear ? endMonthYear.split('-') : [null, null];
        const category = $('#order-category').val();

        if (startMonth && startYear && endMonth && endYear) {
            $.ajax({
                url: "/api/purchase",
                method: "GET",
                data: {
                    startMonth: startMonth,
                    startYear: startYear,
                    endMonth: endMonth,
                    endYear: endYear,
                    category: category
                },
                success: function(response) {
                    const orders = response.rows;
                    const $selectOrder = $("#select-order");
                    $selectOrder.empty();
                    $selectOrder.append(`<option value="">Select Order</option>`);
                    orders.sort((a, b) => {
                        const oaCompare = a.oa_number.localeCompare(b.oa_number);
                        return oaCompare !== 0 ?
                            oaCompare :
                            a.item_code.localeCompare(b.item_code);
                    });
                    orders.forEach((order) => {
                        if (
                            (order.status === 0 || order.status === null) && // Filter based on status
                            (order.mrp === null ||
                                order.po === null ||
                                order.material_receipt_eta === null ||
                                order.material_received === null)
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

    // Function to load orders based on selected month, year, and category
    function loadOrders2() {
        const startMonthYear = $("#month-year-picker-F").val();
        const endMonthYear = $("#month-year-picker").val();

        const [startYear, startMonth] = startMonthYear ? startMonthYear.split("-") : [null, null];
        const [endYear, endMonth] = endMonthYear ? endMonthYear.split("-") : [null, null];
        const category = $("#order-category").val();

        if (startMonth && startYear && endMonth && endYear) {
            $.ajax({
                url: "/api/purchase",
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
                        return oaCompare !== 0 ?
                            oaCompare :
                            a.item_code.localeCompare(b.item_code);
                    });
                    orders.forEach((order) => {
                        if (
                            (order.status === 0 || order.status === null) && // Filter based on status
                            order.mrp !== null &&
                            order.po !== null &&
                            order.material_receipt_eta !== null &&
                            order.material_received !== null
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


    function load_progress(department_got) {
        // Get the department name from input
        const department = department_got;
        console.log("department", department);
        // List of departments in the order
        const departments = [
            "sales",
            "purchase",
            "stores",
            "r&d",
            "production",
            "qc",
            "accounts",
        ];
        // Find the index of the provided department
        const index = departments.indexOf(department);

        // Reset all circles and progress bar
        const circles = document.querySelectorAll(".circle");
        circles.forEach((circle, i) => {
            circle.innerText = (i + 1).toString(); // Reset to show step numbers
            circle.classList.remove("completed");
        });
        document.getElementById("progressBar").style.width = "0%"; // Reset progress bar

        // Check if the department exists and update the progress bar and circles
        if (index !== -1) {
            // Update completed circles and progress bar
            for (let i = 0; i <= index; i++) {
                circles[i].innerText = "✓"; // Show tick
                circles[i].classList.add("completed"); // Mark as completed
            }
            // Set the width of the progress bar based on the index
            const progressPercentage = ((index + 1) / departments.length) * 100;
            document.getElementById(
                "progressBar"
            ).style.width = `${progressPercentage}%`;
        } else {
            alert("Invalid department name. Please enter a valid department.");
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

    // Function to handle selection of an order
    $("#select-order").on("change", function() {
        const selectedValue = $(this).val(); // Get the selected value (oa_number,item_code)
        const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code
        console.log("Selected OA number:", oaNumber);
        console.log("Selected Item Code:", itemCode);
        var stage = "";
        // Make AJAX request to retrieve purchase data
        $.ajax({
            url: `/api/check/purchase_data/${oaNumber}/${itemCode}`,
            method: "GET",
            success: function(response) {
                console.log("purchase data retrieved successfully:", response);
                // Update checkboxes and auto-fill fields based on response
                const data = response.rows[0];
                const data2 = response;

                console.log("Data Recieved:", data);
                // console.log('purchase data retrieved successfully:', data.late_clause);
                // Auto-check checkboxes based on database values
                $("#mrp").prop("checked", data.mrp);
                $("#po").prop("checked", data.po);
                $("#allMaterialReceived").prop("checked", data.allmaterialreceived);
                $("#material_status").prop("checked", data.material_status);
                // Auto-fill late_clause and notes
                // $("#late_clause_date").flatpickr().setDate(new Date(data.late_clause));
                $("#notes").val(data.notes);
                // Auto-fill material_receipt_eta
                if (data.material_receipt_eta != null) {
                    console.log("GOT ETA :", data.material_receipt_eta);
                    $("material_receipt_eta").val(data.material_receipt_eta);
                } else {
                    $("#material_receipt_eta").val(""); // Clear the field if no data
                }
                if (data.market_shortage != null) {
                    $("#market_shortage").val(data.market_shortage);
                } else {
                    $("#market_shortage").val(""); // Clear the field if no data
                }
                if (data.price_hike != null) {
                    // console.log("DATA PRICE HIKE", data.price_hike);
                    $("#price_hike").val(data.price_hike);
                } else {
                    $("#price_hike").val(" "); // Clear the field if price_hike is null or not present
                }
                stage = data2.stageDescription;
                console.log("Satge Recieved 2:", stage);
                load_progress(stage);
            },
            error: function(error) {
                console.error("Error retrieving purchase data:", error);
                // Handle error response
            },
        });
        loadOrders2();
    });

    $("#select-order-2").on("change", function() {
        const selectedValue = $(this).val(); // Get the selected value (oa_number,item_code)
        const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code
        console.log("Selected OA number:", oaNumber);
        console.log("Selected Item Code:", itemCode);
        var stage = "";
        // Make AJAX request to retrieve purchase data
        $.ajax({
            url: `/api/check/purchase_data/${oaNumber}/${itemCode}`,
            method: "GET",
            success: function(response) {
                console.log("purchase data retrieved successfully:", response);
                // Update checkboxes and auto-fill fields based on response
                const data = response.rows[0];
                const data2 = response;
                console.log("Data Recieved:", data);
                // console.log('purchase data retrieved successfully:', data.late_clause);
                // Auto-check checkboxes based on database values
                $("#mrp").prop("checked", data.mrp);
                $("#po").prop("checked", data.po);
                $("#allMaterialReceived").prop("checked", data.allmaterialreceived);
                $("#material_status").prop("checked", data.material_status);
                // Auto-fill late_clause and notes
                // $("#late_clause_date").flatpickr().setDate(new Date(data.late_clause));
                $("#notes").val(data.notes);
                // Auto-fill material_receipt_eta
                if (data.material_receipt_eta != null) {
                    console.log("GOT ETA:", data.material_receipt_eta);
                    // const new_date = formatDate(data.material_receipt_eta);
                    $("#material_receipt_eta").val(data.material_receipt_eta);
                } else {
                    console.log("Fail ETA", data.material_receipt_eta);
                    $("#material_receipt_eta").val(""); // Clear the field if no data
                }
                if (data.market_shortage != null) {
                    $("#market_shortage").val(data.market_shortage);
                } else {
                    $("#market_shortage").val(""); // Clear the field if no data
                }
                if (data.price_hike != null) {
                    $("#price_hike").val(data.price_hike);
                } else {
                    $("#price_hike").val(""); // Clear the field if price_hike is null or not present
                }

                stage = data2.stageDescription;
                console.log("Satge Recieved 2:", stage);
                load_progress(stage);
            },
            error: function(error) {
                console.error("Error retrieving purchase data:", error);
                // Handle error response
            },
        });
        loadOrders();
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
            tableName: 'purchase_data'
        };
        updateDropdown(searchParams, 'select-order');
        updateDropdown(searchParams, 'select-order-2');
    }, 300)
);

    // Record checkbox dates individually
    let material_status = null;
    let mrp = null;
    let po = null;
    let market_shortage = null;
    let price_hike = null;
    let material_receipt_eta = null;
    let allMaterialReceived = null;

    // Attach event listeners to checkboxes
    $("#material_status").on("change", function() {
        const isChecked = $(this).prop("checked");
        if (isChecked) {
            material_status = new Date().toISOString();
        } else {
            material_status = null;
        }
        console.log(`material status: ${material_status}`);
    });

    // Attach event listeners to checkboxes
    $("#allMaterialReceived").on("change", function() {
        const isChecked = $(this).prop("checked");
        if (isChecked) {
            allMaterialReceived = new Date().toISOString();
        } else {
            allMaterialReceived = null;
        }
        console.log(`material status: ${allMaterialReceived}`);
    });

    $("#mrp").on("change", function() {
        const isChecked = $(this).prop("checked");
        if (isChecked) {
            mrp = new Date().toISOString();
        } else {
            mrp = null;
        }
        console.log(`mrp: ${mrp}`);
    });

    $("#po").on("change", function() {
        const isChecked = $(this).prop("checked");
        if (isChecked) {
            po = new Date().toISOString();
        } else {
            po = null;
        }
        console.log(`po: ${po}`);
    });

    $("#market_shortage").on("input", function() {
        const inputValue = $(this).val();
        if (inputValue) {
            market_shortage = inputValue;
        } else {
            market_shortage = null;
        }
        console.log(`market_shortage: ${market_shortage}`);
    });

    $("#price_hike").on("input", function() {
        const inputValue = $(this).val();
        if (inputValue) {
            price_hike = inputValue;
        } else {
            price_hike = null;
        }
        console.log(`price_hike: ${price_hike}`);
    });

    $("#material_receipt_eta").on("change", function() {
        const isChecked = $(this).prop("checked");
        if (isChecked) {
            material_receipt_eta = new Date().toISOString();
        } else {
            material_receipt_eta = null;
        }
        console.log(`material_receipt_eta: ${material_receipt_eta}`);
    });

    $("#sendbtn").on("click", function() {
        console.log("Send button clicked");
        const selectedValue_1 = $("#select-order").val(); // Get the selected value (oa_number,item_code)
        const selectedValue_2 = $("#select-order-2").val(); // Get the selected value (oa_number,item_code)
        console.log("Selected value 1:", selectedValue_1);
        console.log("Selected value 2:", selectedValue_2);

        if (
            selectedValue_1 !== null &&
            (selectedValue_2 == null || selectedValue_2 == "")
        ) {
            // Get selected OA number
            const selectedValue = selectedValue_1;
            const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code

            console.log("Selected OA number:", oaNumber);
            console.log("Selected Item Code:", itemCode);

            // Construct JSON data
            const notes = $("#notes").val(); // Get value of notes textarea
            const jsonData = {
                notes: notes,
            };

            const jsonDataNew = {
                notes: notes,
            };

            // Get current date if so_check_with_quotation is checked
            if ($("#material_status").prop("checked")) {
                jsonData.material_status = new Date().toISOString();
                jsonDataNew.purchase_material_delay = true;
            } else {
                jsonData.material_status = null; // If unchecked, set to null
                jsonDataNew.purchase_material_delay = false;
            }

            if ($("#allMaterialReceived").prop("checked")) {
                jsonData.allMaterialReceived = new Date().toISOString();
            } else {
                jsonData.allMaterialReceiveds = null; // If unchecked, set to null
            }

            // Get current date if spec_check is checked
            if ($("#mrp").prop("checked")) {
                jsonData.mrp = new Date().toISOString();
            } else {
                jsonData.mrp = null; // If unchecked, set to null
            }

            // Get current date if terms_of_payment is checked
            if ($("#po").prop("checked")) {
                jsonData.po = new Date().toISOString();
            } else {
                jsonData.po = null; // If unchecked, set to null
            }

            // Get current date if terms_of_payment is checked
            if ($("#market_shortage").val().trim() === "") {
                jsonData.market_shortage = "";
                jsonDataNew.purchase_shortage = "";
            } else {
                jsonData.market_shortage = $("#market_shortage").val(); // If unchecked, set to null
                jsonDataNew.purchase_shortage = $("#market_shortage").val();
            }

            // Get current date if terms_of_payment is checked
            if ($("#price_hike").val().trim() === "") {
                jsonData.price_hike = "";
                jsonDataNew.purchase_price_hike = "";
            } else {
                jsonData.price_hike = $("#price_hike").val(); // If unchecked, set to null
                jsonDataNew.purchase_price_hike = $("#price_hike").val();
            }

            if ($("#material_receipt_eta").val().trim() === "") {
                jsonData.material_receipt_eta = null;
                jsonDataNew.purchase_material_receipt_eta = null;
            } else {
                jsonData.material_receipt_eta = $("#material_receipt_eta").val(); // If unchecked, set to null
                jsonDataNew.purchase_material_receipt_eta = $(
                    "#material_receipt_eta"
                ).val();
            }

            // Check if #notes is empty

            function getCurrentDateTime() {
                const now = new Date();
                const day = String(now.getDate()).padStart(2, "0");
                const month = String(now.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed, so we add 1
                const year = now.getFullYear();
                const hours = String(now.getHours()).padStart(2, "0");
                const minutes = String(now.getMinutes()).padStart(2, "0");
                const seconds = String(now.getSeconds()).padStart(2, "0");

                return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
            }

            const currentDateTime = getCurrentDateTime();

            // Check if #notes is empty
            if ($("#notes").val().trim() === "") {
                jsonData.notes = ""; // Set notes to an empty string if it's empty
                jsonDataNew.notes = "";
            } else {
                jsonData.notes = $("#notes").val(); // Otherwise, set it to the value of #notes
                jsonDataNew.notes = `PURCHASE : ${currentDateTime} - ${$(
          "#notes"
        ).val()}`; // Otherwise, set it to the value of #notes
            }

            // Log JSON data
            console.log("JSON data:", jsonData);

            // Make AJAX request to update purchase data
            $.ajax({
                url: `/api/purchase/${oaNumber}/${itemCode}`,
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(jsonData),
                success: function(response) {
                    console.log("purchase data updated successfully:", response);
                    // Show success popup/notification
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "purchase data updated successfully!",
                    });
                },
                error: function(error) {
                    console.error("Error updating purchase data:", error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "Failed to update purchase data. Please try again later.",
                    });
                },
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
                    console.error("Error updating purchase data:", error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "Failed to update purchase data. Please try again later.",
                    });
                },
            });
        } else {
            // Get selected OA number
            const selectedValue = selectedValue_2;
            const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code

            console.log("Selected OA number:", oaNumber);
            console.log("Selected Item Code:", itemCode);

            // Construct JSON data
            const notes = $("#notes").val(); // Get value of notes textarea
            const jsonData = {
                notes: notes,
            };

            const jsonDataNew = {
                notes: notes,
            };

            // Get current date if so_check_with_quotation is checked
            if ($("#material_status").prop("checked")) {
                jsonData.material_status = new Date().toISOString();
                jsonDataNew.purchase_material_delay = true;
            } else {
                jsonData.material_status = null; // If unchecked, set to null
                jsonDataNew.purchase_material_delay = false;
            }

            if ($("#allMaterialReceived").prop("checked")) {
                jsonData.allMaterialReceived = new Date().toISOString();
            } else {
                jsonData.allMaterialReceiveds = null; // If unchecked, set to null
            }

            // Get current date if spec_check is checked
            if ($("#mrp").prop("checked")) {
                jsonData.mrp = new Date().toISOString();
            } else {
                jsonData.mrp = null; // If unchecked, set to null
            }

            // Get current date if terms_of_payment is checked
            if ($("#po").prop("checked")) {
                jsonData.po = new Date().toISOString();
            } else {
                jsonData.po = null; // If unchecked, set to null
            }

            // Get current date if terms_of_payment is checked
            if ($("#market_shortage").val().trim() === "") {
                jsonData.market_shortage = "";
                jsonDataNew.purchase_shortage = "";
            } else {
                jsonData.market_shortage = $("#market_shortage").val(); // If unchecked, set to null
                jsonDataNew.purchase_shortage = $("#market_shortage").val();
            }

            // Get current date if terms_of_payment is checked
            if ($("#price_hike").val().trim() === "") {
                jsonData.price_hike = "";
                jsonDataNew.purchase_price_hike = "";
            } else {
                jsonData.price_hike = $("#price_hike").val(); // If unchecked, set to null
                jsonDataNew.purchase_price_hike = $("#price_hike").val();
            }

            if ($("#material_receipt_eta").val().trim() === "") {
                jsonData.material_receipt_eta = null;
                jsonDataNew.purchase_material_receipt_eta = null;
            } else {
                jsonData.material_receipt_eta = $("#material_receipt_eta").val(); // If unchecked, set to null
                jsonDataNew.purchase_material_receipt_eta = $(
                    "#material_receipt_eta"
                ).val();
            }

            // Check if #notes is empty

            function getCurrentDateTime() {
                const now = new Date();
                const day = String(now.getDate()).padStart(2, "0");
                const month = String(now.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed, so we add 1
                const year = now.getFullYear();
                const hours = String(now.getHours()).padStart(2, "0");
                const minutes = String(now.getMinutes()).padStart(2, "0");
                const seconds = String(now.getSeconds()).padStart(2, "0");

                return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
            }

            const currentDateTime = getCurrentDateTime();

            // Check if #notes is empty
            if ($("#notes").val().trim() === "") {
                jsonData.notes = ""; // Set notes to an empty string if it's empty
                jsonDataNew.notes = "";
            } else {
                jsonData.notes = $("#notes").val(); // Otherwise, set it to the value of #notes
                jsonDataNew.notes = `PURCHASE : ${currentDateTime} - ${$(
          "#notes"
        ).val()}`; // Otherwise, set it to the value of #notes
            }

            // Log JSON data
            console.log("JSON data:", jsonData);

            // Make AJAX request to update purchase data
            $.ajax({
                url: `/api/purchase/${oaNumber}/${itemCode}`,
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(jsonData),
                success: function(response) {
                    console.log("purchase data updated successfully:", response);
                    // Show success popup/notification
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "purchase data updated successfully!",
                    });
                },
                error: function(error) {
                    console.error("Error updating purchase data:", error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "Failed to update purchase data. Please try again later.",
                    });
                },
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
                    console.error("Error updating purchase data:", error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "Failed to update purchase data. Please try again later.",
                    });
                },
            });
        }
        //All check bock should br refresh
        $("#material_status").prop("checked", false);
        $("#allMaterialReceived").prop("checked", false);
        $("#mrp").prop("checked", false);
        $("#po").prop("checked", false);
        $("#market_shortage").val("")
        $("#price_hike").val("")
        $("#notes").val("")
        $("#material_receipt_eta").val(null)
        loadOrders();
        loadOrders2();
    });

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