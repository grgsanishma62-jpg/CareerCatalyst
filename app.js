
// MealShare Aldershot
// A simple browser-based donation tracker for the project prototype.

// Get the HTML elements
const donationForm = document.getElementById("donationForm");
const distributionForm = document.getElementById("distributionForm");
const donationTable = document.getElementById("donationTable");
const donationSelect = document.getElementById("donationSelect");
const exportButton = document.getElementById("exportButton");

// Load saved records from this browser
let donations = [];

try {
    donations = JSON.parse(localStorage.getItem("mealShareDonations")) || [];
} catch (error) {
    donations = [];
}

// Save records in this browser
function saveDonations() {
    localStorage.setItem("mealShareDonations", JSON.stringify(donations));
}

// Display the current year
document.getElementById("currentYear").textContent = new Date().getFullYear();

// Set today's date as the default donation date
document.getElementById("donationDate").value =
    new Date().toISOString().split("T")[0];

// Update the dashboard figures
function updateDashboard() {
    const donationCount = donations.length;

    const portionCount = donations.reduce((total, donation) => {
        return total + donation.portions;
    }, 0);

    const collectionCount = donations.filter(donation => {
        return donation.status === "collected";
    }).length;

    const distributedCount = donations.reduce((total, donation) => {
        return total + donation.distributed;
    }, 0);

    document.getElementById("donationCount").textContent = donationCount;
    document.getElementById("portionCount").textContent = portionCount;
    document.getElementById("collectionCount").textContent = collectionCount;
    document.getElementById("distributedCount").textContent = distributedCount;
}

// Display donation records in the table
function displayDonations() {
    donationTable.innerHTML = "";

    if (donations.length === 0) {
        donationTable.innerHTML = `
            <tr>
                <td colspan="5" class="empty-message">
                    No donations recorded yet.
                </td>
            </tr>
        `;
    } else {
        donations.forEach(donation => {
            const row = document.createElement("tr");

            const dateCell = document.createElement("td");
            dateCell.textContent = donation.date;

            const foodCell = document.createElement("td");
            foodCell.textContent = donation.food;

            const portionsCell = document.createElement("td");
            portionsCell.textContent = donation.portions;

            const statusCell = document.createElement("td");
            statusCell.textContent =
                donation.status === "collected" ? "Collected" : "Not collected";

            const distributedCell = document.createElement("td");
            distributedCell.textContent = donation.distributed;

            row.appendChild(dateCell);
            row.appendChild(foodCell);
            row.appendChild(portionsCell);
            row.appendChild(statusCell);
            row.appendChild(distributedCell);

            donationTable.appendChild(row);
        });
    }

    updateDashboard();
    updateDonationOptions();
}

// Update the donation dropdown
function updateDonationOptions() {
    donationSelect.innerHTML = "";

    if (donations.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No donation records yet";
        donationSelect.appendChild(option);
        return;
    }

    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = "Choose a donation";
    donationSelect.appendChild(firstOption);

    donations.forEach(donation => {
        const option = document.createElement("option");
        option.value = donation.id;
        option.textContent = `${donation.food} - ${donation.portions} portions`;
        donationSelect.appendChild(option);
    });
}

// Add a new donation
donationForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const food = document.getElementById("foodName").value.trim();
    const portions = Number(document.getElementById("foodPortions").value);
    const date = document.getElementById("donationDate").value;
    const notes = document.getElementById("foodNotes").value.trim();

    if (food === "" || portions < 1 || !Number.isInteger(portions) || date === "") {
        alert("Please enter a food description, a valid number of portions and a date.");
        return;
    }

    const newDonation = {
        id: Date.now().toString(),
        food: food,
        portions: portions,
        date: date,
        notes: notes,
        status: "not-collected",
        distributed: 0
    };

    donations.push(newDonation);

    saveDonations();
    displayDonations();

    donationForm.reset();
    document.getElementById("donationDate").value =
        new Date().toISOString().split("T")[0];

    alert("Donation record added successfully!");
});

// Update collection and distribution information
distributionForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const selectedId = donationSelect.value;
    const newStatus = document.getElementById("collectionStatus").value;
    const distributed = Number(
        document.getElementById("distributedPortions").value
    );

    const donation = donations.find(item => item.id === selectedId);

    if (!donation) {
        alert("Please select a donation first.");
        return;
    }

    if (
        !Number.isInteger(distributed) ||
        distributed < 0 ||
        distributed > donation.portions
    ) {
        alert("Please enter a valid number of distributed portions.");
        return;
    }

    if (distributed > 0 && newStatus !== "collected") {
        alert("Please mark the donation as collected before recording distribution.");
        return;
    }

    donation.status = newStatus;
    donation.distributed = distributed;

    saveDonations();
    displayDonations();

    distributionForm.reset();

    alert("Donation record updated successfully!");
});

// Export donation records as a CSV file
exportButton.addEventListener("click", function() {
    if (donations.length === 0) {
        alert("There are no donation records to export yet.");
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

    const rows = donations.map(donation => [
        donation.date,
        donation.food,
        donation.portions,
        donation.notes,
        donation.status,
        donation.distributed
    ]);

    function escapeCSV(value) {
        return `"${String(value).replace(/"/g, '""')}"`;
    }

    const csvContent = [
        headings.map(escapeCSV).join(","),
        ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    const file = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    const fileURL = URL.createObjectURL(file);

    link.href = fileURL;
    link.download = "mealshare-donation-records.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(fileURL);
});

// Show saved records when the page opens
displayDonations();
