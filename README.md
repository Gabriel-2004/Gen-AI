# Chatbot Story Visualization

This project is a chatbot application that generates and visualizes stories based on user input. The chatbot can generate text and images to create an engaging storytelling experience.

## Features

- **Profanity Filtering**: The application filters out profane words from user input.
- **Text Generation**: Generates story text based on user preferences using the Cohere API.
- **Image Generation**: Creates images to visualize the story using the Pollinations API.
- **Interactive Chat**: Users can interact with the chatbot to guide the story generation process.

## Project Structure

- **`.env`**: Contains environment variables, including the API key for Cohere.
- **`package.json`**: Lists the project dependencies.
- **`Profanity_Dataset/`**: Contains the CSV file with profane words.
- **`public/`**: Contains the HTML and resources for the frontend.
- **`server.js`**: The main server file that handles API requests and serves the frontend.

## Setup

1. Clone the repository.
2. Install the dependencies:
    ```sh
    npm install
    ```
3. Start the server:
    ```sh
    npm start
    ```
4. Open your browser and navigate to `http://localhost:3000`.

## Usage

- **Guided Generation**: Follow the prompts to define the genre, style, tone, setting, and characters of the story.
- **Free Generation**: Type any message to start the story.
- **Modify Story**: Provide feedback to refine the story or change specific elements.

## Dependencies

- [express](http://_vscodecontentref_/6): Web framework for Node.js.
- [body-parser](http://_vscodecontentref_/7): Middleware to parse request bodies.
- [dotenv](http://_vscodecontentref_/8): Loads environment variables from a [.env](http://_vscodecontentref_/9) file.
- `node-fetch`: A light-weight module that brings `window.fetch` to Node.js.
- [cors](http://_vscodecontentref_/10): Middleware to enable Cross-Origin Resource Sharing.
- [csv-parser](http://_vscodecontentref_/11): A streaming CSV parser for Node.js.
