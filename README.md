# Stellar White Belt dApp

This is a simple Stellar dApp built for the White Belt challenge. It allows users to connect their Freighter wallet, check their XLM balance on the testnet, and send XLM to other addresses.

## Features
- **Wallet Integration**: Connect and disconnect Freighter wallet.
- **Balance Checker**: Fetch and display the native XLM balance of the connected account.
- **Payment Flow**: Send XLM transactions on the Stellar Testnet with real-time feedback and transaction hash.

## Tech Stack
- React + TypeScript (Vite)
- @stellar/stellar-sdk
- @stellar/freighter-api

## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) installed.
- [Freighter Wallet](https://freighter.app/) extension installed in your browser.
- A Stellar Testnet account (you can use the Freighter faucet to fund your account).

### Installation
1. Clone the repository:
   ```bash
    git clone https://github.com/KarenZita01/Simple-payments.git
   cd stellar-white-belt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open the application in your browser (usually at `http://localhost:5173`).

## Screenshots
![Wallet Connected State](public/screenshots/Wallet%20connected%20state.png.png)
![Balance Displayed](public/screenshots/Balance%20displayed.png.png)
![Successful Testnet Transaction](public/screenshots/Successful%20testnet%20transaction.png.png)
![Transaction Result](public/screenshots/Transaction%20result.png.png)
