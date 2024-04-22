import React, { useState, useEffect, useMemo } from "react";
import "./App.css";

function Countdown() {
  const [year, setYear] = useState(1);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const targetDate = useMemo(() => {
    return new Date(Date.UTC(2024, 4, 13, 0, 0, 0));
  }, []); // Empty dependency array

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentDate = new Date();
      const difference = targetDate - currentDate;
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setDays(days);
      setHours(hours);
      setMinutes(minutes);
      setSeconds(seconds);

      if (difference <= 0) {
        setYear(year + 1);
        targetDate.setFullYear(targetDate.getFullYear() + 1);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [year, targetDate]);

  return (
    <div className="countdown-container">
      <h1 className="countdown-header">PulseChain {year}st Year Anniversary</h1>
      <div className="countdown-clock">
        <div className="clock-row">
          <span className="clock-digit">{days}</span>
          <span className="clock-label">Days</span>
        </div>
        <div className="clock-row">
          <span className="clock-digit">{hours}</span>
          <span className="clock-label">Hours</span>
        </div>
        <div className="clock-row">
          <span className="clock-digit">{minutes}</span>
          <span className="clock-label">Mins</span>
        </div>
        <div className="clock-row">
          <span className="clock-digit">{seconds}</span>
          <span className="clock-label">Seconds</span>
        </div>
      </div>
    </div>
  );
}

export default Countdown;