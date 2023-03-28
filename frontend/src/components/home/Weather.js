import React, { useState, useEffect } from "react";
import axios from "axios";

const Weather = () => {
    const [lat, lon] = [37.5642135, 127.0016985];
    const [weather, setWeather] = useState(null);

    useEffect(() => {
        const getWeather = async () => {
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_WEATHER_API}&units=metric`
            );
            setWeather(response.data);
        };
        getWeather();
    }, [lat, lon]);

    if (weather !== null) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: "30px",
                }}
            >
                <img
                    src={`http://openweathermap.org/img/w/${weather.weather[0].icon}.png`}
                    style={{
                        width: "35px",
                        height: "35px",
                    }}
                    alt="weather icon"
                ></img>
                &nbsp;{weather.weather[0].main}
                &nbsp;, {weather.main.temp} °C
            </div>
        );
    } else {
        return <div>loading...</div>;
    }
};

export default Weather;
