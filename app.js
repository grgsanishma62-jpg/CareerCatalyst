
// ===== MEALSHARE FOOD TRACKER =====

// Find the elements on the page.
const donationForm = document.getElementById("donationForm");
const distributionForm = document.getElementById("distributionForm");
const donationTable = document.getElementById("donationTable");
const donationSelect = document.getElementById("donationSelect");
const exportButton = document.getElementById("exportButton");

// The tracker saves its records in this browser.
const STORAGE_KEY = "mealShareAldershotDonations";

// Load previously saved donations.
let donations = [];

try {
    const savedDonations = localStorage.getItem(STORAGE_KEY);

    if (savedDonations) {
        const parsedDonations = JSON.parse(savedDonations);

        if (Array.isArray(parsedDonations)) {
            donations = parsedDonations;
        }
    }
} catch (error) {
    console.error("Could not load saved donation records:", error);
    donations = [];
}

// ===== DATE AND PAGE SETUP =====

const yearElement = document.getElementById("currentYear");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

function getLocalDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

const dateInput = document.getElementById("donationDate");

if (dateInput) {
    dateInput.value = getLocalDate();
    dateInput.max = getLocalDate();
}

// ===== SAVE DATA =====

function saveDonations() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(donations));
        return true;
    } catch (error) {
        alert("The records could not be saved in this browser.");
        console.error("Could not save donation records:", error);
        return false;
    }
}

// ===== UPDATE DASHBOARD STATISTICS =====

function updateDashboard() {
    const totalDonations = donations.length;

    const totalPortions = donations.reduce((total, donation) => {
        return total + Number(donation.portions || 0);
    }, 0);

    const totalCollections = donations.filter((donation) => {
        return Number(donation.collected || 0) > 0;
    }).length;

    const totalDistributed = donations.reduce((total, donation) => {
        return total + Number(donation.distributed || 0);
    }, 0);

    document.getElementById("totalDonations").textContent =
        totalDonations;

    document.getElementById("totalPortions").textContent =
        totalPortions;

    document.getElementById("totalCollections").textContent =
        totalCollections;

    document.getElementById("totalDistributed").textContent =
        totalDistributed;
}

// ===== DISPLAY DONATION HISTORY =====

function displayDonations() {
    donationTable.replaceChildren();

    if (donations.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.className = "empty-message";
        cell.textContent = "No donation records yet.";

        row.appendChild(cell);
        donationTable.appendChild(row);

        return;
    }

    // Display the newest records first.
    const sortedDonations = [...donations].sort((a, b) => {
        return b.date.localeCompare(a.date);
    });

    sortedDonations.forEach((donation) => {
        const row = document.createElement("tr");

        const status =
            Number(donation.distributed || 0) > 0
                ? "Distributed"
                : Number(donation.collected || 0) > 0
                    ? "Collected"
                    : "Recorded";

        const values = [
            donation.date,
            donation.donor,
            donation.food,
            donation.portions,
            donation.collected || 0,
            donation.distributed || 0
        ];

        values.forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const statusCell = document.createElement("td");
        const statusLabel = document.createElement("span");

        statusLabel.className = "status-pill";

        if (status === "Distributed") {
            statusLabel.classList.add("collected");
        }

        statusLabel.textContent = status;
        statusCell.appendChild(statusLabel);
        row.appendChild(statusCell);

        donationTable.appendChild(row);
    });
}

// ===== UPDATE DONATION DROPDOWN =====

function updateDonationOptions() {
    donationSelect.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";

    defaultOption.textContent = donations.length > 0
        ? "Choose a donation"
        : "No donation records yet";

    donationSelect.appendChild(defaultOption);

    donations.forEach((donation) => {
        const option = document.createElement("option");

        option.value = donation.id;
        option.textContent =
            `${donation.donor} — ${donation.food} (${donation.portions} portions)`;

        donationSelect.appendChild(option);
    });
}

// ===== ADD A DONATION =====

donationForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const donor = document.getElementById("donorName").value.trim();
    const food = document.getElementById("foodItem").value.trim();
    const portions = Number(
        document.getElementById("portions").value
    );
    const date = dateInput.value;

    if (!donor || !food || !date) {
        alert("Please complete all donation fields.");
        return;
    }

    if (!Number.isInteger(portions) || portions < 1 || portions > 10000) {
        alert("Please enter a whole number of portions between 1 and 10,000.");
        return;
    }

    if (date > getLocalDate()) {
        alert("The donation date cannot be in the future.");
        return;
    }

    const donation = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        donor: donor,
        food: food,
        portions: portions,
        date: date,
        collected: 0,
        distributed: 0
    };

    donations.push(donation);

    if (!saveDonations()) {
        donations.pop();
        return;
    }

    donationForm.reset();
    dateInput.value = getLocalDate();

    refreshTracker();

    alert("Donation record added successfully.");
});

// ===== RECORD COLLECTION AND DISTRIBUTION =====

distributionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const donationId = donationSelect.value;

    const collectedInput = document.getElementById("collectedPortions");
    const distributedInput = document.getElementById("distributedPortions");

    const collected = Number(collectedInput.value);
    const distributed = Number(distributedInput.value);

    const donation = donations.find((item) => {
        return item.id === donationId;
    });

    if (!donation) {
        alert("Please select a donation first.");
        return;
    }

    if (
        !Number.isInteger(collected) ||
        !Number.isInteger(distributed) ||
        collected < 0 ||
        distributed < 0
    ) {
        alert("Please enter valid whole numbers.");
        return;
    }

    if (collected > Number(donation.portions)) {
        alert("Collected portions cannot exceed the donated portions.");
        return;
    }

    if (distributed > collected) {
        alert("Distributed portions cannot exceed collected portions.");
        return;
    }

    const previousCollected = donation.collected || 0;
    const previousDistributed = donation.distributed || 0;

    donation.collected = collected;
    donation.distributed = distributed;

    if (!saveDonations()) {
        donation.collected = previousCollected;
        donation.distributed = previousDistributed;
        return;
    }

    refreshTracker();

    alert("Collection and distribution record updated.");
});

// ===== EXPORT RECORDS AS CSV =====

exportButton.addEventListener("click", function () {
    if (donations.length === 0) {
        alert("There are no records to export yet.");
        return;
    }

    const headings = [
        "Date",
        "Donor",
        "Food",
        "Portions Donated",
        "Portions Collected",
        "Portions Distributed",
        "Status"
    ];

    const rows = donations.map((donation) => {
        const status =
            Number(donation.distributed || 0) > 0
                ? "Distributed"
                : Number(donation.collected || 0) > 0
                    ? "Collected"
                    : "Recorded";

        return [
            donation.date,
            donation.donor,
            donation.food,
            donation.portions,
            donation.collected || 0,
            donation.distributed || 0,
            status
        ];
    });

    // Escape commas, quotation marks and line breaks in CSV fields.
    function escapeCSV(value) {
        let textValue = String(value ?? "");

        // Prevent spreadsheet formula execution for text fields.
        if (/^[=+\-@]/.test(textValue)) {
            textValue = "'" + textValue;
        }

        return `"${textValue.replace(/"/g, '""')}"`;
    }

    const csvContent = [headings, ...rows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = "mealshare-donation-records.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(downloadUrl);
});

// ===== REFRESH THE WHOLE TRACKER =====

function refreshTracker() {
    updateDashboard();
    displayDonations();
    updateDonationOptions();
}

// Show saved records when the page opens.
refreshTracker();
