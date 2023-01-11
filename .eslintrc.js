const styleguide = require( './.eslint.styleguide.js' )

module.exports = {

    // Recommended features
    "extends": [ "eslint:recommended", "plugin:react/recommended" ],

    // React settings
    "settings": {
        "react": { "version": "detect" }
    },

    // Parser features
    parser: "@babel/eslint-parser",
    parserOptions: {
        requireConfigFile: false,
        ecmaFeatures: {
            jsx: true
        }
    },

    // Rules
    rules: {

        // Import styleguide
        ...styleguide ,
        
        // React config
        "react/react-in-jsx-scope": 0, // CRA globally imports "react" so we don't need to do it
        "react/prop-types": 0,
        "react/display-name": 0
    },

    // What environment to run in
    env:{
        node: true,
        browser: true,
        mocha: true,
        jest: false,
        es6: true
    },

    // What global variables should be assumed to exist
    globals: {
        context: true,
        cy: true,
        it: true,
        Cypress: true,
        expect: true
    }

}