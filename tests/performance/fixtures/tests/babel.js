require("@babel/register")({
  presets: ["@babel/preset-env"],
  plugins: ["@babel/plugin-transform-runtime", { corejs: 3 }],
});
