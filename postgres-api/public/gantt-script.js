async function fetchAndPopulateTable() {
  try {
    const apiUrl = `http://103.113.142.236:3002/api/team_data`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    // console.log("Team Data: ", data);

    if (response.ok) {
      const currentDate = new Date();
      const tableBody = document.getElementById("gantt-chart-body");
      const paginationControls = document.getElementById("pagination-controls");
      let currentPage = 1;
      const rowsPerPage = 13;
      let filteredRows = [];
      // tableBody.innerHTML = "";

      // Sort data.rows by oa_date in ascending order and filter where complete is false
      filteredRows = data.rows
        .filter((row) => !row.complete)
        .sort((a, b) => new Date(b.oa_date) - new Date(a.oa_date));
      // Calculate total pages
      const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

      async function renderTable(page) {
        tableBody.innerHTML = "";

        const startIndex = (page - 1) * rowsPerPage;
        const endIndex = Math.min(
          startIndex + rowsPerPage,
          filteredRows.length
        );

        for (let i = startIndex; i < endIndex; i++) {
          const row = filteredRows[i];
          const { oa_number, item_code, customer_name, delivery_date } = row;

          // Fetch details for Sales
          const checkSalesUrl = `http://103.113.142.236:3002/api/check/sales_data/${oa_number}/${item_code}`;
          const checkPurchaseUrl = `http://103.113.142.236:3002/api/check/purchase_data/${oa_number}/${item_code}`;
          const checkRnDUrl = `http://103.113.142.236:3002/api/check/rnd_data/${oa_number}/${item_code}`;
          const checkProductionUrl = `http://103.113.142.236:3002/api/check/production_data/${oa_number}/${item_code}`;
          const checkStoresUrl = `http://103.113.142.236:3002/api/check/stores_data/${oa_number}/${item_code}`;
          const checkAccountsUrl = `http://103.113.142.236:3002/api/check/accounts_data/${oa_number}/${item_code}`;
          const checkQcUrl = `http://103.113.142.236:3002/api/check/quality_data/${oa_number}/${item_code}`;
          let salesTooltip = "";
          let purchaseTooltip = "";
          let rndTooltip = "";
          let productionTooltip = "";
          let storesTooltip = "";
          let qcTooltip = "";
          let accountsTooltip = "";

          try {
            // Fetch Sales data
            const salesResponse = await fetch(checkSalesUrl);
            const salesData = await salesResponse.json();
            // console.log("Sales Data:", salesData);

            let salesBackgroundColor = "red"; // Default red
            if (salesResponse.ok && salesData) {
              const checks = [
                { key: "Terms of Payment", value: salesData.termsOfPayment },
                {
                  key: "SO Check With Quotation",
                  value: salesData.soCheckWithQuotation,
                },
                { key: "Spec Check", value: salesData.specCheck },
              ];

              const falseItems = checks.filter((check) => !check.value);
              salesTooltip = falseItems.map((item) => item.key).join(", ");

              if (falseItems.length === 0) {
                salesBackgroundColor = "green";
                salesTooltip = ""; // No false values
              } else if (falseItems.length <= 2) {
                salesBackgroundColor = "yellow";
              }
            }

            // Fetch Purchase data
            const purchaseResponse = await fetch(checkPurchaseUrl);
            const purchaseData = await purchaseResponse.json();
            // console.log("Purchase Data:", purchaseData);

            let purchaseBackgroundColor = "red";
            if (purchaseResponse.ok && purchaseData) {
              const checks = [
                { key: "Material Status", value: purchaseData.materialStatus },
                { key: "MRP", value: purchaseData.mrp },
                { key: "PO", value: purchaseData.po },
                {
                  key: "Material Receipt ETA",
                  value: purchaseData.material_reciept_eta,
                },
              ];

              // Count the number of `false` values
              const falseItems = checks.filter((check) => !check.value);
              purchaseTooltip = falseItems.map((item) => item.key).join(", ");
              if (falseItems.length === 0) {
                purchaseBackgroundColor = "green";
                purchaseTooltip = "";
              } else if (falseItems.length <= 3) {
                purchaseBackgroundColor = "yellow";
              }
            } else {
              console.error(
                `Failed to fetch purchase data for ${oa_number} / ${item_code}`
              );
            }

            const rndResponse = await fetch(checkRnDUrl);
            const rndData = await rndResponse.json();
            // console.log("R&D Data:", rndData);

            let rndBackgroundColor = "red";
            if (rndResponse.ok && rndData) {
              const checks = [
                { key: "Specification Check", value: rndData.SpeciCheck },
                { key: "BOM", value: rndData.Bom },
                { key: "R&D Complete", value: rndData.RndComplete },
                { key: "User Manual", value: rndData.user_manual },
                {
                  key: "Storing Final Documents in Folder",
                  value: rndData.storing_final_documents_in_folder,
                },
                { key: "Circuit Diagrams", value: rndData.circuit_diagrams },
                { key: "Testing Manual", value: rndData.testing_manual },
              ];
              // Count the number of `false` values
              const falseItems = checks.filter((check) => !check.value);
              rndTooltip = falseItems.map((item) => item.key).join(", ");
              if (falseItems.length === 0) {
                rndBackgroundColor = "green";
                rndTooltip = "";
              } else if (falseItems.length <= 6) {
                rndBackgroundColor = "yellow";
              }
            } else {
              console.error(
                `Failed to fetch R&D data for ${oa_number} / ${item_code}`
              );
            }

            // Fetch Productin data
            const productionResponse = await fetch(checkProductionUrl);
            const productionData = await productionResponse.json();
            // console.log("Production Data:", productionData);

            let productionBackgroundColor = "red";
            if (productionResponse.ok && productionData) {
              const checks = [
                {
                  key: "Specification Check",
                  value: productionData.specification_check,
                },
                { key: "BOM Check", value: productionData.bom_check },
                { key: "Work Schedule", value: productionData.work_schedule },
                { key: "Final Testing", value: productionData.f_testing },
                { key: "Documentation", value: productionData.documentation },
                { key: "Assembly", value: productionData.assembly },
              ];
              // Count the number of `false` values
              const falseItems = checks.filter((check) => !check.value);
              productionTooltip = falseItems.map((item) => item.key).join(", ");
              if (falseItems.length === 0) {
                productionBackgroundColor = "green";
                productionTooltip = "";
              } else if (falseItems.length <= 5) {
                productionBackgroundColor = "yellow";
              }
            } else {
              console.error(
                `Failed to fetch Production data for ${oa_number} / ${item_code}`
              );
            }
            // Fetch Stores data
            const storesResponse = await fetch(checkStoresUrl);
            const storesData = await storesResponse.json();
            // console.log("Stores Data:", storesData);

            let storesBackgroundColor = "red";
            if (storesResponse.ok && storesData) {
              const checks = [
                { key: "Stock Check", value: storesData.stockCheck },
                { key: "MIP", value: storesData.mip },
                { key: "Packing", value: storesData.packing },
                { key: "Delivery", value: storesData.delivery },
                { key: "BOM", value: storesData.bom },
                { key: "MRN", value: storesData.mrn },
              ];

              // Count the number of `false` values
              const falseItems = checks.filter((check) => !check.value);
              storesTooltip = falseItems.map((item) => item.key).join(", ");
              if (falseItems.length === 0) {
                storesBackgroundColor = "green";
                storesTooltip = "";
              } else if (falseItems.length <= 5) {
                storesBackgroundColor = "yellow";
              }
            } else {
              console.error(
                `Failed to fetch Stores data for ${oa_number} / ${item_code}`
              );
            }

            // Fetch QC data
            const qcResponse = await fetch(checkQcUrl);
            const qcData = await qcResponse.json();
            // console.log("QC:", qcData);

            let qcBackgroundColor = "red";
            if (qcResponse.ok && qcData) {
              const checks = [
                {
                  key: "Specification Check",
                  value: qcData.specification_check,
                },
                { key: "Final QC", value: qcData.oqc },
              ];

              // Count the number of `false` values
              const falseItems = checks.filter((check) => !check.value);
              qcTooltip = falseItems.map((item) => item.key).join(", ");
              if (falseItems.length === 0) {
                qcBackgroundColor = "green";
                qcTooltip = "";
              } else if (falseItems.length <= 1) {
                qcBackgroundColor = "yellow";
              }
            } else {
              console.error(
                `Failed to fetch QC data for ${oa_number} / ${item_code}`
              );
            }

            // Fetch Accounts data
            const accountsResponse = await fetch(checkAccountsUrl);
            const accountsData = await accountsResponse.json();
            // console.log("Accounts Data:", accountsData);

            let accountsBackgroundColor = "red";
            if (accountsResponse.ok && accountsData) {
              const checks = [
                { key: "GST Number", value: accountsData.GSTNumber },
                {
                  key: "Statutory Details ",
                  value: accountsData.StatutoryDetails,
                },
                { key: "Terms of Payment", value: accountsData.TermsOfPayment },
                {
                  key: "Advance Recieved",
                  value: accountsData.AdvanceReceived,
                },
                { key: "Invoicing", value: accountsData.Invoicing },
              ];

              // Count the number of `false` values
              const falseItems = checks.filter((check) => !check.value);
              accountsTooltip = falseItems.map((item) => item.key).join(", ");
              if (falseItems.length === 0) {
                accountsBackgroundColor = "green";
                accountsTooltip = "";
              } else if (falseItems.length <= 1) {
                accountsBackgroundColor = "yellow";
              }
            } else {
              console.error(
                `Failed to fetch Accounts data for ${oa_number} / ${item_code}`
              );
            }
            // Create a new table row
            const tableRow = document.createElement("tr");

            // Add row details (oa_number and customer_name)
            let rowDetails = "";
            // console.log("Current dates",new Date());
            if (new Date(delivery_date) < currentDate) {
            console.log("True");
            rowDetails = `<td style="border: none; color: red;">${oa_number} - ${customer_name} - ${item_code}</td>`;
            } else {
            console.log("False");
            rowDetails = `<td style="border: none;">${oa_number} - ${customer_name} - ${item_code}</td>`;
            }

            // const rowDetails = `<td style="border: none;">${oa_number} - ${customer_name} - ${item_code}</td>`;

            // Create a tooltip div for Sales column
            const salesColumn = `<td style="background-color: ${salesBackgroundColor}; border: none;" title="${salesTooltip}"></td>`;
            // Add the "Purchase" column with the appropriate color
            const purchaseColumn = `<td style="background-color: ${purchaseBackgroundColor}; border: none;" title="${purchaseTooltip}"></td>`;

            // Add the "R&D" column with the appropriate color
            const rndColumn = `<td style="background-color: ${rndBackgroundColor}; border: none;" title="${rndTooltip}"></td>`;

            // Add the "Production" column with the appropriate color
            const productionColumn = `<td style="background-color: ${productionBackgroundColor}; border: none;" title="${productionTooltip}"></td>`;

            // Add the "Stores" column with the appropriate color
            const storesColumn = `<td style="background-color: ${storesBackgroundColor}; border: none;" title="${storesTooltip}"></td>`;

            // Add the "QC" column with the appropriate color
            const qcColumn = `<td style="background-color: ${qcBackgroundColor}; border: none;" title="${qcTooltip}"></td>`;

            // Add the "Accounts" column with the appropriate color
            const accountsColumn = `<td style="background-color: ${accountsBackgroundColor}; border: none;" title="${accountsTooltip}"></td>`;

            // Combine the row details and the columns
            tableRow.innerHTML =
              rowDetails +
              salesColumn +
              purchaseColumn +
              rndColumn +
              productionColumn +
              storesColumn +
              qcColumn +
              accountsColumn;

            // Append the row to the table body
            tableBody.appendChild(tableRow);
          } catch (error) {
            console.error(
              `Error fetching data for ${oa_number} / ${item_code}: ${error.message}`
            );
          }
        }
      }
      function updatePaginationControls() {
        paginationControls.innerHTML = "";

        const prevButton = document.createElement("button");
        prevButton.textContent = "Previous";
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener("click", () => {
          currentPage--;
          renderTable(currentPage);
          updatePaginationControls();
        });

        const nextButton = document.createElement("button");
        nextButton.textContent = "Next";
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener("click", () => {
          currentPage++;
          renderTable(currentPage);
          updatePaginationControls();
        });

        paginationControls.appendChild(prevButton);

        const pageIndicator = document.createElement("span");
        pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
        paginationControls.appendChild(pageIndicator);

        paginationControls.appendChild(nextButton);
      }

      // Function to filter rows based on search input
      function filterTable() {
        const query = document.getElementById("search-bar").value.toLowerCase();
        filteredRows = data.rows
          .filter(
            (row) =>
              row.oa_number.toLowerCase().includes(query) ||
              row.item_code.toLowerCase().includes(query) ||
              row.customer_name.toLowerCase().includes(query)
          )
          .sort((a, b) => new Date(b.oa_date) - new Date(a.oa_date));

        currentPage = 1; // Reset to first page after filtering
        renderTable(currentPage);
        updatePaginationControls();
      }

      // Add event listener to search bar
      document
        .getElementById("search-bar")
        .addEventListener("input", filterTable);

      // Initial render
      renderTable(currentPage);
      updatePaginationControls();
    } else {
      console.error("Failed to fetch team data: ", response.statusText);
    }
  } catch (error) {
    console.error("Error fetching team data:", error.message);
  }
}
// Helper functions for date formatting
// let year, month, day;

// function formatDate(dateString) {
//   if (!dateString) return ""; // Return empty string for null or undefined dates
//   const date = new Date(dateString);
//   day = date.getDate().toString().padStart(2, "0");
//   month = (date.getMonth() + 1).toString().padStart(2, "0");
//   year = date.getFullYear();
//   return `${day}-${month}-${year}`;
// }

// let yeardb, monthdb, daydb;

// function formatDatedb(dateString) {
//   if (!dateString) return ""; // Return empty string for null or undefined dates
//   const date = new Date(dateString);
//   daydb = date.getDate().toString().padStart(2, "0");
//   monthdb = (date.getMonth() + 1).toString().padStart(2, "0");
//   yeardb = date.getFullYear();
//   return `${day}-${month}-${year}`;
// }
