const { PDFParse } = require("pdf-parse");
const Resume = require("../models/resume.model");
const { extractStructuredResume } = require("../utils/aiservice");

const uploadResume = async (req, res) => {
    let parser = null;

    try {
         // Multer verification: File aayi ya nahi?
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a resume in PDF format"
            });
        }

        // 2. File Buffer aur Metadata extract karo
        const fileBuffer = req.file.buffer;
        const filename = req.file.originalname;
        const filesize = req.file.size;
        const userId = req.user.id;

        // 3. pdf-parse  se raw text extract karo
        parser = new PDFParse({ data: fileBuffer });
        const textResult = await parser.getText();
        const rawText = textResult?.text?.trim() || "";

        // 4. Edge Case: Agar resume scanned image ho (jisme selectable text na ho)
        if (!rawText || rawText.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Could not extract text."
            });
        }

        let parsedData={};
        try{
            parsedData = await extractStructuredResume(rawText);
        }catch(aierror){
            console.log("Ai Parsing Error",aierror.message);
        }

        // 5. Database me Resume record create karo
        const resume = await Resume.create({
            userId,
            filename,
            filesize,
            rawText,
            parsedData,
            targetJobDescription: req.body?.jobDescription || null
        });

        
        // 6. Success Response
        return res.status(201).json({
            success: true,
            message: "Resume uploaded and text extracted successfully",
            resume: {
                id: resume._id,
                filename: resume.filename,
                filesize: resume.filesize,
                characterCount: rawText.length,
                parsedData: resume.parsedData,
                createdAt: resume.createdAt
            }
        });

        } catch (error) {
        console.error("Resume Upload Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to process resume"
        });
    } finally {
        // 7. RAM Cleanup: Node memory leak se bachane ke liye parser destroy karo
        if (parser && typeof parser.destroy === "function") {
            await parser.destroy().catch(() => {});
        }
    }
};



module.exports = {
    uploadResume
};
