$(document).ready(function () {
    // Add an input event listener to the search input
    $("#searchInput").on("input", function () {
       // Get the search input value
       var searchValue = $(this).val().toLowerCase();
 
       // Filter the table rows based on the search value
       $("#teamDataTable tbody tr").filter(function () {
          $(this).toggle($(this).text().toLowerCase().indexOf(searchValue) > -1);
       });

       // Set table-layout to fixed to keep row width static
       $("#teamDataTable").css("table-script", "fixed");
       $("#teamDataTable").css("completed-script", "fixed");

    });
});
