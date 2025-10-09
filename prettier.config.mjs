const config = {
  // For prettier 3
  sortingMethod: "lineLength",
  importTypeOrder: ["NPMPackages", "localImportsValue", "localImportsType"],
  newlineBetweenTypes: true,
  plugins: ["./node_modules/prettier-plugin-sort-imports/dist/index.js"],
};

export default config;
