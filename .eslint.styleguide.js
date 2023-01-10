// Severity rationale:
// none: we don't care about this at all
// warn: we recomment this to change, but there are instances where you can choose to ignore it
// error: there is no reason for you to do this

module.exports = {

    // No semi colons, note that "never" does not pose ASI hazard
    "semi": [ "error", "never", ],

    // Allow unnamed exports
    "import/no-anonymous-default-export": 0,

    // Prefer arrow callbacks
    "prefer-arrow-callback": "warn",

    // Do not mix spaces and tabs
    "no-mixed-spaces-and-tabs": "error",

    // Require spacing between brackets and keywords
    "object-curly-spacing": [ "error", "always" ],
    "array-bracket-spacing": [ "error", "always" ],
    "block-spacing": [ "error", "always" ],
    "space-before-blocks": [ "error", "always" ],
    "brace-style": [ "error", "1tbs" ],
    "keyword-spacing": "error",
    "arrow-spacing": "error",
    "space-in-parens": [ "error", "always" ],

    // Comments need a space between // and the content. //Not like this.
    "spaced-comment": [ "error", "always" ],

    // Warn of template literal variables in the wrong place
    "no-template-curly-in-string": "warn",
    
    // Define things before using them
    "no-use-before-define": [ "error", { functions: false } ],

    // No invalid 'this' usage
    "no-invalid-this": "error",

    // Only throw Error objects and not literals (like strings)
    "no-throw-literal": "error",

    // Prefer the use of destructuring
    "prefer-destructuring": "warn",

    // Warn of unused variables, function argumebnts may have documentation value so are ignored
    "no-unused-vars": [ "warn", { vars: 'all', args: 'none' } ],

    // No use of "var"
    "no-var": "error",

    // No unneeded ()
    "no-extra-parens": "error"

}