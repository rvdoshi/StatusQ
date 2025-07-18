//   import { pastDueRowCount } from './constants';
            let pastDueRowCount = 0;

            async function fetchAndPopulateTable() {
                try {
                   const response = await fetch('http://103.113.142.236:3002/api/team_data');
                   const data = await response.json();
 
                   if (response.ok) {
                      const tableBody = document.getElementById('tableBody');
                      const orderCategoryFilter = document.getElementById('orderCategoryFilter');
                      const selectedCategory = orderCategoryFilter.value;
                      console.log(selectedCategory);
 
                      tableBody.innerHTML = '';
                      orderCategoryFilter.innerHTML = '<option value="">All Order Categories</option>';
 
                      const uniqueOrderCategories = [...new Set(data.rows.map(row => row.order_category))];
                      uniqueOrderCategories.forEach(category => {
                         const option = document.createElement('option');
                         option.value = category;
                         option.textContent = category;
                         orderCategoryFilter.appendChild(option);
                      });
                      pastDueRowCount = 0;
                      data.rows.forEach((row, index) => {
                         const tableRow = document.createElement('tr');
 
                         // Check if the delivery_date has passed and apply the appropriate class
                         const currentDate = new Date();
                         const rowColorClass = formatDate(row.delivery_date) < formatDate(currentDate) ? 'past-due-row' : '';
 
                         if (rowColorClass === 'past-due-row') {
                         pastDueRowCount++;
                         }
                         // console.log(pastDueRowCount)
 
                         tableRow.className = rowColorClass;
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
                     <td>${formatDate(row.sales_late_clause)}</td>
                     <td>${formatDate(row.sales_mail)}</td>
                     <td>${row.purchase_shortage || ''}</td>
                     <td>${row.purchase_price_hike || ''}</td>
                     <td>${row.purchase_material_delay ? 'Yes' : ' '}</td>
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
                 `;
                         tableBody.appendChild(tableRow);
                      });
 
                   // Update the count in the HTML element with the ID 'countValue'
                   document.getElementById('countValue').innerHTML = pastDueRowCount;
 
                   } else {
                      console.error('Error fetching team data:', data.error);
                   }
                } catch (error) {
                   console.error('Error fetching team data:', error.message);
                }
             }
 
             
 
             window.addEventListener('load', fetchAndPopulateTable);
 
             // Add an event listener to handle changes in the selected order category
             document.getElementById('orderCategoryFilter').addEventListener('change', function () {
                applyCategoryFilter();
             });
 
             // Add event listener to handle horizontal scroll
             document.getElementById('teamDataTable').addEventListener('scroll', function () {
                const tableBody = document.getElementById('tableBody');
                const fixedColumn = document.querySelector('.fixed-column');
 
                if (tableBody.scrollTop === 0) {
                   fixedColumn.style.transform = 'translateY(0)';
                } else {
                   fixedColumn.style.transform = `translateY(-${tableBody.scrollTop}px)`;
                }
             });
 
 
             window.addEventListener('load', fetchAndPopulateTable);
 
             // Add event listener to handle horizontal scroll
             document.getElementById('teamDataTable').addEventListener('scroll', function () {
                const tableBody = document.getElementById('tableBody');
                const fixedColumn = document.querySelector('.fixed-column');
 
                if (tableBody.scrollTop === 0) {
                   fixedColumn.style.transform = 'translateY(0)';
                } else {
                   fixedColumn.style.transform = `translateY(-${tableBody.scrollLeft}px)`;
                }
             });
 
             function formatDate(dateString) {
                if (!dateString) return ''; // Return empty string for null or undefined dates
                const date = new Date(dateString);
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                return `${day}-${month}-${year}`;
             }
 
             function applyCategoryFilter() {
                fetchAndPopulateTable();
             }
 
             // Inside fetchAndPopulateTable
             const oaNumberBody = document.getElementById('oaNumberBody');
             oaNumberBody.innerHTML = '';
 
             data.rows.forEach((row, index) => {
                const oaNumberRow = document.createElement('tr');
                oaNumberRow.innerHTML = `<td>${row.oa_number}</td>`;
                oaNumberBody.appendChild(oaNumberRow);
             });