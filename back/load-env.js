// eslint-disable-next-line strict
const path = require("path");
const appRoot = require("app-root-path").path;
require("dotenv").config({path: path.resolve(appRoot, ".env")});
