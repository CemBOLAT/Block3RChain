# Block3RChain Frontend — Real-time Dashboard

This is the Next.js frontend for the **Block3RChain** geopolitical blockchain simulator. It provides a real-time visualization of the world state, ledger, and consensus pipeline.

## Features
- **Real-time Map**: Interactive D3.js/SVG map visualizing troop distributions, alliances, castles, tax, and happiness.
- **God-Mode Panel**: Queue interventions (troop/gold/pop changes, country add/remove, castle build/demolish, tax rate).
- **Simulation Config Panel** (`AllianceConfigPanel`): Tune alliance solver parameters and game rules at equilibrium (block reward, castle costs, happiness limit, emigration rate).
- **Block History**: Per-block ledger deltas, economic deaths, and unhappy emigration.
- **Global Error Handling**: Centralized `ErrorModal` system using Zustand and MUI.
- **Dynamic Theming**: Light and Dark mode support via a global `AppThemeProvider`.
- **Centralized Config**: Environment-specific API URLs in `src/config/app-config.json`; simulation rules in `src/types/allianceParameters.ts` and `src/types/gameParameters.ts`.

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
- `AllianceConfigPanel` / `SimulationConfigTabs`: Alliance + game parameter forms (equilibrium only).
- `BlockChainHistory`: Mined blocks with alliance outcome and ledger deltas.
- `NationalStatistics`, `MapContextMenu`: Country stats and right-click God actions.
- `ErrorModal`: A shared component for displaying critical service or connection errors.
