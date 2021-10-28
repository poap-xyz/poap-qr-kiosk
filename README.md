# POAP QR Kiosk MVP

[Live demo]( https://poap-qr-kiosk.web.app/ ).

This is an MVP of a kiosk app that displays QR codes based on a list of event codes uploaded by the event manager.

There is a non-trivial chance it will be rewritten if the concept proves viable.

Product owner: @actualymentor

## Setup

1. `nvm use`
2. `npm i`
3. Populate `.env` based on `.env.example`
4. `npm start`

## Architecture

App code based on `create-react-app` without any advanced optimisations.

Backend runs on a Firebase project.