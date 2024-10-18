$(document).ready(() => {
    let city_name;
    const size = 5;
    const day = Array(size);
    let useCelsius = true;
    let toggle = 0;
    let barChart, doughnutChart, lineChart;

    const storedWeather = sessionStorage.getItem("current_weather");
    const storedForecast = sessionStorage.getItem("forecast_weather");

    if (storedWeather && storedForecast) {
        const currentWeather = JSON.parse(storedWeather);
        const forecastWeather = JSON.parse(storedForecast);
        updateCurrentWeather(currentWeather);
        $(".input_city_name").val(currentWeather.city_name);
    } else {
        if (navigator.geolocation) {
            $(".loading-spinner").show();
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                sessionStorage.setItem("latitude", lat);
                sessionStorage.setItem("longitude", lon);
                getWeatherByCoordinates(lat, lon);
            }, error => {
                $(".loading-spinner").hide();
                alert("Unable to retrieve your location. Please enter a city name.");
            });
        } else {
            alert("Geolocation is not supported by your browser. Please enter a city name.");
        }
    }

    $(".get_weather_btn").click(() => {
        getWeatherForCity();
    });

    $(".use_location_btn").click(() => {
        if (navigator.geolocation) {
            $(".loading-spinner").show();
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                sessionStorage.setItem("latitude", lat);
                sessionStorage.setItem("longitude", lon);
                getWeatherByCoordinates(lat, lon);
            }, error => {
                $(".loading-spinner").hide();
                alert("Unable to retrieve your location. Please enter a city name.");
            });
        } else {
            alert("Geolocation is not supported by your browser. Please enter a city name.");
        }
    });

    $("#unit-toggle-checkbox").change(function () {
        useCelsius = !this.checked;
        toggle++;
        $(".toggle-label").text(useCelsius ? "°C" : "°F");
        updateTemperatureDisplay();
    });

    function getWeatherForCity() {
        city_name = $(".input_city_name").val().trim();
        if (city_name !== "") {
            sessionStorage.setItem("city_name", city_name);
            $(".loading-spinner").show();
            fetchWeatherData(city_name);
        } else {
            alert("Please enter a city name");
        }
    }

    function getWeatherByCoordinates(lat, lon) {
        $(".loading-spinner").show();
        fetch(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=a3c465eae11858fb8b48dc40aba8295a&units=metric`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(json => {
                city_name = json.name;
                $(".input_city_name").val(city_name);
                sessionStorage.setItem("city_name", city_name);
                fetchWeatherData(city_name);
            })
            .catch(error => {
                $(".loading-spinner").hide();
                alert("Error fetching weather data. Please try again.");
                console.error('Error:', error);
            });
    }

    function fetchWeatherData(city) {
        Promise.all([
            fetch(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=a3c465eae11858fb8b48dc40aba8295a&units=metric`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=7849d8e054118639a18ecde5c36a24d6&units=metric`)
        ])
        .then(([currentResponse, forecastResponse]) => {
            if (!currentResponse.ok || !forecastResponse.ok) {
                throw new Error('Network response was not ok');
            }
            return Promise.all([currentResponse.json(), forecastResponse.json()]);
        })
        .then(([currentJson, forecastJson]) => {
            let current_weather = fetch_current_weather(currentJson);
            updateCurrentWeather(current_weather);
            console.log(current_weather);

            sessionStorage.setItem("current_weather", JSON.stringify(current_weather));

            for (let i = 0; i < size; i++) {
                day[i] = fetch_weather_forecast(forecastJson, i);
            }

            sessionStorage.setItem("forecast_weather", JSON.stringify(day));
            createCharts(day);
            $(".loading-spinner").hide();
        })
        .catch(error => {
            $(".loading-spinner").hide();
            alert("Error fetching weather data. Please try again.");
            console.error('Error:', error);
        });
    }

    function updateCurrentWeather(weather) {
        $(".current_weather_city_name").text(weather.city_name);
        $(".current_weather_temperature").text(formatTemperature(weather.temperature));
        $(".current_weather_humidity").text(weather.humidity + "%");
        $(".current_weather_wind_speed").text(weather.wind_speed + " m/s");
        $(".current_weather_description").text(weather.weather_description);
        $(".current_weather_icon").attr("src", `http://openweathermap.org/img/wn/${weather.weather_icon}@2x.png`);
    }

    function fetch_current_weather(json) {
        const city_name = json.name;
        const temperature = json.main.temp;
        const humidity = json.main.humidity;
        const wind_speed = json.wind.speed.toFixed(1);
        const weather_description = json.weather[0].description;
        const weather_icon = json.weather[0].icon;
        return { city_name, temperature, humidity, wind_speed, weather_description, weather_icon };
    }

    function fetch_weather_forecast(json, i) {
        const temperature = json.list[i * 8].main.temp;
        const weather_condition = json.list[i * 8].weather[0].main;
        const weather_icon = json.list[i * 8].weather[0].icon;
        return { temperature, weather_condition, weather_icon };
    }

    function formatTemperature(temp) {
        let formattedTemp;
        if (!useCelsius) {
            formattedTemp = (temp * 9 / 5) + 32;
        } else {
            formattedTemp = temp;
        }
        return formattedTemp.toFixed(1) + (useCelsius ? "°C" : "°F");
    }

    function updateTemperatureDisplay() {
        let currentTemp = parseFloat($(".current_weather_temperature").text());
        $(".current_weather_temperature").text(formatTemperature(currentTemp));
        createCharts(day);
    }

    function createCharts(day) {
                const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];
                
                const temperatures = day.map(d => useCelsius ? d.temperature : (d.temperature * 9/5) + 32);
                
                const barData = {
                    labels: labels,
                    datasets: [{
                        label: `Temperature Forecast (${useCelsius ? '°C' : '°F'})`,
                        data: temperatures,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(255, 159, 64, 0.2)',
                            'rgba(255, 205, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                        ],
                        borderColor: [
                            'rgb(255, 99, 132)',
                            'rgb(255, 159, 64)',
                            'rgb(255, 205, 86)',
                            'rgb(75, 192, 192)',
                            'rgb(54, 162, 235)',
                        ],
                        borderWidth: 1
                    }]
                };
            
                const weatherConditions = day.map(d => d.weather_condition);
                const uniqueConditions = [...new Set(weatherConditions)];
                const conditionCounts = uniqueConditions.map(cond => weatherConditions.filter(c => c === cond).length);
            
                const doughnutData = {
                    labels: uniqueConditions,
                    datasets: [{
                        label: 'Weather Conditions',
                        data: conditionCounts,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.5)',
                            'rgba(54, 162, 235, 0.5)',
                            'rgba(255, 206, 86, 0.5)',
                            'rgba(75, 192, 192, 0.5)',
                            'rgba(153, 102, 255, 0.5)'
                        ],
                        borderColor: [
                            'rgb(255, 99, 132)',
                            'rgb(54, 162, 235)',
                            'rgb(255, 206, 86)',
                            'rgb(75, 192, 192)',
                            'rgb(153, 102, 255)'
                        ],
                        borderWidth: 1
                    }]
                };
            
                const lineData = {
                    labels: labels,
                    datasets: [{
                        label: `Temperature Over Time (${useCelsius ? '°C' : '°F'})`,
                        data: temperatures,
                        fill: false,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                };
            
                const commonOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            font: {
                                size: 16
                            }
                        }
                    }
                };
        
                const barConfig = {
                    type: 'bar',
                    data: barData,
                    options: {
                        ...commonOptions,
                        plugins: {
                            ...commonOptions.plugins,
                            title: {
                                ...commonOptions.plugins.title,
                                text: 'Temperature Forecast'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: `Temperature (${useCelsius ? '°C' : '°F'})`
                                }
                            }
                        }
                    }
                };
            
                const doughnutConfig = {
                    type: 'doughnut',
                    data: doughnutData,
                    options: {
                        ...commonOptions,
                        plugins: {
                            ...commonOptions.plugins,
                            title: {
                                ...commonOptions.plugins.title,
                                text: 'Weather Conditions'
                            }
                        }
                    }
                };
            
                const lineConfig = {
                    type: 'line',
                    data: lineData,
                    options: {
                        ...commonOptions,
                        plugins: {
                            ...commonOptions.plugins,
                            title: {
                                ...commonOptions.plugins.title,
                                text: 'Temperature Over Time'
                            }
                        }
                    }
                };

                if (barChart) barChart.destroy();
                if (doughnutChart) doughnutChart.destroy();
                if (lineChart) lineChart.destroy();

                barChart = new Chart($('#chart1'), barConfig);
                doughnutChart = new Chart($('#chart2'), doughnutConfig);
                lineChart = new Chart($('#chart3'), lineConfig);
            }
});
