# Block3RChain Frontend — Real-time Dashboard

This is the Next.js frontend for the **Block3RChain** geopolitical blockchain simulator. It provides a real-time visualization of the world state, ledger, and consensus pipeline.

## Features
- **Real-time Map**: Interactive D3.js/SVG map visualizing troop distributions.
- **God-Mode Panel**: Interface for exogenous shocks and geopolitical interventions.
- **Global Error Handling**: Centralized `ErrorModal` system using Zustand and MUI.
- **Dynamic Theming**: Light and Dark mode support via a global `AppThemeProvider`.
- **Centralized Config**: Environment-specific settings managed via `src/config/app-config.json`.

## Getting Started

### 1. Prerequisites
Ensure the backend orchestrator is running or accessible. The frontend expects the API at the URL defined in `src/config/app-config.json`.

### 2. Installation
```bash
npm install
```

### 3. Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the result.

## Architecture

### Centralized Configuration
All API endpoints and application metadata are managed in:
`src/config/app-config.json`

### Global State & Modals
We use **Zustand** for global state:
- `useSimulationStore.ts`: Manages the blockchain state, ledger, and WebSocket connection.
- `useErrorStore.ts`: Controls the global error modal.

### Theming
The application uses a custom MUI theme defined in `src/theme/themeConfig.ts`. The theme is provided globally by `AppThemeProvider.tsx` and can be toggled using the `ThemeToggle` component.

## Key Components
- `GameSetup`: Initial setup screen for choosing simulation templates.
- `SimulationView`: The main dashboard during an active simulation.
- `ErrorModal`: A shared component for displaying critical service or connection errors.
