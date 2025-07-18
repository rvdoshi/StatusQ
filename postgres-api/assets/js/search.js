$(document).ready(function () {
    // Add an input event listener to the search input
    $("#searchInput").on("input", function () {
       // Get the search input value
       var searchValue = $(this).val().toLowerCase();
 
       // Filter the table rows based on the search value
       $("#teamDataTable tbody tr").filter(function () {
          $(this).toggle($(this).text().toLowerCase().indexOf(searchValue) > -1);
       });
    });
 });
 