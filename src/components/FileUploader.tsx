
'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useEcosystemStore } from '../lib/useEcosystemStore';
import { csvToJson, validateJsonData } from '../lib/csvToJson';

export default function FileUploader() {
  const { setCompanies, setUploadErrors, uploadErrors } = useEcosystemStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadErrors([]);
    setUploadSuccess(false);

    try {
      const content = await file.text();
      
      if (file.name.endsWith('.csv')) {
        const { companies, errors } = csvToJson(content);
        if (errors.length > 0) {
          setUploadErrors(errors);
        } else {
          setCompanies(companies);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        }
      } else if (file.name.endsWith('.json')) {
        const data = JSON.parse(content);
        const { companies, errors } = validateJsonData(data);
        if (errors.length > 0) {
          setUploadErrors(errors);
        } else {
          setCompanies(companies);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
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
    <div className="space-y-8">
      <div
        {...getRootProps()}
        className={`
          relative group border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 overflow-hidden
          ${isDragActive 
            ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 scale-105' 
            : 'border-gray-200 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-purple-50/50 hover:scale-102'
          }
          ${isProcessing ? 'pointer-events-none opacity-75' : ''}
          ${uploadSuccess ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative flex flex-col items-center space-y-6">
          {isProcessing ? (
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200">
                <div className="absolute top-0 left-0 h-16 w-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" />
              </div>
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600 animate-pulse" />
            </div>
          ) : uploadSuccess ? (
            <div className="relative">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className={`
                h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110
                ${isDragActive 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 group-hover:from-blue-100 group-hover:to-purple-100 group-hover:text-blue-600'
                }
              `}>
                <Upload className="h-8 w-8" />
              </div>
              
              {/* Floating particles */}
              <div className="absolute -top-2 -right-2 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className={`text-xl font-semibold transition-colors duration-300 ${
              isDragActive ? 'text-blue-700' : uploadSuccess ? 'text-green-700' : 'text-gray-800'
            }`}>
              {isDragActive 
                ? 'Drop your file here' 
                : uploadSuccess 
                ? 'Upload successful!'
                : isProcessing 
                ? 'Processing your data...' 
                : 'Upload company data'
              }
            </h3>
            
            <p className={`text-sm transition-colors duration-300 ${
              isDragActive ? 'text-blue-600' : uploadSuccess ? 'text-green-600' : 'text-gray-500'
            }`}>
              {uploadSuccess 
                ? 'Your data has been imported successfully'
                : 'Drag and drop a CSV or JSON file, or click to browse'
              }
            </p>
          </div>

          {/* File format badges */}
          <div className="flex space-x-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">CSV</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">JSON</span>
          </div>
        </div>
      </div>

      {uploadErrors.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 animate-fade-in">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-800 mb-2">Upload Errors</h3>
              <ul className="space-y-1">
                {uploadErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700 flex items-start space-x-2">
                    <span className="w-1 h-1 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span>Expected file format</span>
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-xs font-semibold">CSV</span>
              <span className="text-sm text-gray-600">Comma-separated values</span>
            </div>
            <code className="text-xs text-gray-700 bg-gray-50 p-2 rounded block">
              company_name, category, logo_filename
            </code>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-mono text-xs font-semibold">JSON</span>
              <span className="text-sm text-gray-600">Array of objects</span>
            </div>
            <code className="text-xs text-gray-700 bg-gray-50 p-2 rounded block">
              [{"company_name": "...", "category": "..."}]
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
