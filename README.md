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
4. Set keys `api.devaccesstoken`, `api.accesstoken`, `sendgrid.fromemail`, and `sendgrid.apikey` with `firebase functions:config:set key=value`
4. `firebase functions:config:get > .runtimeconfig.json`
5. `npm start`

## Architecture

App code based on `create-react-app`, styling based on `styled-components`, routing using `react-router`.

Backend runs on a Firebase project.

### Firebase initial setup

For backend/functions setup, see `./functions/README.md`.

To configure Firebase services:

1. Enable firestore, functions, hosting, analytics
2. Enable [app check]( https://console.firebase.google.com/u/0/project/poap-qr-kiosk/settings/appcheck ) ([docs](https://firebase.google.com/docs/app-check/web/recaptcha-provider))
3. Fill out all variables in `.env`