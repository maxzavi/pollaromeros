const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const input = "./originales";
const output = "./web";

if (!fs.existsSync(output)) {
    fs.mkdirSync(output);
}

fs.readdirSync(input).forEach(async file => {

    if (!file.endsWith(".png")) return;

    await sharp(path.join(input, file))
        .resize(54, 54)
        .webp({
            quality: 90
        })
        .toFile(
            path.join(output, file.replace(".png", ".webp"))
        );

    console.log(file + " ✔");

});
