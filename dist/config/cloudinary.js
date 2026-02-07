"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
// Hardcoded Cloudinary credentials
cloudinary_1.v2.config({
    cloud_name: 'dftnqqcjz',
    api_key: '419724397335875',
    api_secret: 'Q7usOM7s5EsyeubXFzy5fQ1I_7A',
});
exports.default = cloudinary_1.v2;
