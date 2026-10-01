require("dotenv").config();
const { response } = require("express");
const OpenAI=require("openai");

const client = new OpenAI({
    apiKey:process.env.GEMINI_API_KEY,
    baseURL:"https://generativelanguage.googleapis.com/v1beta/openai/"
});

async function extractStructuredResume(rawText){
    if(!rawText || !rawText.trim())
    {
        throw new Error("resume text is required");
    }

    const System_Prompt=`
    You are an expert ATS (Applicant Tracking System) resume analyzer.
    Extract the raw resume text into a strict JSON object matching this exact schema:
    {
      "personalInfo": {
        "name": "string",
        "email": "string",
        "phone": "string",
        "location": "string",
        "linkedin": "string",
        "github": "string"
      },
      "summary": "string",
      "skills": {
        "technical": ["string"],
        "soft": ["string"],
        "tools": ["string"]
      },
      "experience": [
        {
          "title": "string",
          "company": "string",
          "duration": "string",
          "description": "string"
        }
      ],
      "education": [
        {
          "degree": "string",
          "institution": "string",
          "year": "string"
        }
      ],
      "projects": [
        {
          "title": "string",
          "description": "string",
          "techStack": ["string"]
        }
      ]
    }
    Rules:
    - Return ONLY valid JSON matching the schema (no markdown, no backticks).
    - If a field is missing in resume, leave it as "" or empty array [].
    - Categorize skills accurately into:
      * technical: programming languages, frameworks, databases, libraries
      * tools: git, docker, vs code, postman, linux, cloud
      * soft: leadership, problem solving, communication
    `

    const response = await client.chat.completions.create({
        model:"gemini-3.5-flash-lite",
        messages:[
            { role:"system", content:System_Prompt},
            { role:"user",content:`Resume Text:\n"""\n${rawText}\n"""` }
        ],
        response_format: { type: "json_object" },
         temperature: 0.1 // Near zero hallucination
    });

    const rawContent=response.choices[0].message.content;
    const clean = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim(); ///remove markdown related stuff
    return JSON.parse(clean);
}


module.exports = { extractStructuredResume };