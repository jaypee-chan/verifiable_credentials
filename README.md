# Verifiable Credentials Demo

This demo application simulates the issuance and selective disclosure of verifiable credentials. It provides an interactive web interface for creating credentials and demonstrating different types of selective disclosure.

## Features

- **Credential Issuance**: Create verifiable credentials with fields like KYC status, date of birth, nationality, languages, and net worth
- **Selective Disclosure**: Multiple disclosure options:
  - Full credential disclosure
  - KYC status only
  - Age verification (over 18)
  - Wealth threshold verification
- **Interactive UI**: Modern, responsive web interface with real-time updates
- **Visual Feedback**: Clear status indicators and organized display of credential information

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open the application in your browser at the provided URL

## Technical Implementation

- Built with React + TypeScript + Vite
- Uses Tailwind CSS for styling
- Implements dummy data simulation for demonstration purposes
- Includes type safety with TypeScript interfaces
- Features a modular architecture for easy extension

## Usage

1. Enter a holder name and click "Issue Credential" to create a new verifiable credential
2. Use the disclosure buttons to demonstrate different selective disclosure scenarios:
   - "Disclose All Fields": Shows all credential information
   - "KYC Status Only": Reveals only the KYC verification status
   - "Age Verification": Proves the holder is over 18 without revealing the exact birth date
   - "Wealth Threshold Check": Verifies if the holder meets the wealth threshold without disclosing the exact amount

## Note

This is a demonstration application using simulated data. In a production environment, you would integrate with actual verifiable credentials services and implement proper cryptographic verification.