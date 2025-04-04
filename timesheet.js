
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
    const days = daysInMonth(new Date().getMonth(), new Date().getFullYear());

    for (let day = 1; day <= days; day++) {
        const th = document.createElement("th");

        // Get the day of the week (0 = Sunday, 6 = Saturday)
        const date = new Date(new Date().getFullYear(), new Date().getMonth(), day);
        const dayOfWeek = date.toLocaleDateString("en-GB", { weekday: "short" });


        th.classList.add("day-cell");

        // Weekend styling
        if (isWeekend(date.getDay())) {
            th.classList.add("weekend");
        }

        // Add day name and number
        th.classList.add("day-cell", "day-header");
        th.innerHTML = `<div class="day-name">${dayOfWeek}</div><div class="day-number">${day}</div>`;

        headerRow.appendChild(th);
    }

    // Add the "Total" column
    const totalTh = document.createElement("th");
    totalTh.textContent = "Total";
    totalTh.classList.add("total-cell");
    headerRow.appendChild(totalTh);
}

function generateTimesheet(tickets) {
    console.log("Generating timesheet with tickets: ", tickets);
    const timesheetBody = document.getElementById("timesheetBody");
    timesheetBody.innerHTML = ""; // Clear existing rows

    if (Object.keys(tickets).length === 0) {
        // Create a blank row if no tickets are present
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.textContent = "No logs available for this month.";
        td.colSpan = daysInMonth(selectedMonth, new Date().getFullYear()) + 3; // Adjusted for ticket, activity, and total columns
        tr.appendChild(td);
        timesheetBody.appendChild(tr);
        return;
    }

    Object.keys(tickets).forEach(ticketName => {
        const activities = tickets[ticketName];
        const rowCount = activities.length;
        let ticketTotal = 0; // Initialize ticket total time

        // Sum up the total duration for the ticket
        activities.forEach((activity) => {
            ticketTotal += activity.duration ?? 0; // Assuming duration is in minutes
        });

        // Create the ticket cell once
        const ticketCell = document.createElement("td");
        ticketCell.textContent = ticketName;
        ticketCell.classList.add("ticket-cell");
        ticketCell.rowSpan = rowCount;

        // Create the total time cell once
        const totalTd = document.createElement("td");
        totalTd.rowSpan = rowCount;
        totalTd.textContent = `${minutesToHour(ticketTotal)}h`;
        totalTd.classList.add("total-cell");

        activities.forEach((activity, index) => {
            const tr = document.createElement("tr");

            // Append the ticket cell only to the first row
            if (index === 0) {
                tr.appendChild(ticketCell);
            }

            // Create the activity cell
            const activityCell = document.createElement("td");
            activityCell.innerHTML = activity.activity.replace(/\n/g, "<br>"); // Replace newlines with <br> tags for HTML display
            activityCell.classList.add("activity-cell");
            tr.appendChild(activityCell);

            // Generate day cells (1 to 31)
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
                let thisDate = new Date(new Date().getFullYear(), selectedMonth, day);
                if (isWeekend(thisDate.getDay())) {
                    td.classList.add("weekend");
                }

                td.classList.add("day-cell");
                tr.appendChild(td);
            }

            // Append the total cell only to the first row
            if (index === 0) {
                tr.appendChild(totalTd);
            }

            // Append the entire row to the table body
            timesheetBody.appendChild(tr);
        });

        console.log("Ticket Total: ", ticketTotal);
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

                        console.log("existingDuration: ", existingEntry.duration, "newDuration: ", newDuration, "totalDuration: ", totalDuration);

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


function isWeekend(day) {
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

