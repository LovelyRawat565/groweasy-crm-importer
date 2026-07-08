"use client";

import React, { useState } from "react";
import Papa from "papaparse";

export default function CrmImporter() {
  // State variables for managing application flow
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResults, setProcessedResults] = useState<any[]>([]);
  const [summary, setSummary] = useState<{ totalImported: number; totalSkipped: number } | null>(null);
  const [step, setStep] = useState<number>(1); // Step tracker for clean UX

  // Client-side CSV parser using PapaParse (No AI involved yet)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          setHeaders(Object.keys(results.data[0] as object));
          setCsvData(results.data);
          setStep(2); // Automatically move to preview step
        }
      },
    });
  };

  // Calling our secure Node.js backend to let AI normalize the data
  const handleConfirmImport = async () => {
    setIsProcessing(true);
    setStep(3); // Move to processing state

    try {
      const response = await fetch("http://localhost:5000/api/v1/crm/import-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: csvData }),
      });

      const result = await response.json();
      if (result.success) {
        setProcessedResults(result.data);
        setSummary(result.summary);
        setStep(4); // Move to final structured layout
      } else {
        alert("Something went wrong during normalization.");
        setStep(2);
      }
    } catch (error) {
      console.error("Frontend Integration Error:", error);
      alert("Failed to connect to the backend server.");
      setStep(2);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      {/* Upper Navigation Bar */}
      <header className="max-w-7xl mx-auto mb-10 border-b border-slate-800 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">GrowEasy <span className="text-emerald-400">CRM Importer</span></h1>
          <p className="text-sm text-slate-400 mt-1">Intelligent AI-powered data normalization engine</p>
        </div>
        <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-400">
          Step {step} of 4
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* STEP 1: UPLOAD LAYOUT */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 bg-slate-900/40 rounded-xl p-16 text-center hover:border-emerald-500/50 transition-colors">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-1">Upload your Lead Export CSV</h3>
            <p className="text-sm text-slate-400 max-w-xs mb-6">Supports Facebook Ads, Google Ads, Real Estate exports, and messy custom formats.</p>
            <label className="cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-5 py-2.5 rounded-lg text-sm shadow-lg shadow-emerald-500/10 transition-all">
              Browse CSV File
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}

        {/* STEP 2 & 3: PREVIEW TABLE & PROCESSING */}
        {(step === 2 || step === 3) && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 p-4 border border-slate-800 rounded-xl">
              <div>
                <h3 className="text-md font-semibold text-white">Raw CSV Preview ({csvData.length} records detected)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Review the raw structure before passing data to the AI parsing engine.</p>
              </div>
              <button
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-semibold px-6 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    AI is Normalizing Records...
                  </>
                ) : (
                  "Confirm & Import via AI"
                )}
              </button>
            </div>

            {/* Sticky Header Scrollable Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50 max-h-[500px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
                    {headers.map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap bg-slate-900">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {csvData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      {headers.map((h) => (
                        <td key={h} className="px-4 py-3 text-slate-300 whitespace-nowrap max-w-[200px] truncate">
                          {row[h] || <span className="text-slate-600 italic">empty</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 4: FINAL NORMALIZED RESULTS */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Evaluated</span>
                <div className="text-3xl font-bold text-white mt-1">{csvData.length}</div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-xl">
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Successfully Imported</span>
                <div className="text-3xl font-bold text-emerald-400 mt-1">{summary?.totalImported}</div>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-xl">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Skipped (No Email/Phone)</span>
                <div className="text-3xl font-bold text-amber-500 mt-1">{summary?.totalSkipped}</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-md font-semibold text-white">AI Normalized GrowEasy Format</h3>
                <p className="text-xs text-slate-400 mt-0.5">All column headers and layout rules have been successfully normalized by Gemini.</p>
              </div>
              <button 
                onClick={() => setStep(1)} 
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium px-4 py-2 rounded-lg text-sm transition-all"
              >
                Reset & Import Another
              </button>
            </div>

            {/* Normalized Data Display Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50 max-h-[500px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900">Phone</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900">Source</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900">CRM Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {processedResults.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{row.name || "-"}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{row.email || "-"}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        {row.country_code ? `(${row.country_code}) ` : ""}{row.mobile_without_country_code || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          row.crm_status === 'SALE_DONE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          row.crm_status === 'GOOD_LEAD_FOLLOW_UP' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          row.crm_status === 'DID_NOT_CONNECT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {row.crm_status || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono whitespace-nowrap">{row.data_source || "blank"}</td>
                      <td className="px-4 py-3 text-slate-400 max-w-[250px] truncate" title={row.crm_note}>{row.crm_note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}