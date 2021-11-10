# POAP QR Kiosk MVP

[Live url]( https://poap-qr-kiosk.web.app/ ) (please do not claim the codes in it).

This is an MVP of a kiosk app that displays QR codes based on a list of event codes uploaded by the event manager.

There is a non-trivial chance it will be rewritten if the concept proves viable.

Product owner: @actualymentor

## Frontend setup

1. `nvm use`
2. `npm i`
3. Populate `.env` based on `.env.example`
4. `npm start`

## Backend setup

1. `cd functions`
2. `nvm use`
3. `npm i`
4. `firebase functions:config:get > .runtimeconfig.json` (assuming the infra already has the data through `firebase functions:config:set api.accesstoken=`)
5. `npm start`

## Architecture

App code based on `create-react-app`, styling based on `styled-components`, routing using `react-router`.

Backend runs on a Firebase project.