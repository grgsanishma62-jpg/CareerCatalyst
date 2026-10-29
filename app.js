
// MealShare Aldershot
// Browser-based donation tracker and mobile navigation.

// Get HTML elements
const donationForm = document.getElementById("donationForm");
const distributionForm = document.getElementById("distributionForm");
const donationTable = document.getElementById("donationTable");
const donationSelect = document.getElementById("donationSelect");
const exportButton = document.getElementById("exportButton");

const menuToggle = document.getElementById("menuToggle");
const navigation = document.getElementById("navigation");

// Load saved records from this browser
let donations = [];

try {
    const saved = JSON.parse(
        localStorage.getItem("mealShareDonations")
    );

    donations = Array.isArray(saved) ? saved : [];
} catch (error) {
    donations = [];
}

// Save records in this browser
function saveDonations() {
    try {
        localStorage.setItem(
            "mealShareDonations",
            JSON.stringify(donations)
        );
    } catch (error) {
        alert(
            "Your browser could not save this record. " +
            "Please check your browser storage settings."
        );
    }
}

// Display the current year
document.getElementById("currentYear").textContent =
    new Date().getFullYear();

// Get today's date using the local calendar
function getLocalDate() {
    const today = new Date();

    const offset = today.getTimezoneOffset();

    return new Date(
        today.getTime() - offset * 60000
    ).toISOString().slice(0, 10);
}

// Set today's date in the donation form
document.getElementById("donationDate").value =
    getLocalDate();


// MOBILE NAVIGATION

menuToggle.addEventListener("click", function () {
    const isOpen = navigation.classList.toggle("open");

    menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
    );

    menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
    );

    menuToggle.textContent = isOpen ? "×" : "☰";
});

// Close the mobile menu after clicking a navigation link
navigation.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
        navigation.classList.remove("open");

        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");

        menuToggle.textContent = "☰";
    });
});


// UPDATE DASHBOARD TOTALS

function updateDashboard() {
    // Count donation records
    const donationCount = donations.length;

    // Add up all portions offered
    const portionCount = donations.reduce(function (total, donation) {
        return total + Number(donation.portions || 0);
    }, 0);

    // Count completed collections
    const collectionCount = donations.filter(function (donation) {
        return donation.status === "collected";
    }).length;

    // Add up all portions distributed
    const distributedCount = donations.reduce(function (total, donation) {
        return total + Number(donation.distributed || 0);
    }, 0);

    document.getElementById("donationCount").textContent =
        donationCount;

    document.getElementById("portionCount").textContent =
        portionCount;

    document.getElementById("collectionCount").textContent =
        collectionCount;

    document.getElementById("distributedCount").textContent =
        distributedCount;
}


// DISPLAY DONATION HISTORY

function displayDonations() {
    // Clear the current table
    donationTable.replaceChildren();

    if (donations.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "empty-message";
        cell.textContent =
            "No records yet. Your entries will appear here.";

        row.appendChild(cell);
        donationTable.appendChild(row);

    } else {
        // Show the most recent date first
        const sortedDonations = [...donations].sort(function (a, b) {
            return b.date.localeCompare(a.date);
        });

        sortedDonations.forEach(function (donation) {
            const row = document.createElement("tr");

            const values = [
                donation.date,
                donation.food,
                donation.portions,
                donation.status === "collected"
                    ? "Collected"
                    : "Not collected",
                donation.distributed
            ];

            values.forEach(function (value) {
                const cell = document.createElement("td");

                // Use textContent to display user-entered text safely
                cell.textContent = value ?? "";

                row.appendChild(cell);
            });

            donationTable.appendChild(row);
        });
    }

    updateDashboard();
    updateDonationOptions();
}


// UPDATE THE DONATION DROPDOWN

function updateDonationOptions() {
    donationSelect.replaceChildren();

    const placeholder = document.createElement("option");

    placeholder.value = "";

    placeholder.textContent = donations.length > 0
        ? "Choose a donation"
        : "No donation records yet";

    donationSelect.appendChild(placeholder);

    donations.forEach(function (donation) {
        const option = document.createElement("option");

        option.value = donation.id;

        option.textContent =
            `${donation.food} — ${donation.portions} portions (${donation.date})`;

        donationSelect.appendChild(option);
    });
}


// ADD A NEW DONATION

donationForm.addEventListener("submit", function (event) {
    // Stop the page from refreshing
    event.preventDefault();

    const food = document
        .getElementById("foodName")
        .value.trim();

    const portions = Number(
        document.getElementById("foodPortions").value
    );

    const date =
        document.getElementById("donationDate").value;

    const notes = document
        .getElementById("foodNotes")
        .value.trim();

    // Validate the form
    if (
        food === "" ||
        !Number.isInteger(portions) ||
        portions < 1 ||
        date === ""
    ) {
        alert(
            "Please enter a food description, a valid whole number " +
            "of portions and a date."
        );

        return;
    }

    // Create a new donation record
    const newDonation = {
        id: Date.now().toString() +
            "-" + Math.random().toString(16).slice(2),

        food: food,
        portions: portions,
        date: date,
        notes: notes,
        status: "not-collected",
        distributed: 0
    };

    // Add the record to the array
    donations.push(newDonation);

    // Save and refresh the page content
    saveDonations();
    displayDonations();

    // Clear the form
    donationForm.reset();

    document.getElementById("donationDate").value =
        getLocalDate();

    alert("Donation record saved.");
});


// UPDATE COLLECTION AND DISTRIBUTION

distributionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const selectedId = donationSelect.value;

    const status =
        document.getElementById("collectionStatus").value;

    const distributed = Number(
        document.getElementById("distributedPortions").value
    );

    // Find the selected donation
    const donation = donations.find(function (item) {
        return item.id === selectedId;
    });

    if (!donation) {
        alert("Please choose a donation record first.");
        return;
    }

    // Check the distributed portion count
    if (
        !Number.isInteger(distributed) ||
        distributed < 0 ||
        distributed > donation.portions
    ) {
        alert(
            `Enter a whole number between 0 and ${donation.portions}.`
        );

        return;
    }

    // Food must be collected before distribution is recorded
    if (distributed > 0 && status !== "collected") {
        alert(
            "Mark the donation as collected before recording " +
            "portions shared."
        );

        return;
    }

    // Update the existing record
    donation.status = status;
    donation.distributed = distributed;

    // Save the changes
    saveDonations();
    displayDonations();

    // Reset the update form
    distributionForm.reset();

    document.getElementById("distributedPortions").value = "0";

    alert("Donation record updated.");
});


// EXPORT DONATION HISTORY AS A CSV FILE

exportButton.addEventListener("click", function () {
    if (donations.length === 0) {
        alert("There are no records to export yet.");
        return;
    }

    const headings = [
        "Date",
        "Food",
        "Portions",
        "Notes",
        "Collection Status",
        "Distributed Portions"
    ];

    // Escape commas, quotation marks and other CSV-sensitive text
    function escapeCSV(value) {
        return `"${String(value ?? "").replace(/"/g, '""')}"`;
    }

    const rows = donations.map(function (donation) {
        return [
            donation.date,
            donation.food,
            donation.portions,
            donation.notes,
            donation.status,
            donation.distributed
        ];
    });

    const csvContent = [
        headings,
        ...rows
    ].map(function (row) {
        return row.map(escapeCSV).join(",");
    }).join("\r\n");

    // Create the downloadable CSV file
    const file = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const fileURL = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = fileURL;
    link.download = "mealshare-donation-records.csv";

    document.body.appendChild(link);

    link.click();
    link.remove();

    URL.revokeObjectURL(fileURL);
});


// SHOW SAVED RECORDS WHEN THE WEBSITE OPENS

displayDonations();
