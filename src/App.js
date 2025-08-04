import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import PulseChainMilestones from "./PulseChainMilestones";

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({});
  const [celebrationMode, setCelebrationMode] = useState(false);
  const [daysSinceLaunch, setDaysSinceLaunch] = useState(0);
  const [targetDate, setTargetDate] = useState(() => {
    const today = new Date();
    let anniversary = new Date(today.getFullYear(), 4, 13, 0, 0, 0); // May 13
    
    // If May 13 has passed this year, use next year
    if (today > anniversary) {
      anniversary = new Date(today.getFullYear() + 1, 4, 13, 0, 0, 0);
    }
    
    return anniversary;
  });

  const checkAnniversary = useCallback(() => {
    const today = new Date();
    const anniversary = new Date(today.getFullYear(), 4, 13);
    const daysDiff = Math.abs(today - anniversary) / (1000 * 60 * 60 * 24);
    const isAnniversaryWeek = daysDiff <= 3.5; // 7-day window
    
    // Also check if we're actually in the countdown period (difference <= 7 days)
    const difference = targetDate - today;
    const isCountdownNear = difference <= (7 * 24 * 60 * 60 * 1000) && difference > 0;
    
    return isAnniversaryWeek || isCountdownNear;
  }, [targetDate]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const currentDate = new Date();
      let target = new Date(targetDate);
      
      // Calculate days since PulseChain launch (May 13, 2023)
      const launchDate = new Date(2023, 4, 13, 0, 0, 0);
      const daysSince = Math.floor((currentDate - launchDate) / (1000 * 60 * 60 * 24));
      setDaysSinceLaunch(daysSince);
      
      // If May 13 has passed this year, use next year
      if (currentDate > target) {
        target = new Date(currentDate.getFullYear() + 1, 4, 13, 0, 0, 0);
        setTargetDate(target); // Update target date
      }
      
      const difference = target - currentDate;
      
      // Check if it's anniversary time
      const isAnniversary = checkAnniversary();
      setCelebrationMode(isAnniversary);
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        // Handle edge case - should rarely happen with above logic
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setCelebrationMode(true);
      }
    };

    const intervalId = setInterval(calculateTimeLeft, 1000); // Update every second
    calculateTimeLeft(); // Initial call

    return () => clearInterval(intervalId);
  }, [targetDate, checkAnniversary]);

  const getCountdownMessage = () => {
    if (celebrationMode) {
      return "🎉 Happy PulseChain Anniversary! 🎉";
    }
    if (timeLeft.days === 0) {
      return "⚡ Anniversary Day Approaching! ⚡";
    }
    return "PulseChain Anniversary Countdown";
  };

  return (
    <div className={`countdown-container ${celebrationMode ? 'celebration-active' : ''}`}>
      <h1 className="countdown-header">
        {getCountdownMessage()}
      </h1>
      <div className="days-since-launch">
        <div className="launch-counter">
          <span className="launch-digit">{daysSinceLaunch}</span>
          <span className="launch-label">Days Since PulseChain Launch</span>
        </div>
      </div>
      <div className="countdown-clock">
        <div className="clock-row">
          <span className={`clock-digit ${celebrationMode ? 'celebration-digit' : ''}`}>
            {timeLeft.days || 0}
          </span>
          <span className="clock-label">Days</span>
        </div>
        <div className="clock-row">
          <span className={`clock-digit ${celebrationMode ? 'celebration-digit' : ''}`}>
            {timeLeft.hours || 0}
          </span>
          <span className="clock-label">Hours</span>
        </div>
        <div className="clock-row">
          <span className={`clock-digit ${celebrationMode ? 'celebration-digit' : ''}`}>
            {timeLeft.minutes || 0}
          </span>
          <span className="clock-label">Mins</span>
        </div>
        <div className="clock-row">
          <span className={`clock-digit ${celebrationMode ? 'celebration-digit' : ''}`}>
            {timeLeft.seconds || 0}
          </span>
          <span className="clock-label">Seconds</span>
        </div>
      </div>
      {celebrationMode && (
        <div className="anniversary-fireworks">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="firework" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <div className="app-container">
      <Countdown />
      <PulseChainMilestones />
    </div>
  );
}

export default App;
