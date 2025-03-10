# FlipN Tool

A comprehensive web-based tool for Solana blockchain operations. This application allows you to:

- Generate multiple Solana wallets at once (up to 100)
- Export wallet public and private keys as JSON
- Import previously generated wallets
- Copy individual wallet keys to clipboard
- Browse and interact with Solana projects
- Like and buy tokens from various projects
- Perform batch operations with multiple wallets

## Features

- **Wallet Management**:
  - Batch Generation: Generate up to 100 Solana wallets with a single click
  - Export/Import: Save your wallets to a JSON file and import them later
  - Copy Functions: Easily copy public or private keys to clipboard
  - Validation: Server-side validation of imported wallets
  - Multiple Key Formats: Support for base58, base64, and hex private key formats

- **Project Interaction**:
  - Browse Projects: View and interact with Solana projects
  - Token Information: View detailed token information including addresses
  - Like Projects: Add projects to your like list for batch operations

- **Token Operations**:
  - Buy Tokens: Purchase tokens from projects using Solana
  - Estimate Amounts: Calculate token amounts before purchase
  - Batch Processing: Perform operations with multiple wallets
  - Transaction Handling: Sign and send transactions to the Solana blockchain

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Usage

1. Start the server:

```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3001`

3. Use the interface to:
   - Generate, export, and import Solana wallets
   - Browse available projects
   - Add projects to your like or buy lists
   - Perform batch operations with multiple wallets

### Wallet Operations

- **Generate Wallets**: Specify the number of wallets and click "Generate"
- **Import Wallets**: Upload a previously exported wallets.json file
- **Export Wallets**: Download your current wallets as a JSON file

### Project Operations

- **Browse Projects**: View available projects and their details
- **Like Projects**: Add projects to your like list for batch operations
- **Buy Tokens**: Add projects to your buy list and specify SOL amount

### Batch Operations

- **Batch Like**: Like multiple projects with multiple wallets
- **Batch Buy**: Purchase tokens from multiple projects with multiple wallets

## Security Notes

- This tool is for development and educational purposes
- Private keys are generated and processed securely
- The application supports multiple private key formats (base58, base64, and hex)
- All blockchain transactions are signed locally before being sent
- Never share your private keys with anyone
- Consider using hardware wallets for production environments
- Use caution when performing batch operations with real SOL

## API Integration

- The application integrates with the FlipN API for token operations
- API calls are made with proper authentication and validation
- Error handling is implemented for all API interactions

## License

MIT
