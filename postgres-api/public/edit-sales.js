let mailCheck;
let oaNumber2, itemCode2, oaDate, orderQty, recipientMail;
$(document).ready(function() {
    console.log("Document is ready."); // Debugging statement

    let oaNumber; // Declare oaNumber outside any specific event handler
    let custEmail, oadate, itemcode, orderqty; // Declare variables to hold order data

    // let oaNumber, oadate, itemcode, orderqty, custEmail;

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

    // // Listen for change event on select-order dropdown
    // $("#select-order").on("change", function() {
    //     const selectedValue = $(this).val(); // Get the selected value (oa_number,item_code)
    //     const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code
    //     console.log("Selected OA number:", oaNumber);
    //     console.log("Selected Item Code:", itemCode);
    //     oaNumber2 = oaNumber;
    //     itemCode2 = itemCode;

    //     // Make AJAX request to retrieve sales data
    //     $.ajax({
    //         url: `/api/check/sales_data/${oaNumber}`,
    //         method: "GET",
    //         success: function(data) {
    //             console.log("Sales data received:", data); // Debugging statement
    //             custEmail = data.email;
    //             oadate = formatDate(data.oaDate);
    //             itemcode = data.itemcode;
    //             orderqty = data.orderqty;
    //             // $('#username-placeholder').text(data.name);
    //             console.log("Selected item code:", itemcode);
    //         },
    //         error: function(err) {
    //             console.log("Error fetching user data:", err);
    //         },
        // });
    // });

    // Function to format date to dd-mm-yyyy
    function formatDate(dateString) {
        var date = new Date(dateString);
        var day = String(date.getDate()).padStart(2, "0");
        var month = String(date.getMonth() + 1).padStart(2, "0"); // January is 0!
        var year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    // Attach click event listener to the mail button
    $("#mailbtn").click(function() {

        mailCheck = true;
        console.log("Mail button clicked.", oaDate); // Debugging statement

        // Define your email data
        var emailData = {
            recipient: recipientMail,
            subject: "Order Acknowledgement for Order Number: " + oaNumber2,
            text: "We thank you for your Order , \n\nThe details of the Order are as follows:" +
                "\n\nOur Order Ref. No. :-" +
                oaNumber2 +
                "\nOrder Date:- " +
                oaDate +
                "\nItem Code:- " +
                itemCode2 +
                "\nOrder Quantity:-" +
                orderQty +
                "\n\nOur production team is working hard to ensure the timely delivery and quality assurance of your Order. We are committed to delivering products that meet and exceed your expectations." +
                "\nThank you for choosing KVAR Technologies. We look forward to fulfilling your order and appreciate the opportunity to serve you." +
                "\n\nBest Regards," +
                "\nTeam KVAR Tech" +
                "\n\n\nThis is a system-generated email. Please do not reply.",
        };

        console.log("Email data ready to send:", emailData);

        // Send AJAX request to send email
        $.ajax({
            url: `/send-email/${oaNumber2}/${itemCode2}`, // Replace with your actual email endpoint
            method: "POST",
            data: emailData,
            success: function(response) {
                console.log("Email sent successfully."); // Debugging statement

                // Handle success response
                // For example, display a success message
                Swal.fire(
                    "Email Sent!",
                    "The email has been sent successfully.",
                    "success"
                );
            },
            error: function(xhr, status, error) {
                console.log("Error sending email:", error); // Debugging statement

                // Handle error response
                // For example, display an error message
                Swal.fire(
                    "Error!",
                    "No Email ID found.",
                    "error"
                );
            },
        });
    });

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

    // Initialize Flatpickr for Late Clause date picker
    $("#late_clause_date").flatpickr({
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
                url: "/api/sales",
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
                    const $selectOrder = $("#select-order");
                    $selectOrder.empty();
                    $selectOrder.append(`<option value="">Select Order</option>`);
                    console.log("Orders:", orders);
                    orders.sort((a, b) => {
                        const oaCompare = a.oa_number.localeCompare(b.oa_number);
                        return oaCompare !== 0 ? oaCompare : a.item_code.localeCompare(b.item_code);
                    });
                    orders.forEach((order) => {
                        if (
                            order.status !== 1 && order.complete !== true)
                        // (
                        //     order.so_check_with_quotation == null ||
                        //     order.mail == null ||
                        //     order.specs_check == null ||
                        //     order.terms_of_payment == null
                        // )
                        {
                            $selectOrder.append(
                                `<option value="${order.oa_number},${order.item_code}, ${order.customer_name}">${order.oa_number} - ${order.item_code} - ${order.customer_name}</option>`
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

    function loadOrders2() {
        const startMonthYear = $('#month-year-picker-F').val();
        const endMonthYear = $('#month-year-picker').val();

        const [startYear, startMonth] = startMonthYear ? startMonthYear.split('-') : [null, null];
        const [endYear, endMonth] = endMonthYear ? endMonthYear.split('-') : [null, null];
        const category = $('#order-category').val();

        if (startMonth && startYear && endMonth && endYear) {
            $.ajax({
                url: "/api/sales",
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
                        if (order.status !== 1 && order.complete !== true
                            // order.so_check_with_quotation !== null &&
                            // order.mail !== null &&
                            // order.specs_check !== null &&
                            // order.terms_of_payment !== null
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

    $("#month-year-picker-F, #order-category").on("change", function() {
        loadOrders();
        loadOrders2();
    });

    //username code
    $(document).ready(function() {
        $.ajax({
            url: "/api/user",
            method: "GET",
            success: function(data) {
                // console.log('AJAX request successful:', data.name);
                $("#username-placeholder").text(data.name);
                $("#usernameID-placeholder").text(data.id);
            },
            error: function(err) {
                console.log("Error fetching user data:", err);
            },
        });
    });
    // Function to update mail button color based on data.mail
    function updateMailButton(mail) {
        console.log("Mail value:", mail);
        const mailButton = $("#mailbtn");
        if (mail === null) {
            mailButton.removeClass("btn-success").addClass("btn-danger"); // Red button
        } else {
            mailButton.removeClass("btn-danger").addClass("btn-success"); // Green button
        }
    }
    // Function to handle selection of an order
    $("#select-order").on("change", function() {
        const selectedValue = $(this).val(); // Get the selected value (oa_number,item_code)
        const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code
        console.log("Selected OA number:", oaNumber);
        console.log("Selected Item Code:", itemCode);
        oaNumber2 = oaNumber;
        itemCode2 = itemCode;
        var stage = "";
        // Make AJAX request to retrieve sales data
        $.ajax({
            url: `/api/check/sales_data/${oaNumber}/${itemCode}`,
            method: "GET",
            success: function(response) {
                console.log("Sales data retrieved successfully:", response);
                // Update checkboxes and auto-fill fields based on response
                const data = response.rows[0];
                oaDate = formatDate(data.oa_date);
                orderQty = data.order_qty;
                recipientMail = data.cust_email;
                const data2 = response;
                // console.log('Sales data retrieved successfully:', data.late_clause);
                // Auto-check checkboxes based on database values
                $("#so_check_with_quotation").prop(
                    "checked",
                    data.so_check_with_quotation
                );
                $("#spec_check").prop("checked", data.specs_check);
                $("#terms_of_payment").prop("checked", data.terms_of_payment);
                $("#delivery").prop("checked", data.delivery);
                $("#advance_received").prop("checked", data.advance_recieved);
                if (data2.status !== null || data2.status === 0) {
                    $("#order_sts").prop("checked", data2.status);
                } else {
                    $("#order_sts").prop("checked", null);
                }
                // Auto-fill late_clause and notes
                $("#late_clause_date").flatpickr().setDate(new Date(data.late_clause));
                if (data.notes != null) {
                    $('#notes').val(data.notes);
                } else {
                    $('#notes').val('');
                }
                stage = data2.stageDescription;
                console.log("Stage Recieved", data2.stageDescription);
                console.log("Stage Recieved 2:", stage);
                load_progress(stage);
                updateMailButton(data.mail);
            },
            error: function(error) {
                console.error("Error retrieving sales data:", error);
                // Handle error response
            },
        });
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
                const option = `<option value="${item.oa_number},${item.item_code}, ${item.customer_name}">${item.oa_number} - ${item.item_code} - ${item.customer_name}</option>`;
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
            tableName: 'sales_data'
        };
        updateDropdown(searchParams, 'select-order');
        updateDropdown(searchParams, 'select-order-2');
    }, 300)
);


    $("#select-order-2").on("change", function() {
        const selectedValue = $(this).val(); // Get the selected value (oa_number,item_code)
        const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code
        console.log("Selected OA number:", oaNumber);
        console.log("Selected Item Code:", itemCode);
        oaNumber2 = oaNumber;
        itemCode2 = itemCode;
        var stage = "";
        // Make AJAX request to retrieve sales data
        $.ajax({
            url: `/api/check/sales_data/${oaNumber}/${itemCode}`,
            method: "GET",
            success: function(response) {
                console.log("Sales data retrieved successfully:", response);
                // Update checkboxes and auto-fill fields based on response
                const data = response.rows[0];
                oaDate = formatDate(data.oa_date);
                orderQty = data.order_qty;
                recipientMail = data.cust_email;
                const data2 = response;
                // console.log('Sales data retrieved successfully:', data.late_clause);
                // Auto-check checkboxes based on database values
                $("#so_check_with_quotation").prop(
                    "checked",
                    data.so_check_with_quotation
                );
                $("#spec_check").prop("checked", data.specs_check);
                $("#terms_of_payment").prop("checked", data.terms_of_payment);
                $("#delivery").prop("checked", data.delivery);
                $("#advance_received").prop("checked", data.advance_recieved);
                if (data2.status !== null || data2.status === 0) {
                    $("#order_sts").prop("checked", data2.status);
                }

                // Auto-fill late_clause and notes
                $("#late_clause_date").flatpickr().setDate(new Date(data.late_clause));
                if (data.notes != null) {
                    $('#notes').val(data.notes);
                } else {
                    $('#notes').val('');
                }
                stage = data2.stageDescription;
                console.log("Satge Recieved", data2.stageDescription);
                console.log("Satge Recieved 2:", stage);
                load_progress(stage);
                updateMailButton(data.mail);
            },
            error: function(error) {
                console.error("Error retrieving sales data:", error);
                // Handle error response
            },
        });
        loadOrders();
    });
    // Record checkbox dates individually
    let so_check_with_quotation_date = null;
    let spec_check_date = null;
    let terms_of_payment_date = null;
    let delivery_date = null;
    let advance_received_date = null;
    let order_sts = 0;
    let reason_active = "";

    // Attach event listeners to checkboxes
    $("#so_check_with_quotation").on("change", function() {
        const isChecked = $(this).prop("checked");
        if (isChecked) {
            so_check_with_quotation_date = new Date().toISOString();
        } else {
            so_check_with_quotation_date = null;
        }
        console.log(
            `SO check with quotation date: ${so_check_with_quotation_date}`
        );
    });

    $("#spec_check").on("change", function() {
        const isChecked = $(this).prop("checked");
        if (isChecked) {
            spec_check_date = new Date().toISOString();
        } else {
            spec_check_date = null;
        }
        console.log(`Specification Check date: ${spec_check_date}`);
    });

    $("#order_sts").on("change", function() {
        const isChecked = $(this).prop("checked");
        if (isChecked) {
            order_sts = 1;
        } else {
            order_sts = 0;
        }
        console.log(`Specification Check date: ${order_sts}`);
    });

    $("#delivery").on("change", function() {
        const isChecked = $(this).prop("checked");
        if (isChecked) {
            delivery_date = new Date().toISOString();
        } else {
            delivery_date = null;
        }
        console.log(`Delivery Date Check date: ${delivery_date}`);
    });

    $("#advance_received").on("change", function() {
        const isChecked = $(this).prop("checked");
        if (isChecked) {
            advance_received_date = new Date().toISOString();
        } else {
            advance_received_date = null;
        }
        console.log(`Advance Check date: ${advance_received_date}`);
    });

    $("#terms_of_payment").on("change", function() {
        const isChecked = $(this).prop("checked");
        if (isChecked) {
            terms_of_payment_date = new Date().toISOString();
        } else {
            terms_of_payment_date = null;
        }
        console.log(`Terms of Payment date: ${terms_of_payment_date}`);
    });

    $("#sendbtn").on("click", function() {
        console.log("Send button clicked");

        // Get selected OA number
        const selectedValue_1 = $("#select-order").val(); // Get the selected value (oa_number,item_code)
        const selectedValue_2 = $("#select-order-2").val(); // Get the selected value (oa_number,item_code)
        if (selectedValue_1 !== null && (selectedValue_2 == null || selectedValue_2 == "")) {
            const selectedValue = selectedValue_1;
            const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code

            console.log("Selected OA number:", oaNumber);
            console.log("Selected Item Code:", itemCode);

            var reason_active = "";

            // Construct JSON data
            const notes = $("#notes").val(); // Get value of notes textarea
            const jsonData = {
                late_clause: $("#late_clause_date").val(), // Get late clause date
                mail: null, // Default mail value set to null
                notes: notes,
            };

            const jsonDataNew = {
                notes: "SALES: " + notes,
            };

            if (mailCheck) {
                console.log("Mail Check is true");
                jsonData.mail = new Date().toISOString();
                jsonDataNew.sales_mail = new Date().toISOString(); // Set today's date in ISO format
            } else {
                jsonData.mail = null;
                jsonDataNew.sales_mail = null; // Keep it null if mailCheck is false
            }

            // Get current date if so_check_with_quotation is checked
            if ($("#so_check_with_quotation").prop("checked")) {
                jsonData.so_check_with_quotation = new Date().toISOString();
            } else {
                jsonData.so_check_with_quotation = null; // If unchecked, set to null
            }

            if ($("#order_sts").prop("checked")) {
                reason_active = $("#reason_active").val(); // Get value of notes textarea
                jsonDataNew.status = 1;
                jsonDataNew.complete = true;
                jsonDataNew.reason = reason_active;
            } else {
                jsonDataNew.status = 0; // If unchecked, set to null
                jsonDataNew.reason = null;
                jsonDataNew.complete = false;
            }

            // Get current date if spec_check is checked
            if ($("#spec_check").prop("checked")) {
                jsonData.specs_check = new Date().toISOString();
            } else {
                jsonData.specs_check = null; // If unchecked, set to null
            }

            // Get current date if terms_of_payment is checked
            if ($("#terms_of_payment").prop("checked")) {
                jsonData.terms_of_payment = new Date().toISOString();
            } else {
                jsonData.terms_of_payment = null; // If unchecked, set to null
            }

            if ($("#delivery").prop("checked")) {
                jsonData.delivery = new Date().toISOString();
            } else {
                jsonData.delivery = null; // If unchecked, set to null
            }

            if ($("#advance_received").prop("checked")) {
                jsonData.advance_received = new Date().toISOString();
            } else {
                jsonData.advance_received = null; // If unchecked, set to null
            }

            if ($("#late_clause_date").val().trim() === "") {
                jsonData.late_clause = ""; // Set notes to an empty string if it's empty
                jsonDataNew.sales_late_clause = "";
            } else {
                jsonData.late_clause = $("#late_clause_date").val(); // Otherwise, set it to the value of #notes
                jsonDataNew.sales_late_clause = $("#late_clause_date").val(); // Otherwise, set it to the value of #notes
            }

            // Log JSON data
            console.log("JSON data:", jsonData);
            // Function to format date and time to dd-mm-yyyy hh:mm:ss
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
                jsonDataNew.notes = `SALES : ${currentDateTime} - ${$("#notes").val()}`; // Place the date/time after "SALES"
            }

            // Make AJAX request to update sales data
            $.ajax({
                url: `/api/sales/${oaNumber}/${itemCode}`,
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(jsonData),
                success: function(response) {
                    console.log("Sales data updated successfully:", response);
                    // Show success popup/notification
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "Sales data updated successfully!",
                    });
                },
                error: function(error) {
                    console.error("Error updating sales data:", error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "Failed to update sales data. Please try again later.",
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
                    console.error("Error updating sales data:", error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "Failed to update sales data. Please try again later.",
                    });
                },
            });
        } else {
            const selectedValue = selectedValue_2;
            const [oaNumber, itemCode] = selectedValue.split(","); // Split the value into oa_number and item_code

            console.log("Selected OA number:", oaNumber);
            console.log("Selected Item Code:", itemCode);

            var reason_active = "";

            // Construct JSON data
            const notes = $("#notes").val(); // Get value of notes textarea
            const jsonData = {
                late_clause: $("#late_clause_date").val(), // Get late clause date
                mail: null, // Default mail value set to null
                notes: notes,
            };

            const jsonDataNew = {
                notes: "SALES: " + notes,
            };

            if (mailCheck) {
                console.log("Mail Check is true");
                jsonData.mail = new Date().toISOString();
                jsonDataNew.sales_mail = new Date().toISOString(); // Set today's date in ISO format
            } else {
                jsonData.mail = null;
                jsonDataNew.sales_mail = null; // Keep it null if mailCheck is false
            }

            // Get current date if so_check_with_quotation is checked
            if ($("#so_check_with_quotation").prop("checked")) {
                jsonData.so_check_with_quotation = new Date().toISOString();
            } else {
                jsonData.so_check_with_quotation = null; // If unchecked, set to null
            }

            if ($("#order_sts").prop("checked")) {
                reason_active = $("#reason_active").val(); // Get value of notes textarea
                jsonDataNew.status = 1;
                jsonDataNew.complete = true;
                jsonDataNew.reason = reason_active;
            } else {
                jsonDataNew.status = 0; // If unchecked, set to null
                jsonDataNew.reason = null;
                jsonDataNew.complete = false;
            }

            // Get current date if spec_check is checked
            if ($("#spec_check").prop("checked")) {
                jsonData.specs_check = new Date().toISOString();
            } else {
                jsonData.specs_check = null; // If unchecked, set to null
            }

            // Get current date if terms_of_payment is checked
            if ($("#terms_of_payment").prop("checked")) {
                jsonData.terms_of_payment = new Date().toISOString();
            } else {
                jsonData.terms_of_payment = null; // If unchecked, set to null
            }

            if ($("#delivery").prop("checked")) {
                jsonData.delivery = new Date().toISOString();
            } else {
                jsonData.delivery = null; // If unchecked, set to null
            }

            if ($("#advance_received").prop("checked")) {
                jsonData.advance_received = new Date().toISOString();
            } else {
                jsonData.advance_received = null; // If unchecked, set to null
            }

            if ($("#late_clause_date").val().trim() === "") {
                jsonData.late_clause = ""; // Set notes to an empty string if it's empty
                jsonDataNew.sales_late_clause = "";
            } else {
                jsonData.late_clause = $("#late_clause_date").val(); // Otherwise, set it to the value of #notes
                jsonDataNew.sales_late_clause = $("#late_clause_date").val(); // Otherwise, set it to the value of #notes
            }

            // Log JSON data
            console.log("JSON data:", jsonData);
            // Function to format date and time to dd-mm-yyyy hh:mm:ss
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
                jsonDataNew.notes = `SALES : ${currentDateTime} - ${$("#notes").val()}`; // Place the date/time after "SALES"
            }

            // Make AJAX request to update sales data
            $.ajax({
                url: `/api/sales/${oaNumber}/${itemCode}`,
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(jsonData),
                success: function(response) {
                    console.log("Sales data updated successfully:", response);
                    // Show success popup/notification
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "Sales data updated successfully!",
                    });
                },
                error: function(error) {
                    console.error("Error updating sales data:", error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "Failed to update sales data. Please try again later.",
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
                    console.error("Error updating sales data:", error);
                    // Show error popup/notification
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "Failed to update sales data. Please try again later.",
                    });
                },
            });
        }
        //All check bock should br refresh
        $("#so_check_with_quotation").prop("checked", false);
        $("#order_sts").prop("checked", false);
        $("#spec_check").prop("checked", false);
        $("#terms_of_payment").prop("checked", false);
        $("#delivery").prop("checked", false);
        $("#advance_received").prop("checked", false);
        $("#late_clause_date").prop("checked", false);
        $("#notes").val("")
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