const express = require("express");
const router = express.Router();

const verifytoken = require("../middleware/auth.middleware");
const upload = require("../middleware/multer");
const { uploadResume } = require("../controllers/resume.controller");

// POST /api/v1/resume/upload
router.post("/upload", verifytoken, upload.single("resume"), uploadResume);

module.exports = router;
