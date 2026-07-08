# GrowEasy AI-Powered CRM Data Normalization Suite

An enterprise-grade, full-stack application designed to automatically parse messy, arbitrary CSV user-lead exports (e.g., Real Estate listings, Meta Ads, Custom Sheets) and dynamically transform them into GrowEasy's strict standard CRM schema using Google's Gemini-2.5-Flash model.

## 🌟 Solution Architecture Overview
The system completely bridges the gap between chaotic raw inputs and strict database requirements through a dual-layer approach:
1. **Frontend (Next.js 14 + App Router + TailwindCSS)**: Provides a secure user interface with a dual-stage pipeline (Raw Parse Preview vs AI Normalized Sync using PapaParse).
2. **Backend (Node.js + Express + Official @google/genai SDK)**: A robust stateless integration engine utilizing system instructions and structural JSON execution to completely eliminate AI hallucinations.

## 🛠️ Deep Technical Highlights (Selection Benchmarks)
* **Deterministic Structured JSON Output**: Employs Gemini's native `responseSchema` validation constraint to guarantee strict data matching, bypassing the risk of loose text outputs or markdown blocks.
* **Smart Memory Window Batching**: Automatically chunks rows into size-controlled batches of 15 records to manage token thresholds and ensure continuous high-speed normalization.
* **Deterministic Business Guardrails**: Implicit rules screen row payloads dynamically; records entirely lacking contact metrics (`email` and `phone`) are tracked and logged as skipped parameters automatically.

## 📊 API Specification Reference

### AI Processing Synchronization Pipeline
* **Endpoint**: `POST http://localhost:5000/api/v1/crm/import-confirm`
* **Content Payload Limit**: `10mb` (Optimized for massive standard sheets)
* **Payload Format Expected**:
```json
{
  "rows": [
    {
      "Full Name": "Jane Doe",
      "Email Address": "jane@example.com",
      "Phone Number": "+91 9876543210"
    }
  ]
}
