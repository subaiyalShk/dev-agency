# Svelte Project Documentation

## Overview

This project is a Svelte application designed to facilitate project analysis and proposal generation. It leverages the Google Generative AI API to create detailed project proposals based on user-defined requirements and analysis documents.

## Features

- **Dynamic Input Forms**: Users can input project requirements, constraints, and analysis documents through intuitive forms.
- **AI-Powered Proposal Generation**: The application utilizes the Google Generative AI to generate comprehensive project proposals, including timelines, budgets, and risk assessments.
- **Real-Time Analysis**: Users can adjust project parameters and see real-time updates on timelines and budgets.
- **Cost Breakdown**: The application provides detailed cost analysis, including recurring and one-time costs.
- **User-Friendly Interface**: Built with a responsive design, ensuring usability across devices.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

### Running the Application

To start the development server, run:
```npm run dev```



This will start the application on `http://localhost:5173/` (or another port if specified).

### Building for Production

To create a production build of your application, run:
```npm run build```

You can preview the production build with:
```npm run preview```


### Environment Variables

Make sure to set up your environment variables for the Google Generative AI API. Create a `.env` file in the root of your project and add the following:
```VITE_GOOGLE_API_KEY=<your API Key>```


## Usage

1. **Input Requirements**: Fill in the requirements document in the provided textarea.
2. **Add Analysis Documents**: Input any analysis documents that will inform the proposal.
3. **Generate Proposal**: Click the "Generate Proposal" button to create a detailed project proposal.
4. **Copy to Clipboard**: Use the copy button to easily copy the generated proposal for sharing or editing.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.