import React, { useState, useEffect } from 'react';
import { Car } from 'lucide-react';

const CustomMotorcycle = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="18" cy="16" r="3.5" />
    <circle cx="6" cy="16" r="3.5" />
    <path d="M15 9 L17.5 14" />
    <path d="M14 9 L15.5 8" />
    <path d="M6 16 L8.5 10 L14 10 L11 14 Z" />
    <path d="M8.5 10 L10.5 7 L14 8 L15 11" />
    <path d="M8 10 L10.5 10" strokeWidth="2.5" />
    <path d="M9 16 L14 16 L15 15" />
  </svg>
);

const AUTO_FACTS = [
  "The average car has over 30,000 unique parts.",
  "Volvo invented the 3-point seatbelt in 1959 and shared the patent for free to save lives.",
  "The first electric vehicle was built in 1832.",
  "Bajaj introduced the first auto-rickshaw to India in 1959.",
  "An F1 car can theoretically drive upside down on a ceiling.",
  "About 65% of all Rolls-Royce cars ever built are still running.",
  "We spend about 99 days of our lives waiting at red lights.",
  "The highest car mileage record is over 3.2 million miles.",
  "Recycling cars saves 85 million barrels of oil annually.",
  "Over 100 million vehicles are manufactured globally each year.",
  "The first US car race in 1895 was won at just 11.2 mph."
];


const LoadingFacts = ({ fullPage = false }) => {
  const [fact, setFact] = useState('');
  const [iconType, setIconType] = useState('bike');

  useEffect(() => {
    // Pick a random fact
    const randomIndex = Math.floor(Math.random() * AUTO_FACTS.length);
    setFact(AUTO_FACTS[randomIndex]);
    setIconType(Math.random() > 0.5 ? 'bike' : 'car');
  }, []);

  const containerStyle = fullPage ? styles.fullPageContainer : styles.sectionContainer;

  return (
    <div style={containerStyle} className="animate-fade">
      <div style={styles.loaderContainer}>
        {iconType === 'bike' ? (
          <CustomMotorcycle style={styles.svgLoader} width={64} height={64} />
        ) : (
          <Car style={styles.svgLoader} size={64} />
        )}
      </div>
      <div style={styles.factBox}>
        <span style={styles.factLabel}>Did you know?</span>
        <p style={styles.factText}>{fact}</p>
      </div>
    </div>
  );
};

const styles = {
  fullPageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-primary)',
    padding: '2rem',
    gap: '2rem',
    textAlign: 'center',
  },
  sectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6rem 2rem',
    gap: '1.5rem',
    width: '100%',
    textAlign: 'center',
  },
  loaderContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  svgLoader: {
    stroke: 'var(--accent-primary)',
    strokeWidth: 1.5,
    strokeDasharray: '200',
    animation: 'drawOutline 2.5s ease-in-out infinite, pulseGlow 2.5s ease-in-out infinite',
  },
  factBox: {
    maxWidth: '460px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    padding: '1rem 1.5rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--card-inner-bg)',
    border: '1px solid var(--card-inner-border)',
    animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  factLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--accent-primary)',
    letterSpacing: '0.05em',
  },
  factText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    margin: 0,
  }
};

export default LoadingFacts;
