# POAP QR Kiosk MVP

[Live url]( https://poap-qr-kiosk.web.app/ ) (please do not claim the codes in it).

This is an MVP of a kiosk app that displays QR codes based on a list of event codes uploaded by the event manager.

There is a non-trivial chance it will be rewritten if the concept proves viable.

Product owner: @actualymentor

## Firebase initial setup

To configure Firebase services:

1. Enable firestore, functions, hosting, analytics
2. Enable [app check]( https://console.firebase.google.com/u/0/project/poap-qr-kiosk/settings/appcheck ) ([docs](https://firebase.google.com/docs/app-check/web/recaptcha-provider))
3. Fill out all variables in `.env`

To Configure backend:

1. Set keys `auth0.client_id`, `auth0.client_secret`, `auth0.endpoint`, `sendgrid.fromemail`, and `sendgrid.apikey` with `firebase functions:config:set key=value`
1. `firebase functions:config:get > .runtimeconfig.json`


## Frontend usage

1. `nvm use`
2. `npm i`u
3. Populate `.env` based on `.env.example`
4. `npm start`

## Backend usage

1. `cd functions`
2. `nvm use`
3. `npm i`
5. `npm start`

## Architecture

App code based on `create-react-app`, styling based on `styled-components`, routing using `react-router`.

Backend runs on a Firebase project.

