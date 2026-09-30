const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const isMimePdf = file.mimetype === "application/pdf";
    const isExtPdf = path.extname(file.originalname).toLowerCase() === ".pdf";

    if (isMimePdf && isExtPdf) {
        cb(null, true); // Allow upload
    } else {
        const error = new Error("Invalid file format. Only PDF files (.pdf) are allowed.");
        error.code = "INVALID_FILE_TYPE";
        cb(error, false); // Reject upload
    }
};

// 3. Multer Instance with 5MB Cap:
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter
});
module.exports = upload;
