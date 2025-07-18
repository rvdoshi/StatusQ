'use strict';

async function fetchTotalBalanceAmountOfPendingOrders() {
   try {
       const response = await fetch('http://localhost:3002/api/team_data');
       const data = await response.json();

       if (response.ok) {
           // Filter the rows based on pending orders, excluding those with accounts_invoicing or complete
           const pendingOrders = data.rows.filter(row => {
               // Exclude rows where accounts_invoicing or complete is not null
               if (row.accounts_invoicing !== null || row.complete !== null) {
                   return false;
               }

               // Include rows where the delivery_date is in the future
               return row.delivery_date && new Date(row.delivery_date) > new Date();
           });

           // Calculate the total balance amount of pending orders
           const totalBalanceAmount = pendingOrders.reduce((total, row) => {
               return total + parseFloat(row.balance_amount) || 0; // Ensure the value is numeric
           }, 0);

           return totalBalanceAmount;
       } else {
           console.error('Error fetching team data:', data.error);
           return null;
       }
   } catch (error) {
       console.error('Error fetching team data:', error.message);
       return null;
   }
}


// Example usage:
async function processTotalBalanceAmountOfPendingOrders() {
    const totalBalanceAmountOfPendingOrders = await fetchTotalBalanceAmountOfPendingOrders();

    if (totalBalanceAmountOfPendingOrders !== null) {
        // Format totalBalanceAmountOfPendingOrders as currency (INR)
        const formattedTotalBalance = totalBalanceAmountOfPendingOrders.toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        });

        // Update the HTML element with the formatted total balance amount
        document.getElementById('totalbalancePendingOrders').innerHTML = formattedTotalBalance;

        // Log the formatted total balance amount
        console.log('Total Balance Amount of Pending Orders:', formattedTotalBalance);
    } else {
        console.log('Failed to fetch total balance amount of pending orders.');
    }
}

// Call the function to fetch and process the total balance amount of pending orders
// processTotalBalanceAmountOfPendingOrders();

async function fetchPastDueOrderCount() {
    try {
       const response = await fetch('http://localhost:3002/api/team_data');
       const data = await response.json();

       if (response.ok) {
          const currentDate = new Date();

          const pastDueOrderCount = data.rows.reduce((count, row) => {
             const deliveryDate = new Date(row.delivery_date);
             //  return deliveryDate < currentDate ? count + 1 : count;
             const rowColorClass = formatDate(row.delivery_date) < formatDate(currentDate) ? count + 1 : count;
             console.log(rowColorClass);
             return rowColorClass
          }, 0);

          return pastDueOrderCount;
       } else {
          console.error('Error fetching team data:', data.error);
          return null;
       }
    } catch (error) {
       console.error('Error fetching team data:', error.message);
       return null;
    }
 }

 // Example usage:
 async function processPastDueOrderCount() {
    const pastDueOrderCount = await fetchPastDueOrderCount();
    document.getElementById('countValuerow').innerHTML = pastDueOrderCount;
 }

 // Call the function to fetch and process the past due order count
//  processPastDueOrderCount();

 async function fetchTotalBalanceAmount() {
    try {
       const response = await fetch('http://localhost:3002/api/team_data');
       const data = await response.json();

       if (response.ok) {
          // Calculate the total balance amount by summing up the 'balance_amount' property of each row
          const totalBalanceAmount = data.rows.reduce((total, row) => {
             return total + parseFloat(row.balance_amount) || 0; // Ensure the value is numeric
          }, 0);

          return totalBalanceAmount;
       } else {
          console.error('Error fetching team data:', data.error);
          return null;
       }
    } catch (error) {
       console.error('Error fetching team data:', error.message);
       return null;
    }
 }

 // Example usage:
 async function processTotalBalanceAmount() {
// const totalBalanceAmount = await fetchTotalBalanceAmount();

if (totalBalanceAmount !== null) {
   // Format totalBalanceAmount as currency (INR)
   const formattedTotalBalance = totalBalanceAmount.toLocaleString('en-IN', {
       style: 'currency',
       currency: 'INR',
       minimumFractionDigits: 2,
   });

   // Update the HTML element with the formatted total balance amount
   document.getElementById('totalbalance').innerHTML = formattedTotalBalance;

   // Log the formatted total balance amount
   console.log('Total Balance Amount:', formattedTotalBalance);
} else {
   console.log('Failed to fetch total balance amount.');
}
}

// Call the function to fetch and process the total balance amount
// processTotalBalanceAmount();

 var $window = $(window);
 var nav = $('.fixed-button');
 $window.scroll(function () {
    if ($window.scrollTop() >= 200) {
       nav.addClass('active');
    }
    else {
       nav.removeClass('active');
    }
 });    

 