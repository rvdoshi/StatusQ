$(document).ready(function() {

    // Initialize Flatpickr for month and year selection
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
            tableName: 'stores_data'
        };
        updateDropdown(searchParams, 'select-order');
        updateDropdown(searchParams, 'select-order-2');
    }, 300)
);

    // Function to load orders based on selected month, year, and category
    // function loadOrders() {
    //     const monthYear = $('#month-year-picker').val();
    //     const [year, month] = monthYear ? monthYear.split('-') : [null, null];
    //     const category = $('#order-category').val();

    //     if (month && year) {
    //         $.ajax({
    //             url: '/api/stores',
    //             method: 'GET',
    //             data: {
    //                 month: month,
    //                 year: year,
    //                 category: category
    //             },
    //             success: function (response) {
    //                 const orders = response.rows;
    //                 const $selectOrder = $('#select-order');
    //                 $selectOrder.empty();
    //                 orders.forEach(order => {
    //                     $selectOrder.append(
    //                         `<option value="${order.oa_number},${order.item_code}">${order.oa_number} - ${order.item_code} - ${order.customer_name}</option>`
    //                       );

    //                 });
    //             },
    //             error: function (error) {
    //                 console.error('Error fetching orders:', error);
    //             }
    //         });
    //     }
    // }

    function loadOrders() {
        const startMonthYear = $('#month-year-picker-F').val();
        const endMonthYear = $('#month-year-picker').val();

        const [startYear, startMonth] = startMonthYear ? startMonthYear.split('-') : [null, null];
        const [endYear, endMonth] = endMonthYear ? endMonthYear.split('-') : [null, null];
        const category = $('#order-category').val();

        if (startMonth && startYear && endMonth && endYear) {
            $.ajax({
                url: '/api/stores',
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

                    // Sort the orders by oa_number and item_code in ascending order
                    orders.sort((a, b) => {
                        const oaCompare = a.oa_number.localeCompare(b.oa_number);
                        return oaCompare !== 0 ? oaCompare : a.item_code.localeCompare(b.item_code);
                    });

                    const $selectOrder = $('#select-order');
                    $selectOrder.empty();
                    $selectOrder.append(
                        `<option value="">Select Order</option>`
                    );

                    // Append filtered orders to the dropdown
                    orders.forEach(order => {
                        if (
                            (order.status === 0 || order.status === null) && // Filter based on status
                            (
                                order.stock_check === null ||
                                order.bom === null ||
                                order.m_i_p === null ||
                                order.mrn === null ||
                                order.gin === null ||
                                order.grp === null
                            )
                        ) {
                            $selectOrder.append(
                                `<option value="${order.oa_number},${order.item_code}">${order.oa_number} - ${order.item_code} - ${order.customer_name}</option>`
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
                url: '/api/stores',
                method: 'GET',
                data: {
                    startMonth: startMonth,
                    startYear: startYear,
                    endMonth: endMonth,
                    endYear: endYear,
                    category: category,
                },
                success: function(response) {
                    const orders = response.rows;
                    const $selectOrder = $('#select-order-2');
                    $selectOrder.empty();
                    $selectOrder.append(
                        `<option value="">Select Order</option>`
                    );

                    orders.sort((a, b) => {
                        const oaCompare = a.oa_number.localeCompare(b.oa_number);
                        return oaCompare !== 0 ? oaCompare : a.item_code.localeCompare(b.item_code);
                    });
                    orders.forEach(order => {
                        if (
                            (order.status === 0 || order.status === null) && // Filter based on status
                            (
                                order.stock_check !== null &&
                                order.bom !== null &&
                                order.m_i_p !== null &&
                                order.mrn !== null &&
                                order.gin !== null &&
                                order.grp !== null
                            )
                        ) {
                            $selectOrder.append(
                                `<option value="${order.oa_number},${order.item_code}">${order.oa_number} - ${order.item_code} - ${order.customer_name}</option>`
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
            url: `/api/check/stores_data/${oaNumber}/${itemCode}`,
            method: 'GET',
            success: function(response) {
                console.log('Stores data retrieved successfully:', response);
                // Update checkboxes and auto-fill fields based on response
                const data = response.rows[0];
                const data2 = response;
                // itemCode = data.item_code;
                // console.log('Sales data retrieved successfully:', data.late_clause);
                // Auto-check checkboxes based on database values
                $('#stock_check').prop('checked', data.stock_check);
                $('#m_i_p').prop('checked', data.m_i_p);
                $('#packing').prop('checked', data.packing);
                $('#delivery').prop('checked', data.delivery);
                $('#bom').prop('checked', data.bom);
                $('#mrn').prop('checked', data.mrn);
                $('#grp').prop('checked', data.grp);
                $('#gin').prop('checked', data.gin);
                // Auto-fill late_clause and notes
                if (data.notes != null) {
                    $('#notes').val(data.notes);
                } else {
                    $('#notes').val('');
                }

                stage = data2.stageDescription;
                console.log("Satge Recieved", data2.stageDescription);
                console.log("Satge Recieved 2:", stage);
                load_progress(stage);
            },
            error: function(error) {
                console.error('Error retrieving sales data:', error);
                // Handle error response
            }
        });
        loadOrders2();
    });

    // Function to handle selection of an order
    $('#select-order-2').on('change', function() {

        const selectedValue = $(this).val(); // Get the selected value (oa_number,item_code)
        const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code
        console.log("Selected OA number:", oaNumber);
        console.log("Selected Item Code:", itemCode);
        var stage = "";
        // Make AJAX request to retrieve sales data
        $.ajax({
            url: `/api/check/stores_data/${oaNumber}/${itemCode}`,
            method: 'GET',
            success: function(response) {
                console.log('Stores data retrieved successfully:', response);
                // Update checkboxes and auto-fill fields based on response
                const data = response.rows[0];
                const data2 = response;
                // itemCode = data.item_code;
                // console.log('Sales data retrieved successfully:', data.late_clause);
                // Auto-check checkboxes based on database values
                $('#stock_check').prop('checked', data.stock_check);
                $('#m_i_p').prop('checked', data.m_i_p);
                $('#packing').prop('checked', data.packing);
                $('#delivery').prop('checked', data.delivery);
                $('#bom').prop('checked', data.bom);
                $('#mrn').prop('checked', data.mrn);
                $('#grp').prop('checked', data.grp);
                $('#gin').prop('checked', data.gin);
                // Auto-fill late_clause and notes
                if (data.notes != null) {
                    $('#notes').val(data.notes);
                } else {
                    $('#notes').val('');
                }

                stage = data2.stageDescription;
                console.log("Satge Recieved", data2.stageDescription);
                console.log("Satge Recieved 2:", stage);
                load_progress(stage);
            },
            error: function(error) {
                console.error('Error retrieving sales data:', error);
                // Handle error response
            }
        });
        loadOrders();
    });

    // Record checkbox dates individually
    let stock_check = null;
    let m_i_p = null;
    let packing = null;
    let delivery = null;
    let bom = null;
    let mrn = null;
    let grp = null;



    // Attach event listeners to checkboxes
    $('#stock_check').on('change', function() {
        const isChecked = $(this).prop('checked');
        if (isChecked) {
            stock_check = new Date().toISOString();
        } else {
            stock_check = null;
        }
        console.log(`SO check with quotation date: ${stock_check}`);
    });

    $('#m_i_p').on('change', function() {
        const isChecked = $(this).prop('checked');
        if (isChecked) {
            m_i_p = new Date().toISOString();
        } else {
            m_i_p = null;
        }
        console.log(`Specification Check date: ${m_i_p}`);
    });

    $('#packing').on('change', function() {
        const isChecked = $(this).prop('checked');
        if (isChecked) {
            packing = new Date().toISOString();
        } else {
            packing = null;
        }
        console.log(`Terms of Payment date: ${packing}`);
    });

    $('#delivery').on('change', function() {
        const isChecked = $(this).prop('checked');
        if (isChecked) {
            delivery = new Date().toISOString();
        } else {
            delivery = null;
        }
        console.log(`Terms of Payment date: ${delivery}`);
    });

    $('#sendbtn').on('click', function() {
        console.log('Send button clicked');

        // Get selected OA number
        const selectedValue_1 = $("#select-order").val(); // Get the selected value (oa_number,item_code)
        const selectedValue_2 = $("#select-order-2").val(); // Get the selected value (oa_number,item_code)
        if (selectedValue_1 !== null && (selectedValue_2 == null || selectedValue_2 == "")) {

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
                notes: "STORES: " + notes
            };

            // Get current date if stock_check is checked
            if ($('#stock_check').prop('checked')) {
                jsonData.stock_check = new Date().toISOString();
            } else {
                jsonData.stock_check = null; // If unchecked, set to null
            }

            // Get current date if m_i_p is checked
            if ($('#m_i_p').prop('checked')) {
                jsonData.m_i_p = new Date().toISOString();
            } else {
                jsonData.m_i_p = null; // If unchecked, set to null
            }

            // Get current date if packing is checked
            if ($('#packing').prop('checked')) {
                jsonData.packing = new Date().toISOString();
                jsonDataNew.stores_packing = new Date().toISOString();
            } else {
                jsonData.packing = null; // If unchecked, set to null
                jsonDataNew.stores_packing = null;

            }

            if ($('#delivery').prop('checked')) {
                jsonData.delivery = new Date().toISOString();
                jsonDataNew.stores_delivery = new Date().toISOString();

            } else {
                jsonData.delivery = null; // If unchecked, set to null
                jsonDataNew.stores_delivery = null;
            }

            if ($('#bom').prop('checked')) {
                jsonData.bom = new Date().toISOString();
            } else {
                jsonData.bom = null; // If unchecked, set to null
            }

            if ($('#mrn').prop('checked')) {
                jsonData.mrn = new Date().toISOString();
            } else {
                jsonData.mrn = null; // If unchecked, set to null
            }

            if ($('#gin').prop('checked')) {
                jsonData.gin = new Date().toISOString();
            } else {
                jsonData.gin = null; // If unchecked, set to null
            }

            if ($('#grp').prop('checked')) {
                jsonData.grp = new Date().toISOString();
            } else {
                jsonData.grp = null; // If unchecked, set to null
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
                jsonDataNew.notes = `STORES : ${currentDateTime} - ${$("#notes").val()}`; // Otherwise, set it to the value of #notes
            }

            // Make AJAX request to update sales data
            $.ajax({
                url: `/api/stores/${oaNumber}/${itemCode}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(jsonData),
                success: function(response) {
                    console.log('STORES data updated successfully:', response);
                    // Show success popup/notification
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Sales data updated successfully!',
                    });
                },
                error: function(error) {
                    console.error('Error updating stores data:', error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: 'Failed to update sales data. Please try again later.',
                    });
                }
            });
            console.log("**********js code routine************");
            console.log("JSON DATA FOR TEAM TABLE", jsonDataNew);
            $.ajax({
                url: `/api/team_data/team/${oaNumber}/${itemCode}`,
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(jsonDataNew),
                success: function(response) {

                    console.log("Team data updated successfully123:", response);
                    // Show success popup/notification
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "Team data updated successfully!",
                    });
                },
                error: function(error) {
                    console.error("Error updating stores data123:", error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "Failed to update Stores data. Please try again later.",
                    });
                },
            });

        } else {
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
                notes: "STORES: " + notes
            };

            // Get current date if stock_check is checked
            if ($('#stock_check').prop('checked')) {
                jsonData.stock_check = new Date().toISOString();
            } else {
                jsonData.stock_check = null; // If unchecked, set to null
            }

            // Get current date if m_i_p is checked
            if ($('#m_i_p').prop('checked')) {
                jsonData.m_i_p = new Date().toISOString();
            } else {
                jsonData.m_i_p = null; // If unchecked, set to null
            }

            // Get current date if packing is checked
            if ($('#packing').prop('checked')) {
                jsonData.packing = new Date().toISOString();
                jsonDataNew.stores_packing = new Date().toISOString();
            } else {
                jsonData.packing = null; // If unchecked, set to null
                jsonDataNew.stores_packing = null;

            }

            if ($('#delivery').prop('checked')) {
                jsonData.delivery = new Date().toISOString();
                jsonDataNew.stores_delivery = new Date().toISOString();

            } else {
                jsonData.delivery = null; // If unchecked, set to null
                jsonDataNew.stores_delivery = null;
            }

            if ($('#bom').prop('checked')) {
                jsonData.bom = new Date().toISOString();
            } else {
                jsonData.bom = null; // If unchecked, set to null
            }

            if ($('#mrn').prop('checked')) {
                jsonData.mrn = new Date().toISOString();
            } else {
                jsonData.mrn = null; // If unchecked, set to null
            }

            if ($('#gin').prop('checked')) {
                jsonData.gin = new Date().toISOString();
            } else {
                jsonData.gin = null; // If unchecked, set to null
            }

            if ($('#grp').prop('checked')) {
                jsonData.grp = new Date().toISOString();
            } else {
                jsonData.grp = null; // If unchecked, set to null
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
                jsonDataNew.notes = `STORES : ${currentDateTime} - ${$("#notes").val()}`; // Otherwise, set it to the value of #notes
            }

            // Make AJAX request to update sales data
            $.ajax({
                url: `/api/stores/${oaNumber}/${itemCode}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(jsonData),
                success: function(response) {
                    console.log('Sales data updated successfully:', response);
                    // Show success popup/notification
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Sales data updated successfully!',
                    });
                },
                error: function(error) {
                    console.error('Error updating sales data:', error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: 'Failed to update sales data. Please try again later.',
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
                    console.error("Error updating stores data:", error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "Failed to update Stores data. Please try again later.",
                    });
                },
            });

        }
        //All check bock should br refresh
        $("#stock_check").prop("checked", false);
        $("#m_i_p").prop("checked", false);
        $("#packing").prop("checked", false);
        $("#delivery").prop("checked", false);
        $("#bom").prop("checked", false);
        $("#mrn").prop("checked", false);
        $("#gin").prop("checked", false);
        $("#grp").prop("checked", false);
        $("#notes").val("")

    });


    //Push BAck 
    const departmentReasons = {
        '1': [ // Sales
            'Quotation failed',
            'Specification check failed',
            'FG code check failed',
            'Terms of payment check failed'
        ],
        '2': [ // Purchase
            'Material Delayed',
            'MRP check failed',
            'PO check failed'
        ],
        '3': [ // Stores
            'Stock check failed',
            'M-I-P check failed',
            'Packing check failed',
            'Delivery check failed'
        ],
        '4': [ // R&D
            'Spec check failed',
            'BOM check failed',
            'R&D complete failed'
        ],
        '5': [ // Production
            'Spec Check failed',
            'BOM check failed',
            'Work schedule failed',
            'Assembly failed',
            'Final Testing failed',
            'Production QC failed'
        ],
        '6': [ // QC
            'Spec check failed',
            'QC failed'
        ],
        '7': [ // Accounts
            'GST number failed',
            'Statutory Details failed',
            'Terms of Payment failed',
            'Advance Received failed',
            'Invoice Failed'
        ]
    };

    document.getElementById('department').addEventListener('change', function() {
        const selectedDepartment = this.value;
        const dropdownList = document.getElementById('dropdown-list');
        dropdownList.innerHTML = ''; // Clear previous options

        if (selectedDepartment) {
            departmentReasons[selectedDepartment].forEach(reason => {
                const checkboxDiv = document.createElement('div');
                checkboxDiv.innerHTML = `
                    <label>
                        <input type="checkbox" value="${reason}"> ${reason}
                    </label>
                `;
                dropdownList.appendChild(checkboxDiv);
            });
            dropdownList.style.display = 'block'; // Show the dropdown list
        } else {
            dropdownList.style.display = 'none'; // Hide the dropdown list
        }
    });

    // Toggle the dropdown when clicking the toggle
    document.getElementById('dropdown-toggle').addEventListener('click', function() {
        const dropdownList = document.getElementById('dropdown-list');
        dropdownList.style.display = dropdownList.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdown if clicked outside
    document.addEventListener('click', function(event) {
        const dropdownList = document.getElementById('dropdown-list');
        const dropdownToggle = document.getElementById('dropdown-toggle');
        if (!dropdownToggle.contains(event.target) && !dropdownList.contains(event.target)) {
            dropdownList.style.display = 'none';
        }
    });

    // Handle Update button click
    document.getElementById('sendbtn-2').addEventListener('click', function() {
        const department = document.getElementById('department').value;
        const reasons = Array.from(document.querySelectorAll('#dropdown-list input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        const selectedValue = $("#select-order").val(); // Get the selected value (oa_number,item_code)
        const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code

        console.log("Selected OA number:", oaNumber);
        console.log("Selected Item Code:", itemCode);


        // Prepare the data to be sent
        const jsonDataNew = {
            department,
            reasons,
            oaNumber,
            itemCode
        };

        var department_name = "";
        if (department == '1') {
            department_name = "Sales";
        } else if (department == '2') {
            department_name = "Purchase";
        } else if (department == '3') {
            department_name = "Stores";
        } else if (department == '4') {
            department_name = "R&D";
        } else if (department == '5') {
            department_name = "Production";
        } else if (department == '6') {
            department_name = "QC";
        } else if (department == '7') {
            department_name = "Accounts";
        }

        const department_id = $('#usernameID-placeholder').text();

        console.log("Department ID:", department_id);

        // AJAX call to send data
        $.ajax({
            url: `/api/pushback_status/${oaNumber}/${itemCode}/${department_id}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(jsonDataNew),
            success: function(response) {
                console.log('Team data updated successfully:', response);
                // Show success popup/notification
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: `Order Pushed Backed to ${department_name}`,
                });
            },
            error: function(error) {
                console.error('Error updating accounts data:', error);
                // Show error popup/notification
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to update Pushback. Please try again later.',
                });
            }
        });
    });


});