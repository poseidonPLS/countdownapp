import React, { useState, useEffect, useMemo } from "react";
import "./App.css";

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({});
  const targetDate = useMemo(() => new Date(Date.UTC(2024, 4, 13, 0, 0, 0)), []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const currentDate = new Date();
      const difference = targetDate - currentDate;
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        targetDate.setFullYear(targetDate.getFullYear() + 1);
      }
    };

    const intervalId = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // Initial call

    return () => clearInterval(intervalId);
  }, [targetDate]);

  return (
    <div className="countdown-container">
      <h1 className="countdown-header">PulseChain Anniversary</h1>
      <div className="countdown-clock">
        <div className="clock-row">
          <span className="clock-digit">{timeLeft.days || 0}</span>
          <span className="clock-label">Days</span>
        </div>
        <div className="clock-row">
          <span className="clock-digit">{timeLeft.hours || 0}</span>
          <span className="clock-label">Hours</span>
        </div>
        <div className="clock-row">
          <span className="clock-digit">{timeLeft.minutes || 0}</span>
          <span className="clock-label">Mins</span>
        </div>
        <div className="clock-row">
          <span className="clock-digit">{timeLeft.seconds || 0}</span>
          <span className="clock-label">Seconds</span>
        </div>
      </div>
    </div>
  );
}

export default Countdown;
