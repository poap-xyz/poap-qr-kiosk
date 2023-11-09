# POAP Kiosk

This is a kiosk app that displays QR codes based on a list of event codes uploaded by the event manager.

Product owner: @actualymentor

[Live url: qr.poap.xyz]( https://kiosk.poap.xyz/ )

[Dev url: https://qr-kiosk-dev.web.app/]( https://qr-kiosk-dev.web.app/ )

[Internal documentation](https://www.notion.so/poap/POAP-Kiosk-formerly-QR-Dispenser-3956e66a0b0742d49dab58e7b2fd0644)

## Requirements

- Have [nvm](https://github.com/nvm-sh/nvm) installed as a Node.js version manager
- Have the `.env.development` file, it is in 1Password as a secure note called `[ .env.development ] POAP Kiosk - poap-xyz/poap-qr-kiosk`
- (optional) Make sure you have access to the Firebase project `qr-kiosk-development` if you will run the functions backend offline. Note: you **never** need production credentials, the continuous integration has access to it
- (optional) Use [VSCode](https://code.visualstudio.com/) or [VSCodium](https://vscodium.com/) for automatic style formatting

## Frontend usage

1. Clone this repo
1. `nvm use`
1. `npm i`
1. Populate `.env.development`
1. CHOICE MOMENT. Either:
    1. Run the firebase functions backend locally, see next section
    1. Comment out the `REACT_APP_useEmulator` line in `.env.development` (this will make the frontend use the live backend)
1. `npm start`

## Backend usage

1. `cd functions`
2. `nvm use`
3. `npm i`
5. `npm run serve`

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

## Setting up new Firebase projects

To configure Firebase services:

1. Enable firestore, functions, hosting, analytics
2. Enable [app check]( https://console.firebase.google.com/u/0/project/poap-qr-kiosk/settings/appcheck ) ([docs](https://firebase.google.com/docs/app-check/web/recaptcha-provider))
3. Fill out all variables in `.env` from 1Password