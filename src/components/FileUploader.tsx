'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useEcosystemStore } from '../lib/useEcosystemStore';
import { csvToJson, validateJsonData } from '../lib/csvToJson';

export default function FileUploader() {
  const { setCompanies, setUploadErrors, uploadErrors } = useEcosystemStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadErrors([]);

    try {
      const content = await file.text();
      
      if (file.name.endsWith('.csv')) {
        const { companies, errors } = csvToJson(content);
        if (errors.length > 0) {
          setUploadErrors(errors);
        } else {
          setCompanies(companies);
        }
      } else if (file.name.endsWith('.json')) {
        const data = JSON.parse(content);
        const { companies, errors } = validateJsonData(data);
        if (errors.length > 0) {
          setUploadErrors(errors);
        } else {
          setCompanies(companies);
        }
      }
    } catch (error) {
      setUploadErrors([`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsProcessing(false);
    }
  }, [setCompanies, setUploadErrors]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          {isProcessing ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          ) : (
            <Upload className="h-12 w-12 text-gray-400" />
          )}
          <div>
            <p className="text-lg font-medium">
              {isDragActive ? 'Drop your file here' : 'Upload company data'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop a CSV or JSON file, or click to browse
            </p>
          </div>
        </div>
      </div>

      {uploadErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Upload Errors</h3>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                {uploadErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <h3 className="font-medium mb-2">Expected file format:</h3>
        <div className="space-y-2">
          <div>
            <span className="font-mono bg-white px-2 py-1 rounded">CSV:</span>
            <span className="ml-2">company_name, category, logo_filename (optional)</span>
          </div>
          <div>
            <span className="font-mono bg-white px-2 py-1 rounded">JSON:</span>
            <span className="ml-2">Array of objects with the same fields</span>
          </div>
        </div>
      </div>
    </div>
  );
}
