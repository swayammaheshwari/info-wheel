const multer = require("multer");
const path = require("path");
const shortid = require("shortid");

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join("public", "uploads")); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    const uniqueId = shortid.generate(); // Generate a unique ID
    const ext = path.extname(file.originalname); // Get the file extension
    const fileName = `${uniqueId}-${file.fieldname}${ext}`; // Construct the filename
    cb(null, fileName);
  },
});

// Initialize Multer
const upload = multer({
  storage: storage,
});

function jsonToHtml(jsonStr) {
  if (typeof jsonStr === "string") {
    obj = JSON.parse(jsonStr);
  } else {
    obj = jsonStr;
  }

  html = "";
  obj["blocks"].forEach(function (block, index) {
    switch (block["type"]) {
      case "paragraph":
        html += "<p>" + block["data"]["text"] + "</p>";
        break;

      case "header":
        html +=
          "<h" +
          block["data"]["level"] +
          ">" +
          block["data"]["text"] +
          "</h" +
          block["data"]["level"] +
          ">";
        break;

      case "raw":
        html += block["data"]["html"];
        break;

      case "list":
        lsType = block["data"]["style"] == "ordered" ? "ol" : "ul";
        html += "<" + lsType + ">";
        block["data"]["items"].forEach(function (item, index) {
          html += "<li>" + item + "</li>";
        });
        html += "</" + lsType + ">";
        break;

      case "code":
        html +=
          '<pre><code class="language-' +
          block["data"]["lang"] +
          '">' +
          block["data"]["code"] +
          "</code></pre>";
        break;

      case "image":
        html +=
          '<div class="img_pnl"><img alt="' +
          block["data"]["caption"] +
          '" src="' +
          block["data"]["file"]["url"] +
          '" /></div>';
        break;

      default:
        break;
    }
  });

  return html;
}

module.exports = { upload, jsonToHtml };
