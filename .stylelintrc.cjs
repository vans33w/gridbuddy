module.exports = {
  extends: ["stylelint-config-recommended"],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen",
          "layer",
          "import",
          "theme"
        ]
      }
    ]
  },
  ignoreFiles: ["node_modules/**"]
};
