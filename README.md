# OM_React-App

## Project Description

This React component (App) integrates with the Solana blockchain using the Solana Web3.js library and interacts with the Phantom wallet for authentication and transaction signing. It provides basic functionality for creating new accounts, connecting wallets, transferring SOL, and managing wallet connections via buttons rendered in the UI.

## Functions of the Code

- **Create a new Solana account**: Generates a new KeyPair at the backend and airdrops 2 SOL to the newly created Keypair.
- **Connect to Phantom Wallet**: Connects to the Phantom Wallet if it exists.
- **Transfer SOL to New Wallet**: Triggers a transfer of 1 SOL (airdropped into the account generated in step 1) to the account connected in step 2.

## Source

- Gitpod
- Solana CLI
- VITE


## Author
 Om Ramesh Chintalwar.

## How to Run Project

Type the following commands in your terminal, in your root project folder, to run your project:

```bash
solana-test-validator
npm install
npm run dev

