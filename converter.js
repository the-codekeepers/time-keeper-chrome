const durationConversion = {
    "m": 1,
    "h": 60,
    "d": 60 * 24,
    "w": 60 * 24 * 7,
    "M": 60 * 24 * 30,
    "y": 60 * 24 * 365
};

/**
 * Convert a duration string to minutes.
 * @param {string} duration - The duration string (e.g., "1h", "30m", etc.)
 * @param {string} unit - The unit of the duration (e.g., "h", "m", "d", "w", "M", "y")
 * @returns {number} The duration in minutes.
 */
function stringToMinutes(duration, unit) {
    return duration * durationConversion[unit];
}

/**
 * 
 * @param {number} minutes 
 * @returns {string} A string representation of the duration in a human-readable format (e.g., "1h30m", "2d3h", etc.)
 */
function minutesToString(minutes) {
    const units = Object.keys(durationConversion).reverse(); // Start with largest unit (y -> M -> w -> d -> h -> m)
    let result = "";
    let remainingMinutes = minutes;

    for (let unit of units) {
        const unitMinutes = durationConversion[unit];
        const unitValue = Math.floor(remainingMinutes / unitMinutes);

        if (unitValue > 0) {
            result += `${unitValue}${unit}`;
            remainingMinutes %= unitMinutes;
        }
    }

    return result || "0m"; // Return "0m" if minutes is 0
}

function minutesToHour(minutes) {
    return (minutes / 60).toFixed(4); // Rounds to 4 decimal places
}
