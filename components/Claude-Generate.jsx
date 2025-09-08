// pages/claude-generation.js (or app/claude-generation/page.js for App Router)
'use client'

import { useState, useRef } from 'react';

export default function ClaudeGeneration() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileType, setFileType] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const extension = file.name.split('.').pop().toLowerCase();
      
      if (extension === 'json') {
        // Parse JSON file
        const jsonData = JSON.parse(text);
        setResponse(jsonData);
        setFileType('json');
      } else {
        // Handle as text file
        setResponse(text);
        setFileType('text');
      }
    } catch (err) {
      setError('Error reading file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const clearResponse = () => {
    setResponse(null);
    setError(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderResponse = () => {
    if (!response) return null;

    if (fileType === 'json') {
      return (
        <div className="bg-gray-50 rounded-lg p-6 border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">JSON Response</h3>
          <pre className="bg-gray-800 text-green-400 p-4 rounded-md overflow-x-auto text-sm">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 rounded-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Claude Response</h3>
        <div className="bg-white p-4 rounded-md border prose max-w-none">
          <pre className="whitespace-pre-wrap text-gray-700 font-mono text-sm">
            {response}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Claude Response Viewer
          </h1>
          <p className="text-gray-600">
            Upload your Claude Desktop generated file to view the response
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="text-center">
            {!response ? (
              <>
                <div className="mb-6">
                  <svg 
                    className="w-16 h-16 text-orange-500 mx-auto mb-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                    />
                  </svg>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    Step 1: Generate Response
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Use Claude Desktop with MCP to generate your response file
                  </p>
                </div>
                
                <button
                  onClick={triggerFileUpload}
                  disabled={loading}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-orange-600 text-white shadow-lg hover:bg-orange-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg 
                        className="w-5 h-5" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                      Upload Response File
                    </>
                  )}
                </button>
                
                <p className="text-sm text-gray-500 mt-2">
                  Supports .txt and .json files
                </p>
              </>
            ) : (
              <div className="flex justify-center gap-4">
                <button
                  onClick={triggerFileUpload}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Upload New File
                </button>
                <button
                  onClick={clearResponse}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear Response
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Response Display */}
        {response && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {renderResponse()}
          </div>
        )}

        {/* Instructions */}
        {!response && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">How it works:</h3>
            <div className="space-y-3 text-gray-600">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                <p>Use Claude Desktop with MCP to generate your response</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                <p>Save the output as a .txt or .json file</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                <p>Upload the file here to view the formatted response</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}