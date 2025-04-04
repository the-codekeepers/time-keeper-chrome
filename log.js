const LOGS_TO_DISPLAY = 5; // Number of logs to display in the recent log section
const logItems = [];

let logForm;
let activityInput;
let timeInput;
let ticketInput;
let durationInput;
let previousLogsContainer;

document.addEventListener("DOMContentLoaded", () => {
    logForm = document.getElementById("logForm");
    activityInput = document.getElementById("form-activity");
    timeInput = document.getElementById("form-time");
    ticketInput = document.getElementById("form-ticket");
    durationInput = document.getElementById("form-duration");
    previousLogsContainer = document.getElementById("previous");

    // Set default time to the current time, down to the minute
    setTimeNow();
    // Fetch the 10 most recent logs
    chrome.storage.local.get({ logs: [] }, (data) => {
        const logs = data.logs;
        if (logs.length > 0) {
            // Get the last 10 logs (or fewer if not enough)
            const recentLogs = logs.slice(LOGS_TO_DISPLAY * -1).reverse(); // Reverse to get most recent first
            spawnLogs(recentLogs);

            prefillDuration(logs); // Pre-fill the duration field based on the most recent log
        }
    });

    // When form is submitted
    logForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const activity = activityInput.value.trim();
        const ticket = ticketInput.value.trim() || "other";

        // Convert local time to UTC
        const localTime = new Date(timeInput.value);
        const utcTime = new Date(localTime.getTime() - localTime.getTimezoneOffset() * 60000).toISOString();

        const duration = durationInput.value.trim();

        // Updated regex to match multiple unit-value pairs
        const durationRegex = /(\d+)([hHmMwy])/g;
        let match;
        let durationInMinutes = 0;

        // Parse each unit-value pair and calculate the total duration in minutes
        while ((match = durationRegex.exec(duration)) !== null) {
            const value = parseInt(match[1], 10);
            const unit = match[2].toLowerCase();
            durationInMinutes += stringToMinutes(value, unit);
        }

        if (durationInMinutes === 0 || isNaN(durationInMinutes)) {
            alert("Invalid duration format. Use '1h', '30m', or combinations like '1h20m'.");
            return;
        }

        chrome.storage.local.get({ logs: [], tickets: [] }, (data) => {
            const logs = data.logs;
            const log = { activity, time: utcTime, ticket, duration: durationInMinutes };
            const tickets = new Set(data.tickets || []);
            tickets.add(ticket);

            chrome.storage.local.set({
                logs: [...logs, log],
                tickets: [...tickets]
            }, () => {
                appendLog(log, true);
                logForm.reset();
                setTimeNow(); // Reset time to now after submission
            });
        });
    });
});

// Function to spawn logs
function spawnLogs(logs) {
    console.log("Spawning logs: ", logs);
    const template = document.getElementById("logTemplate");
    template.style.display = "none";

    logs.forEach((log) => {
        appendLog(log);
    });
}

function appendLog(log, isNew = false) {
    const index = logItems.length;
    const template = document.getElementById("logTemplate");
    const logClone = template.cloneNode(true);
    logClone.style.display = "block";
    logClone.id = `log_${index}`;

    const fields = logClone.childNodes;
    fields[1].value = log.ticket;
    fields[3].value = log.activity;

    let timeFields = fields[5].childNodes;
    timeFields[1].value = minutesToString(log.duration);

    // Convert UTC time to local time for display
    const localTime = new Date(log.time).toLocaleString("sv-SE", {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });

    timeFields[3].value = localTime;

    timeFields[5].addEventListener("click", () => {
        useLog(index);
    });

    logItems.push(log);

    if (isNew) {
        previousLogsContainer.insertBefore(logClone, previousLogsContainer.firstChild);
    } else {
        previousLogsContainer.appendChild(logClone);
    }
}

// Fill the log into the logForm
function useLog(index) {
    console.log("Clicked ", index, logItems[index]);

    const log = logItems[index];

    activityInput.value = log.activity;
    ticketInput.value = log.ticket;
    durationInput.value = minutesToString(log.duration);
}

// Function to pre-fill the duration field
function prefillDuration(logs) {
    const today = new Date().toISOString().slice(0, 10); // Get today's date in UTC
    const todayLogs = logs.filter(log => log.time.startsWith(today)); // Filter logs for today

    if (todayLogs.length > 0) {
        // Get the most recent log for today
        const lastLog = todayLogs.reduce((latest, log) => {
            return new Date(log.time) > new Date(latest.time) ? log : latest;
        });

        // Calculate the time difference in minutes
        const now = new Date();
        const lastLogTime = new Date(lastLog.time);
        const diffInMinutes = Math.floor((now - lastLogTime) / 60000); // Convert milliseconds to minutes

        // Pre-fill the duration field
        if (diffInMinutes > 0) {
            durationInput.value = minutesToString(diffInMinutes); // Set the duration in minutes
        }
    }
}

function setTimeNow() {
    const now = new Date();
    const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000) // Adjust for timezone offset
        .toISOString()
        .slice(0, 16); // Format as YYYY-MM-DDTHH:mm
    timeInput.value = localTime;
}