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
    const now = new Date();
    timeInput.value = now.toISOString().slice(0, 16);

    // Fetch the 10 most recent logs
    chrome.storage.local.get({ logs: [] }, (data) => {
        const logs = data.logs;
        if (logs.length > 0) {
            // Get the last 10 logs (or fewer if not enough)
            const recentLogs = logs.slice(LOGS_TO_DISPLAY * -1).reverse(); // Reverse to get most recent first
            spawnLogs(recentLogs);
        }
    });

    // When form is submitted
    logForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const activity = activityInput.value.trim();
        const ticket = ticketInput.value.trim() || "other";
        const time = timeInput.value;
        const duration = durationInput.value.trim();
        const durationRegex = /^(\d+)([hHmMwy])$/;
        const match = duration.match(durationRegex);
        let durationInMinutes = 0;

        if (match) {
            const value = parseInt(match[1], 10);
            const unit = match[2].toLowerCase();
            durationInMinutes = stringToMinutes(value, unit);
        } else {
            alert("Invalid duration format. Use '1h', '30m', etc.");
            return;
        }

        chrome.storage.local.get({ logs: [], tickets: [] }, (data) => {
            const logs = data.logs;
            const tickets = new Set(data.tickets || []);
            tickets.add(ticket);

            chrome.storage.local.set({
                logs: [...logs, { activity, time, ticket, "duration": durationInMinutes }],
                tickets: [...tickets]
            }, () => {
                alert("Log saved successfully!");
                logForm.reset();
            });
        });
    });

    // Populate ticket suggestions
    chrome.storage.local.get({ tickets: [] }, (data) => {
        const ticketSuggestions = document.getElementById("ticketSuggestions");
        data.tickets.forEach(ticket => {
            const option = document.createElement("option");
            option.value = ticket;
            ticketSuggestions.appendChild(option);
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

function appendLog(log) {
    console.log(logItems.length);
    const index = logItems.length;
    const template = document.getElementById("logTemplate");
    // Clone the template
    const logClone = template.cloneNode(true);
    logClone.style.display = "block";
    logClone.id = `log_${index}`; // Unique ID for each log

    const fields = logClone.childNodes;
    console.log("Fields: ", fields);
    fields[1].value = log.ticket;
    fields[3].value = log.activity;
    let timeFields = fields[5].childNodes;
    console.log("Time fields: ", timeFields);
    timeFields[1].value = minutesToString(log.duration);
    timeFields[3].value = log.time;
    timeFields[5].addEventListener("click", () => {
        useLog(index);
    });

    logItems.push(log);

    // Append the cloned log to the container
    previousLogsContainer.appendChild(logClone);
}

// Fill the log into the logForm
function useLog(index) {
    console.log("Clicked ", index, logItems[index]);

    const log = logItems[index];

    activityInput.value = log.activity;
    ticketInput.value = log.ticket;
    durationInput.value = minutesToString(log.duration);
}