import { render, screen } from '@testing-library/react';
import App from './App';

test('renders PulseChain Anniversary countdown', () => {
  render(<App />);
  const headerElement = screen.getByText(/PulseChain Anniversary/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders PulseChain Milestones section', () => {
  render(<App />);
  const milestonesHeader = screen.getByText(/PulseChain Milestones/i);
  expect(milestonesHeader).toBeInTheDocument();
});
