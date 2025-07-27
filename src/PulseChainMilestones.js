import React, { useState, useEffect, useCallback } from 'react';
import { fetchCurrentStats, calculatePulseChainStats } from './api';
import config from './config.json';
import './PulseChainMilestones.css';

function PulseChainMilestones() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [celebrationMode, setCelebrationMode] = useState(null);
  const [isAnniversary, setIsAnniversary] = useState(false);


  const checkCelebrationMode = (stats) => {
    if (!stats) return null;
    
    const currentTransactions = stats.totalPulseChainTransactions;
    const blocksSinceFork = stats.blocksSinceFork;
    
    // Check transaction milestones (every 100M)
    const transactionProgress = (currentTransactions % 100000000) / 100000000;
    
    // Check block milestones (every 1M)
    const blockProgress = (blocksSinceFork % 1000000) / 1000000;
    
    // Check anniversary - celebrate May 13 every year (within 7 days)
    const today = new Date();
    let anniversary = new Date(today.getFullYear(), 4, 13);
    
    // If May 13 has passed this year, check next year
    if (today > anniversary) {
      anniversary = new Date(today.getFullYear() + 1, 4, 13);
    }
    
    const difference = anniversary - today;
    const isAnniversaryPeriod = difference <= (7 * 24 * 60 * 60 * 1000) && difference > 0;
    
    setIsAnniversary(isAnniversaryPeriod);
    
    if (isAnniversaryPeriod) {
      return 'anniversary';
    }
    
    if (transactionProgress >= 0.95) {
      return 'transaction-milestone';
    }
    
    if (blockProgress >= 0.95) {
      return 'block-milestone';
    }
    
    return null;
  };

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const currentData = await fetchCurrentStats();
      
      if (currentData && currentData.currentBlock > 0) {
        const stats = calculatePulseChainStats(
          currentData, 
          config.forkData
        );
        
        const celebration = checkCelebrationMode(stats);
        setCelebrationMode(celebration);
        setStats(stats);
        setLastUpdate(new Date());
        setError(null);
      } else {
        // Fallback to mock data for development
        const mockData = {
          currentBlocks: 24080721 + Math.floor(Math.random() * 1000),
          blocksSinceFork: 24080721 - 17233000 + Math.floor(Math.random() * 1000),
          totalPulseChainTransactions: 301259930 + Math.floor(Math.random() * 10000),
          networkUtilization: 0,
          gasPrice: 0,
          forkBlock: 17233000
        };
        
        const celebration = checkCelebrationMode(mockData);
        setCelebrationMode(celebration);
        setStats(mockData);
        setLastUpdate(new Date());
        setError(null);
      }
    } catch (err) {
      setError('Error loading PulseChain data');
      console.error('Error fetching stats:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Refresh every 5 minutes to match VPS API update frequency
    const interval = setInterval(fetchStats, 300000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('en-US');
  };

  const formatCompact = (num) => {
    if (num === null || num === undefined) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toLocaleString();
  };

  if (loading && !stats) {
    return (
      <div className="pulsechain-container">
        <div className="pulsechain-header">
          <h1 className="pulsechain-title">PulseChain Milestones</h1>
          <p className="pulsechain-subtitle">Tracking PulseChain's growth since launch</p>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading PulseChain data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pulsechain-container">
        <div className="pulsechain-header">
          <h1 className="pulsechain-title">PulseChain Milestones</h1>
          <p className="pulsechain-subtitle">Tracking PulseChain's growth since launch</p>
        </div>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-text">{error}</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const getCelebrationClass = () => {
    if (!celebrationMode) return '';
    return `celebration-${celebrationMode}`;
  };

  const getNextMilestoneText = () => {
    if (!stats) return '';
    
    const currentTransactions = stats.totalPulseChainTransactions;
    const blocksSinceFork = stats.blocksSinceFork;
    
    if (celebrationMode === 'transaction-milestone') {
      const nextMilestone = Math.ceil(currentTransactions / 100000000) * 100000000;
      const remaining = nextMilestone - currentTransactions;
      return `${formatCompact(remaining)} more to ${formatCompact(nextMilestone)} transactions!`;
    }
    
    if (celebrationMode === 'block-milestone') {
      const nextMilestone = Math.ceil(blocksSinceFork / 1000000) * 1000000;
      const remaining = nextMilestone - blocksSinceFork;
      return `${formatCompact(remaining)} more blocks to ${formatCompact(nextMilestone)}!`;
    }
    
    if (celebrationMode === 'anniversary') {
      return '🎉 Happy PulseChain Anniversary! 🎉';
    }
    
    return '';
  };

  return (
    <div className={`pulsechain-container ${getCelebrationClass()}`}>
      <div className="pulsechain-header">
        <h1 className="pulsechain-title">
          {isAnniversary ? '🎊 PulseChain Anniversary! 🎊' : 'PulseChain Milestones'}
        </h1>
        <p className="pulsechain-subtitle">
          {getNextMilestoneText() || "Tracking PulseChain's growth since launch"}
        </p>
        {celebrationMode && (
          <div className="celebration-message">
            {celebrationMode === 'transaction-milestone' && '🚀 Approaching transaction milestone!'}
            {celebrationMode === 'block-milestone' && '⚡ Approaching block milestone!'}
            {celebrationMode === 'anniversary' && '🎊 Celebrating PulseChain Anniversary! 🎊'}
          </div>
        )}
      </div>
      
      <div className="metrics-grid">
        <div className={`metric-card ${celebrationMode ? 'celebration-card' : ''}`}>
          <div className="metric-value">
            {formatNumber(stats.currentBlocks)}
          </div>
          <div className="metric-label">Current Block</div>
        </div>

        <div className={`metric-card ${celebrationMode ? 'celebration-card' : ''}`}>
          <div className="metric-value">
            {formatNumber(stats.blocksSinceFork)}
          </div>
          <div className="metric-label">Blocks Since Fork</div>
        </div>

        <div className={`metric-card ${celebrationMode ? 'celebration-card' : ''}`}>
          <div className="metric-value">
            {formatCompact(stats.totalPulseChainTransactions)}
          </div>
          <div className="metric-label">Total PulseChain Transactions</div>
        </div>
      </div>

      {lastUpdate && (
        <div className="last-update">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {celebrationMode && (
        <div className="celebration-overlay">
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div key={i} className="confetti" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#8a2be2', '#667eea', '#ff6b6b', '#4ecdc4', '#45b7d1'][Math.floor(Math.random() * 5)]
              }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PulseChainMilestones;