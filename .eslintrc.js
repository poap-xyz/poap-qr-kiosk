const styleguide = require( './.eslint.styleguide.js' )

module.exports = {

    // Recommended features
    "extends": [ "eslint:recommended", "plugin:react/recommended" ],

    //Parser features
    parser: "@babel/eslint-parser",
    parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 12,
        sourceType: "module",
        ecmaFeatures: {
            experimentalObjectRestSpread: true,
            jsx: true
        }
    },

    // Specific rules, 2: err, 1: warn, 0: off
    rules: {

        // Import styleguide
        ...styleguide ,
        
        "react/react-in-jsx-scope": 0, // CRA globally imports it

        // React specific
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