
let selectedMonth = new Date().getMonth(); // Current month (1-12)
let logs = [];
document.addEventListener("DOMContentLoaded", () => {
        loadLogs().then((logs) => {
            console.log("Loaded Logs: ", logs);
            generateDays();
            generateTimesheet(logs);
        });
    });

function generateDays() {
    const headerRow = document.getElementById("headerRow");
    const days = daysInMonth(new Date().getMonth() + 1, new Date().getFullYear());

    for (let day = 1; day <= days; day++) {
        const th = document.createElement("th");
        th.textContent = day;
        th.classList.add("day-cell");
        headerRow.appendChild(th);
    }

    generateTimesheet(logs);
}

function generateTimesheet(tickets) {
    console.log("Generating timesheet with tickets: ", tickets);
    const timesheetBody = document.getElementById("timesheetBody");
    timesheetBody.innerHTML = ""; // Clear existing rows

    Object.keys(tickets).forEach(ticketName => {
        const activities = tickets[ticketName];
        const rowCount = activities.length;

        activities.forEach((activity, index) => {
            const tr = document.createElement("tr");

            // Create the ticket cell only once per group
            if (index === 0) {
                const ticketCell = document.createElement("td");
                ticketCell.textContent = ticketName;
                ticketCell.classList.add("ticket-cell");
                ticketCell.rowSpan = rowCount;
                tr.appendChild(ticketCell);
            }

            // Create the activity cell
            const activityCell = document.createElement("td");
            activityCell.textContent = activity.activity;
            activityCell.classList.add("activity-cell");
            tr.appendChild(activityCell);

            // Generate day cells (1 to 31)
            for (let day = 1; day <= 31; day++) {
                const td = document.createElement("td");
                const logDate = new Date(activity.time);
                const logDay = logDate.getDate();

                if (logDay === day) {
                    td.textContent = activity.duration;
                } else {
                    td.textContent = "";
                }
                
                td.classList.add("day-cell");
                tr.appendChild(td);
            }

            timesheetBody.appendChild(tr);
        });
    });
}


function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
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
                        const existingDuration = parseInt(existingEntry.duration.replace(/\D/g, "")) || 0;
                        const newDuration = parseInt(log.duration.replace(/\D/g, "")) || 0;
                        const totalDuration = existingDuration + newDuration;
                        existingEntry.duration = `${totalDuration}h`; // Update the duration (assuming hours for simplicity)
                    } else {
                        // If not, push the new log entry
                        acc[ticket].push(log);
                    }

                    return acc;
                }, {});

            console.log("Sorted Logs: ", logs);
            resolve(logs);
        });
    });
}




