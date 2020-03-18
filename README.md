# Emotion engine

A simple website that lets you see how others are feeling in real time.

## Running the project

The website is a static website with no dependencies or build steps, you just need to host the files somewhere. The backend is a simple Node.js WebSocket server that needs to be exposed on the internet.

### Prerequisites
  - [Node.js](https://nodejs.org), preferably installed from [nvm](https://github.com/nvm-sh/nvm)
    - If you have nvm installed, run `nvm use` or `nvm install` to change to the right version of Node.js

### Running
  1. Run ```npm install``` to install project dependencies
  1. Host the contents of `www/` somewhere to serve the website
      - e.g. copy the contents into an Apache directory with ```cp -R www/* /var/www/emotion```
      - or deploy the site to Netlify
      - etc.
  1. Copy the file `www/js/config.sample.js` to `www/js/config.js` e.g. ```cp www/js/config.sample.js www/js/config.js```
      - Fill out the details in this file. You need to fill in the public URL of your websocket server e.g. `wss://yourwebsite.com:8081` or something else if you have a different setup
  1. Run `npm start` to start the web server
      - Run this process in the background e.g. via ```npm start &```, or by running it in screen
