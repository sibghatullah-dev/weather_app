$(document).ready(() => {
    const currentWeather = JSON.parse(sessionStorage.getItem("current_weather"));
    const forecastData = JSON.parse(sessionStorage.getItem("forecast_weather"));

    if (currentWeather && forecastData) {
        $(".current_weathr_city_name").text(currentWeather.city_name);
        populateTable(forecastData);

        $("#apply-filter").click(() => {
            const selectedFilter = $("#filter-select").val();
            let filteredData;

            switch (selectedFilter) {
                case "asc":
                    filteredData = [...forecastData].sort((a, b) => a.temperature - b.temperature);
                    break;
                case "desc":
                    filteredData = [...forecastData].sort((a, b) => b.temperature - a.temperature);
                    break;
                case "rain":
                    filteredData = forecastData.filter(day => day.weather_condition.toLowerCase().includes('rain'));
                    break;
                case "highest":
                    const highestTempDay = forecastData.reduce((max, day) => day.temperature > max.temperature ? day : max);
                    filteredData = [highestTempDay];
                    break;
                default:
                    filteredData = forecastData;
                    break;
            }
            populateTable(filteredData);
        });

        $("#reset").click(() => {
            $("#filter-select").val('');
            populateTable(forecastData);
        });
    } else {
        alert("No weather data found. Please go to the Dashboard to get weather information.");
    }
});

function populateTable(data) {
    let tableBody = $("#weather_table_body");
    tableBody.empty();

    const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];

    for (let i = 0; i < data.length; i++) {
        const iconUrl = `http://openweathermap.org/img/wn/${data[i].weather_icon}@2x.png`;
        console.log(`Icon URL: ${iconUrl}`);
        
        let row = `<tr>
            <td>${labels[i]}</td>
            <td>${data[i].temperature.toFixed(1)}°C</td>
            <td>${data[i].weather_condition}</td>
            <td><img src="${iconUrl}" alt="Weather Icon" width="50" height="50"></td>
        </tr>`;
        console.log(row);
        tableBody.append(row);
    }
}

