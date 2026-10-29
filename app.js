
const STORAGE_KEY = "mealshareAldershotDonations";

const donationForm = document.getElementById("donationForm");
const donationList = document.getElementById("donationList");
const formMessage = document.getElementById("formMessage");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const exportButton = document.getElementById("exportButton");
const recordCount = document.getElementById("recordCount");

let donations = loadDonations();

function loadDonations() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        const parsedData = savedData ? JSON.parse(savedData) : [];
        return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
        console.error("Could not load saved donations:", error);
        return [];
    }
}

function saveDonations() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(donations));
        return true;
    } catch (error) {
        console.error("Could not save donations:", error);
        formMessage.textContent =
            "Could not save the records. Your browser storage may be unavailable or full.";
        return false;
    }
}

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return Date.now().toString() + Math.random().toString(16).slice(2);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}

function getDonationStatus(donation) {
    if (donation.distributed >= donation.quantity) {
        return "Distributed";
    }

    if (donation.distributed > 0) {
        return "Partially distributed";
    }

    if (donation.collected >= donation.quantity) {
        return "Collected";
    }

    return "Available";
}

function getStatusClass(status) {
    if (status === "Collected") {
        return "collected";
    }

    if (status === "Distributed") {
        return "distributed";
    }

    if (status === "Partially distributed") {
        return "partial";
    }

    return "";
}

function formatDeadline(value) {
    if (!value) {
        return "No deadline entered";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function updateStatistics() {
    const total = donations.reduce(
        (sum, donation) => sum + donation.quantity,
        0
    );

    const collected = donations.reduce(
        (sum, donation) => sum + donation.collected,
        0
    );

    const distributed = donations.reduce(
        (sum, donation) => sum + donation.distributed,
        0
    );

    const waiting = donations.reduce(
        (sum, donation) => sum + Math.max(
            0,
            donation.quantity - donation.collected
        ),
        0
    );

    document.getElementById("totalPortions").textContent = total;
    document.getElementById("collectedPortions").textContent = collected;
    document.getElementById("distributedPortions").textContent = distributed;
    document.getElementById("waitingPortions").textContent = waiting;

    recordCount.textContent =
        donations.length + (donations.length === 1 ? " record" : " records");
}

function renderDonations() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    const filteredDonations = donations.filter(function (donation) {
        const searchableText = [
            donation.foodName,
            donation.allergens,
            donation.notes
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchTerm);
        const status = getDonationStatus(donation);
        const matchesStatus =
            selectedStatus === "all" || status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    updateStatistics();

    if (filteredDonations.length === 0) {
        donationList.innerHTML = `
            <div class="empty-state">
                <span>🥬</span>
                <h3>No matching donations</h3>
                <p>Add a donation or change your search and filter.</p>
            </div>
        `;
        return;
    }

    donationList.innerHTML = filteredDonations.map(function (donation) {
        const status = getDonationStatus(donation);
        const statusClass = getStatusClass(status);
        const remainingToCollect = Math.max(
            0,
            donation.quantity - donation.collected
        );
        const remainingToDistribute = Math.max(
            0,
            donation.collected - donation.distributed
        );

        return `
            <article class="donation-item">
                <div class="donation-top">
                    <div>
                        <h4>${escapeHTML(donation.foodName)}</h4>
                        <p class="donation-meta">
                            ${donation.quantity} portions offered
                        </p>
                    </div>
                    <span class="status-badge ${statusClass}">
                        ${escapeHTML(status)}
                    </span>
                </div>

                <p class="donation-meta">
                    <strong>Deadline:</strong>
                    ${escapeHTML(formatDeadline(donation.deadline))}
                </p>

                <p class="donation-meta">
                    <strong>Collected:</strong>
                    ${donation.collected} of ${donation.quantity}
                    &nbsp;·&nbsp;
                    <strong>Distributed:</strong>
                    ${donation.distributed} of ${donation.quantity}
                </p>

                <p class="donation-meta">
                    <strong>Allergens/dietary:</strong>
                    ${escapeHTML(donation.allergens || "Not recorded")}
                </p>

                ${
                    donation.notes
                        ? `<p class="donation-meta"><strong>Notes:</strong> ${escapeHTML(donation.notes)}</p>`
                        : ""
                }

                <div class="donation-actions">
                    ${
                        remainingToCollect > 0
                            ? `<button class="action-button" type="button"
                                data-action="collect" data-id="${escapeHTML(donation.id)}">
                                Record collection
                            </button>`
                            : ""
                    }

                    ${
                        remainingToDistribute > 0
                            ? `<button class="action-button" type="button"
                                data-action="distribute" data-id="${escapeHTML(donation.id)}">
                                Record distribution
                            </button>`
                            : ""
                    }

                    <button class="action-button danger" type="button"
                        data-action="delete" data-id="${escapeHTML(donation.id)}">
                        Delete record
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

donationForm.addEventListener("submit", function (event) {
    event.preventDefault();
    formMessage.textContent = "";

    const foodName = document.getElementById("foodName").value.trim();
    const quantity = Number(document.getElementById("quantity").value);
    const deadline = document.getElementById("deadline").value;
    const allergens = document.getElementById("allergens").value.trim();
    const notes = document.getElementById("notes").value.trim();

    if (!foodName) {
        formMessage.textContent = "Please enter the food name.";
        return;
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
        formMessage.textContent = "Enter a whole number of portions between 1 and 10,000.";
        return;
    }

    if (!deadline || Number.isNaN(new Date(deadline).getTime())) {
        formMessage.textContent = "Please enter a valid collection deadline.";
        return;
    }

    const donation = {
        id: createId(),
        foodName: foodName,
        quantity: quantity,
        deadline: deadline,
        allergens: allergens,
        notes: notes,
        collected: 0,
        distributed: 0,
        createdAt: new Date().toISOString()
    };

    donations.unshift(donation);

    if (!saveDonations()) {
        donations.shift();
        return;
    }

    donationForm.reset();
    formMessage.textContent = "Donation saved successfully.";
    renderDonations();
});

donationList.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const id = button.dataset.id;

    const donation = donations.find(function (item) {
        return item.id === id;
    });

    if (!donation) {
        return;
    }

    if (action === "collect") {
        const remaining = donation.quantity - donation.collected;

        const answer = prompt(
            "How many portions have actually been collected?\n" +
            "Remaining to collect: " + remaining,
            String(remaining)
        );

        if (answer === null) {
            return;
        }

        const amount = Number(answer);

        if (!Number.isInteger(amount) || amount < 1 || amount > remaining) {
            alert("Enter a whole number between 1 and " + remaining + ".");
            return;
        }

        donation.collected += amount;

        if (!saveDonations()) {
            donation.collected -= amount;
            return;
        }

        renderDonations();
    }

    if (action === "distribute") {
        const remaining = donation.collected - donation.distributed;

        const answer = prompt(
            "How many collected portions have been distributed?\n" +
            "Available to distribute: " + remaining,
            String(remaining)
        );

        if (answer === null) {
            return;
        }

        const amount = Number(answer);

        if (!Number.isInteger(amount) || amount < 1 || amount > remaining) {
            alert("Enter a whole number between 1 and " + remaining + ".");
            return;
        }

        donation.distributed += amount;

        if (!saveDonations()) {
            donation.distributed -= amount;
            return;
        }

        renderDonations();
    }

    if (action === "delete") {
        const confirmed = confirm(
            "Delete the record for \"" + donation.foodName + "\"? This cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        const previousDonations = donations;
        donations = donations.filter(function (item) {
            return item.id !== id;
        });

        if (!saveDonations()) {
            donations = previousDonations;
            return;
        }

        renderDonations();
    }
});

searchInput.addEventListener("input", renderDonations);
statusFilter.addEventListener("change", renderDonations);

function csvEscape(value) {
    const text = String(value ?? "");
    return '"' + text.replace(/"/g, '""') + '"';
}

exportButton.addEventListener("click", function () {
    if (donations.length === 0) {
        alert("There are no donation records to export yet.");
        return;
    }

    const headers = [
        "Food name",
        "Portions offered",
        "Collection deadline",
        "Allergens and dietary information",
        "Notes",
        "Portions collected",
        "Portions distributed",
        "Status",
        "Created at"
    ];

    const rows = donations.map(function (donation) {
        return [
            donation.foodName,
            donation.quantity,
            donation.deadline,
            donation.allergens,
            donation.notes,
            donation.collected,
            donation.distributed,
            getDonationStatus(donation),
            donation.createdAt
        ];
    });

    const csvContent = [headers, ...rows]
        .map(function (row) {
            return row.map(csvEscape).join(",");
        })
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "mealshare-aldershot-donations.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
});

renderDonations();
