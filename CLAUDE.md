# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
A React-based countdown timer web application that displays the time remaining until PulseChain Anniversary (May 13, 2024 UTC). Built with Create React App and designed as a single-page application.

## Development Commands

### Getting Started
- `npm install` - Install dependencies
- `npm start` - Start development server (localhost:3000)
- `npm test` - Run tests in watch mode
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App (one-way operation)

### Testing
- `npm test` - Runs Jest in watch mode with React Testing Library
- Tests are located in `src/App.test.js`

### Build & Deployment
- `npm run build` - Creates optimized production build in `build/` folder
- Build includes hashed filenames for cache busting and minification
- Ready for static hosting (Netlify, Vercel, GitHub Pages, etc.)

## Architecture

### Tech Stack
- **Frontend**: React 18.2.0 with React DOM
- **Build System**: Create React App (webpack, Babel, ESLint)
- **Testing**: Jest + React Testing Library
- **Styling**: CSS with flexbox, mobile-first responsive design
- **Performance**: Web Vitals monitoring

### Key Files
- `src/App.js` - Main countdown component with hooks
- `src/App.css` - Component styles (dark theme, purple accents)
- `public/index.html` - HTML template with PulseChain meta description
- `public/manifest.json` - PWA configuration

### Features
- Real-time countdown updates every second
- Auto-renewal to next year when countdown reaches zero
- Responsive design for mobile and desktop
- Dark theme with purple color scheme
- Target date: May 13, 2024 UTC (PulseChain Anniversary)

## Development Notes

### Project Structure
```
src/
├── App.js          # Main countdown component
├── App.css         # Component styles
├── App.test.js     # Basic rendering test
├── index.js        # App entry point
├── index.css       # Global styles
└── setupTests.js   # Test configuration
```

### Current Issues
- Test in `App.test.js` expects "learn react" text but actual content is PulseChain countdown
- Minor HTML structure issue in `index.html`

### Browser Support
- **Development**: Latest Chrome, Firefox, Safari
- **Production**: >0.2% market share, excludes dead browsers