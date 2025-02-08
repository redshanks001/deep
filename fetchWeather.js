require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// OpenWeather API configuration
const openWeatherApiKey = process.env.OPENWEATHER_API_KEY;
const openWeatherUrl = 'https://api.openweathermap.org/data/2.5/weather';

async function fetchWeatherData(cityName) {
    try {
        const response = await axios.get(openWeatherUrl, {
            params: {
                q: cityName,
                appid: openWeatherApiKey,
                units: 'metric' // Use 'imperial' for Fahrenheit
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching weather data for ${cityName}:`, error.response ? error.response.data : error.message);
        return null;
    }
}

async function updateWeatherTable(districtId, weatherData) {
    const { data, error } = await supabase
        .from('weather')
        .upsert({
            district_id: districtId,
            temperature: weatherData.main.temp,
            humidity: weatherData.main.humidity,
            wind_speed: weatherData.wind.speed,
            wind_direction: weatherData.wind.deg,
            pressure: weatherData.main.pressure,
            visibility: weatherData.visibility,
            weather_desc: weatherData.weather[0].description,
            updated_at: new Date().toISOString()
        }, { onConflict: 'district_id' });

    if (error) {
        console.error(`Error updating weather data for district ${districtId}:`, error);
    } else {
        console.log(`Weather data for district ${districtId} updated successfully.`);
    }
}

async function main() {
    try {
        // Fetch all districts
        const { data: districts, error } = await supabase
            .from('districts')
            .select('id, name');

        if (error) {
            console.error('Error fetching districts:', error);
            return;
        }

        if (!districts || districts.length === 0) {
            console.error('No districts found.');
            return;
        }

        for (const district of districts) {
            console.log(`Fetching weather data for district: ${district.name}`);
            const weatherData = await fetchWeatherData(district.name);
            if (weatherData) {
                await updateWeatherTable(district.id, weatherData);
            }
        }
    } catch (error) {
        console.error('Error in main function:', error);
    }
}

main();
