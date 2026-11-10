function toggleDropdown(menuId) {
    const menu = document.getElementById(menuId);
    const allMenus = document.querySelectorAll(".dropdown-content");

    // Other dropdowns close kar
    allMenus.forEach(function (item) {
        if (item.id !== menuId) {
            item.classList.remove("show");
        }
    });

    // Selected dropdown toggle kar
    menu.classList.toggle("show");
}

 const electronicsSearch = document.getElementById("electronicsSearch");

    electronicsSearch.addEventListener("keyup", function () {
        const searchValue = this.value.toLowerCase();

        const rows = document.querySelectorAll(
            "#electronicsTable tbody tr"
        );

        rows.forEach(function (row) {
            const rowText = row.innerText.toLowerCase();

            row.style.display = rowText.includes(searchValue)
                ? ""
                : "none";
        });
    });


    const beautySearch = document.getElementById("beautySearch");

    beautySearch.addEventListener("keyup", function () {

        const searchValue = this.value.toLowerCase();

        const rows = document.querySelectorAll(
            "#beautyTable tbody tr"
        );

        rows.forEach(function (row) {

            const rowText = row.innerText.toLowerCase();

            row.style.display = rowText.includes(searchValue)
                ? ""
                : "none";

        });

    });
    const homelivingSearch = document.getElementById("homelivingSearch");

    homelivingSearch.addEventListener("keyup", function () {

        const searchValue = this.value.toLowerCase();

        const rows = document.querySelectorAll(
            "#homelivingTable tbody tr"
        );

        rows.forEach(function (row) {

            const rowText = row.innerText.toLowerCase();

            row.style.display = rowText.includes(searchValue)
                ? ""
                : "none";

        });

    });

 // =====================COUNT CONTER ANIMATION========================
  

// ==========================================================================
