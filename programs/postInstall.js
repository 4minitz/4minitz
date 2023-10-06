"use strict";
const fs = require("fs-extra");

console.log("copy bootstrap fonts to the public folder");
fs.copySync("./node_modules/bootstrap/dist/fonts", "./public/fonts");

console.log("force eonasdan-bootstrap-datetimepicker to use the global jquery");
fs.removeSync("./node_modules/eonasdan-bootstrap-datetimepicker/node_modules");
