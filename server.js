import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Handles large CSV payloads easily

// Initialize official Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Main API endpoint requested in the assignment
app.post('/api/v1/crm/import-confirm', async (req, res) => {
    try {
        const { rows } = req.body; // Expecting raw rows parsed from frontend preview
        
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ success: false, message: "No data rows provided." });
        }

        // Strict system instructions matching assignment constraints
        const systemInstruction = `
            You are a core CRM Data Integration engine. Your sole task is to normalize messy, arbitrary CSV data rows into standard GrowEasy CRM format.
            
            Strict Rules:
            1. If a row lacks both 'email' and 'mobile', omit it completely (Skip invalid records).
            2. For 'crm_status', strictly map to: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE.
            3. For 'data_source', strictly map to: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots. If ambiguous, leave empty "".
            4. If multiple emails/phones exist, use the first one for the main field and append the rest into 'crm_note'.
        `;

        // Batch processing logic to prevent LLM token overflows
        const BATCH_SIZE = 15;
        let finalParsedRecords = [];

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', // Pinning fast stable model
                contents: `Normalize these raw rows into a valid CRM JSON array: ${JSON.stringify(batch)}`,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                created_at: { type: "STRING" },
                                name: { type: "STRING" },
                                email: { type: "STRING" },
                                country_code: { type: "STRING" },
                                mobile_without_country_code: { type: "STRING" },
                                company: { type: "STRING" },
                                city: { type: "STRING" },
                                state: { type: "STRING" },
                                country: { type: "STRING" },
                                lead_owner: { type: "STRING" },
                                crm_status: { type: "STRING" },
                                crm_note: { type: "STRING" },
                                data_source: { type: "STRING" },
                                possession_time: { type: "STRING" },
                                description: { type: "STRING" }
                            }
                        }
                    }
                }
            });

            const processedBatch = JSON.parse(response.text);
            finalParsedRecords.push(...processedBatch);
        }

        const totalSkipped = rows.length - finalParsedRecords.length;

        // Return structured production-ready JSON response
        return res.status(200).json({
            success: true,
            summary: {
                totalImported: finalParsedRecords.length,
                totalSkipped: totalSkipped >= 0 ? totalSkipped : 0,
            },
            data: finalParsedRecords
        });

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ success: false, message: "Internal server processing error." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server securely running on port ${PORT}`);
});