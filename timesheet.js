let selectedMonth = new Date().getMonth(); // Current month (1-12)
let logs = [];
document.addEventListener("DOMContentLoaded", () => {
    loadLogs().then((logs) => {
        generateDays();
        generateTimesheet(logs);
    });
});

function generateDays() {
    const headerRow = document.getElementById("headerRow");
    const summaryRow = document.getElementById("summaryRow");
    const currentDate = new Date();
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const days = daysInMonth(month, year);

    for (let day = 1; day <= days; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.toLocaleDateString("en-GB", { weekday: "short" });

        // Create header cell for the day
        const dayTh = document.createElement("th");
        dayTh.classList.add("day-cell", "day-header");
        if (isWeekend(date.getDay())) {
            dayTh.classList.add("weekend");
        }
        dayTh.innerHTML = `<div class="day-name">${dayOfWeek}</div><div class="day-number">${day}</div>`;
        headerRow.appendChild(dayTh);

        // Create corresponding summary cell above for this day
        const summaryCell = document.createElement("td");
        if(isWeekend(date.getDay())) {
            summaryCell.classList.add("weekend");
        }
        // Format the date as YYYY-MM-DD for the ID;
        summaryCell.id = `summary_${day}`;
        summaryCell.textContent = ""; // Set a default value or leave blank
        summaryRow.appendChild(summaryCell);
    }

    // Add the "Total" column to the header row
    const totalThHeader = document.createElement("th");
    totalThHeader.textContent = "Total";
    totalThHeader.classList.add("total-cell");
    headerRow.appendChild(totalThHeader);

    // Add the "Total" column to the summary row
    const totalThSummary = document.createElement("td");
    totalThSummary.textContent = "0h"; // Default total summary value
    totalThSummary.classList.add("total-cell");
    summaryRow.appendChild(totalThSummary);
}

function generateTimesheet(tickets) {
    const timesheetBody = document.getElementById("timesheetBody");
    timesheetBody.innerHTML = ""; // Clear existing rows
    const summaryRow = document.getElementById("summaryRow");

    // Initialize an object to store total time logged for each day
    const dailyTotals = {};

    if (Object.keys(tickets).length === 0) {
        createEmptyRow(timesheetBody);
        return;
    }

    Object.keys(tickets).forEach(ticketName => {
        processTicket(ticketName, tickets[ticketName], dailyTotals, timesheetBody);
    });

    updateSummaryRow(dailyTotals);
}

// Create an empty row when no tickets are available
function createEmptyRow(timesheetBody) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.textContent = "No logs available for this month.";
    td.colSpan = daysInMonth(selectedMonth, new Date().getFullYear()) + 3; // Adjusted for ticket, activity, and total columns
    tr.appendChild(td);
    timesheetBody.appendChild(tr);
}

// Process a single ticket and its activities
function processTicket(ticketName, activities, dailyTotals, timesheetBody) {
    const rowCount = activities.length;
    let ticketTotal = 0;

    // Sum up the total duration for the ticket and update daily totals
    activities.forEach(activity => {
        ticketTotal += activity.duration ?? 0;
        updateDailyTotals(activity, dailyTotals);
    });

    // Create ticket and total cells
    const ticketCell = createTicketCell(ticketName, rowCount);
    const totalTd = createTotalCell(ticketTotal, rowCount);

    // Generate rows for activities
    activities.forEach((activity, index) => {
        const tr = document.createElement("tr");

        // Append the ticket cell only to the first row
        if (index === 0) {
            tr.appendChild(ticketCell);
        }

        // Append the activity cell
        const activityCell = createActivityCell(activity);
        tr.appendChild(activityCell);

        // Append day cells
        appendDayCells(activity, tr);

        // Append the total cell only to the first row
        if (index === 0) {
            tr.appendChild(totalTd);
        }

        // Append the row to the table body
        timesheetBody.appendChild(tr);
    });
}

// Update daily totals for a specific activity
function updateDailyTotals(activity, dailyTotals) {
    const logDate = new Date(activity.time);
    const logDay = logDate.getDate();

    if (!dailyTotals[logDay]) {
        dailyTotals[logDay] = 0;
    }
    dailyTotals[logDay] += activity.duration ?? 0;
}

// Create the ticket cell
function createTicketCell(ticketName, rowCount) {
    const ticketCell = document.createElement("td");
    ticketCell.textContent = ticketName;
    ticketCell.classList.add("ticket-cell");
    ticketCell.rowSpan = rowCount;
    return ticketCell;
}

// Create the total time cell
function createTotalCell(ticketTotal, rowCount) {
    const totalTd = document.createElement("td");
    totalTd.rowSpan = rowCount;
    totalTd.textContent = `${minutesToHour(ticketTotal)}h`;
    totalTd.classList.add("total-cell");
    return totalTd;
}

// Create the activity cell
function createActivityCell(activity) {
    const activityCell = document.createElement("td");
    activityCell.innerHTML = activity.activity.replace(/\n/g, "<br>"); // Replace newlines with <br> tags for HTML display
    activityCell.classList.add("activity-cell");
    return activityCell;
}

// Append day cells for an activity
function appendDayCells(activity, tr) {
    for (let day = 1; day <= daysInMonth(selectedMonth, new Date().getFullYear()); day++) {
        const td = document.createElement("td");
        const logDate = new Date(activity.time);
        const logDay = logDate.getDate();

        // Log the time spent on the activity for the day
        if (logDay === day) {
            td.textContent = `${minutesToHour(activity.duration)}h`;
        } else {
            td.textContent = "";
        }

        // Check if the day is a weekend
        const thisDate = new Date(new Date().getFullYear(), selectedMonth, day);
        if (isWeekend(thisDate.getDay())) {
            td.classList.add("weekend");
        }

        td.classList.add("day-cell");
        tr.appendChild(td);
    }
}

// Update the summary row with daily totals
function updateSummaryRow(dailyTotals) {
    Object.keys(dailyTotals).forEach(day => {
        const summaryCell = document.getElementById(`summary_${day}`);
        if (summaryCell) {
            if(isWeekend(new Date(new Date().getFullYear(), selectedMonth, day).getDay())) {
                summaryCell.classList.add("weekend");
            }
            summaryCell.textContent = `${minutesToHour(dailyTotals[day])}h`;
        }
    });
}

function daysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
}

function loadLogs() {
    return new Promise((resolve) => {
        const monthSelect = document.getElementById("monthSelect") || { value: new Date().getMonth() };
        const selectedMonth = parseInt(monthSelect.value) || new Date().getMonth();

        chrome.storage.local.get({ logs: [] }, (data) => {
            const logs = data.logs
                .filter((log) => {
                    const logDate = new Date(log.time).getMonth();
                    return logDate === selectedMonth;
                })
                .reduce((acc, log) => {
                    const ticket = log.ticket || "other";
                    const activity = log.activity || "unknown";
                    const logDate = new Date(log.time).toLocaleDateString();

                    // Initialize if ticket doesn't exist
                    if (!acc[ticket]) {
                        acc[ticket] = [];
                    }

                    // Check if the same activity on the same day already exists
                    const existingEntry = acc[ticket].find(
                        (entry) => entry.activity === activity && new Date(entry.time).toLocaleDateString() === logDate
                    );

                    if (existingEntry) {
                        // Add up the duration if it's the same activity on the same day
                        const existingDuration = existingEntry.duration || 0;
                        const newDuration = log.duration || 0;
                        const totalDuration = existingDuration + newDuration; //duration in minutes

                        existingEntry.duration = totalDuration; // Update the duration in minutes
                    } else {
                        // If not, push the new log entry
                        acc[ticket].push(log);
                    }
                    return acc;
                }, {});

            resolve(logs);
        });
    });
}

function isWeekend(day) {
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

