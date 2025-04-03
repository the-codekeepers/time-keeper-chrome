// background.js

// Function to create the hourly alarm
function createAlarm() {
    chrome.alarms.create("hourlyLogger", {
        when: Date.now(), // Start immediately
        periodInMinutes: 60 // Repeat every hour
    });
}

// Listen for alarm triggers
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "hourlyLogger") {
        sendNotification();
    }
});

// Function to send a notification
function sendNotification() {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 10 && hour <= 18) { // Only notify between 10 AM - 6 PM
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: "Hourly Check-In",
            message: "What did you do this past hour?",
            priority: 2,
            buttons: [{ title: "Log Activity" }]
        });
    }
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId) => {
    if (notificationId) {
        chrome.tabs.create({ url: "log.html" }); // Open log page
    }
});

chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});


// Create alarm when extension is installed/updated
chrome.runtime.onInstalled.addListener(createAlarm);
