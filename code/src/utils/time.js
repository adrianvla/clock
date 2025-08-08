import fetch from 'node-fetch';


function changeTimeZone(zone) {
    // Store the selected timezone globally
    global.selectedTimeZone = zone;
    
    // Re-sync time with the new timezone
    syncTimeForZone(zone);
    
    console.log(`Timezone changed to: ${zone}`);
}

// Helper function to sync time for a specific timezone
async function syncTimeForZone(timezone = 'Etc/UTC') {
    try {
        console.log(`Synchronizing time for timezone: ${timezone}`);
        
        // Fetch time from World Time API for specific timezone
        const response = await fetch(`https://timeapi.io/api/Time/current/zone?timeZone=${timezone}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const timeData = await response.json();
        
        // Parse the server time for the specific timezone
        const utcTime = new Date(timeData.dateTime);
        const localTime = new Date();
        
        // Calculate timezone offset from UTC
        global.timezoneOffset = timeData.utc_offset;
        global.timeOffset = utcTime.getTime() - localTime.getTime();
        console.log('Time difference from UTC:', global.timeOffset, 'ms');
        
        console.log(`Time synchronization completed for ${timezone}`);
        
    } catch (error) {
        console.error(`Failed to synchronize time for ${timezone}:`, error.message);
        
        // Fallback to UTC if specific timezone fails
        if (timezone !== 'Etc/UTC') {
            console.log('Falling back to UTC timezone');
            await syncTimeForZone('Etc/UTC');
        } else {
            // If even UTC fails, use the original fallback API
            try {
                const fallbackResponse = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=UTC');
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    const serverTime = new Date(fallbackData.dateTime);
                    const localTime = new Date();
                    global.timeOffset = serverTime.getTime() - localTime.getTime();
                    global.timezoneOffset = '+00:00';
                    console.log('Time synchronized using fallback API');
                }
            } catch (fallbackError) {
                console.error('All time sync attempts failed:', fallbackError.message);
                global.timeOffset = 0;
                global.timezoneOffset = '+00:00';
            }
        }
    }
}


function getTime(){
    // Use synchronized time if available, otherwise fall back to local time
    const timeOffset = global.timeOffset || 0;
    const selectedTimeZone = global.selectedTimeZone || 'Etc/UTC';
    
    let d;
    
    // If we have a selected timezone, use it to format the time
    if (global.selectedTimeZone && global.selectedTimeZone !== 'Etc/UTC') {
        // Create date with UTC time + offset, then format in the selected timezone
        d = new Date(Date.now() + timeOffset);
        
        // Use Intl.DateTimeFormat for proper timezone handling
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: selectedTimeZone,
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            weekday: 'long'
        });
        
        const parts = formatter.formatToParts(d);
        const partsObj = {};
        parts.forEach(part => {
            partsObj[part.type] = part.value;
        });
        
        return {
            hours: partsObj.hour,
            minutes: partsObj.minute,
            seconds: partsObj.second,
            date: partsObj.day,
            dayOfWeek: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(partsObj.weekday.toLowerCase()),
            fullDate: d,
            timezone: selectedTimeZone,
            formattedTime: `${partsObj.hour}:${partsObj.minute}:${partsObj.second}`,
            formattedDate: `${partsObj.year}-${partsObj.month}-${partsObj.day}`
        };
    } else {
        // Default UTC/local time handling
        d = new Date(Date.now() + timeOffset);
        
        let h = String(d.getHours()).padStart(2, '0');
        let m = String(d.getMinutes()).padStart(2, '0');
        let s = String(d.getSeconds()).padStart(2, '0');
        let day = String(d.getDate()).padStart(2, '0');
        let dofw = d.getDay();
        
        // Return an object with all time components
        return {
            hours: h,
            minutes: m,
            seconds: s,
            date: day,
            dayOfWeek: dofw,
            fullDate: d,
            timezone: selectedTimeZone,
            formattedTime: `${h}:${m}:${s}`,
            formattedDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${day}`
        };
    }
}


//synchronize time with server
async function syncTime(){
    // Use the selected timezone, or default to UTC
    const timezone = global.selectedTimeZone || 'Etc/UTC';
    await syncTimeForZone(timezone);
}
setInterval(syncTime, 1000 * 60 * 5); // every 5 minutes
changeTimeZone('Europe/Zurich'); 
syncTime();

export { getTime, changeTimeZone };