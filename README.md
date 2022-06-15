# POAP QR Kiosk

This is a kiosk app that displays QR codes based on a list of event codes uploaded by the event manager.

Product owner: @actualymentor

[Live url: qr.poap.xyz]( https://qr.poap.xyz/ )

[Dev url: https://qr-kiosk-dev.web.app/]( https://qr-kiosk-dev.web.app/ )

[Internal documentation](https://www.notion.so/poap/Magic-POAP-Dispenser-aka-QR-Kiosk-3956e66a0b0742d49dab58e7b2fd0644)

## Firebase initial setup

To configure Firebase services:

1. Enable firestore, functions, hosting, analytics
2. Enable [app check]( https://console.firebase.google.com/u/0/project/poap-qr-kiosk/settings/appcheck ) ([docs](https://firebase.google.com/docs/app-check/web/recaptcha-provider))
3. Fill out all variables in `.env`

To Configure backend:

1. Set keys using `firebase functions:config:set key=value`:
    - `auth0.audience`
    - `auth0.client_id`
    - `auth0.client_secret`
    - `auth0.endpoint`
    - `sendgrid.fromemail`
    - `sendgrid.apikey`
    - `poap.apikey`
    - `recaptcha.secret`
    - `kiosk.publicUrl`
1. `firebase functions:config:get > .runtimeconfig.json`


## Frontend usage

1. `nvm use`
2. `npm i`
3. Populate `.env` based on `.env.example`
4. `npm start`

## Backend usage

1. `cd functions`
2. `nvm use`
3. `npm i`
5. `npm start`

## Tech stack

App code based on `create-react-app`, styling based on `styled-components`, routing using `react-router`.

Backend runs on a Firebase project.

🎨 Styling loosely uses [atomic design]( https://atomicdesign.bradfrost.com/chapter-2/ ) implemented with the [Styled Components]( https://styled-components.com/ ) library. The essence of this approach is that visual components are split into categories:

- Atoms are design elements that are singular but styled: e.g. a button.
- Molecules are atom combinations that commonly occur together: e.g. a label + input + button.
- Organisms are atoms/molecules that make a functional component together: e.g. an app header with a menu, search bar and logo.
- Pages are combinations of the above that we show to users, in the context of this app they are components used in a `Route`.

## Developer flow

This app follows the [POAP git flow]( https://app.gitbook.com/o/-Mdt3oJeD814je5SQu8h/s/-Mdt48AX0KOLHPttMYWw/development/onboarding/git ) and follows the *psychopath coder principle*:

> "Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live" ~ John Woods

To prevent the psycho from pursuing you:

1. Write for clarity and comprehension.
2. Leave a "what this does" comment for **every** function.
3. Be as descriptive as possible in commits and PRs.
