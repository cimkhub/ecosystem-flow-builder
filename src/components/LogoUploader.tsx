'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image, X, Upload } from 'lucide-react';
import { useEcosystemStore } from '../lib/useEcosystemStore';

export default function LogoUploader() {
  const { logos, addLogo, removeLogo, companies } = useEcosystemStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').toLowerCase();
      
      // Try to match by logo_filename first, then by company name
      const matchingCompany = companies.find(company => 
        company.logo_filename?.toLowerCase() === nameWithoutExt ||
        company.company_name.toLowerCase() === nameWithoutExt
      );

      if (matchingCompany) {
        addLogo(matchingCompany.logo_filename || matchingCompany.company_name, file);
      } else {
        // For unmatched files, use the filename as key
        addLogo(file.name, file);
      }
    });
  }, [companies, addLogo]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg'],
    },
    multiple: true,
  });

  const logoArray = Array.from(logos.entries());

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-3">
          <Upload className="h-8 w-8 text-gray-400" />
          <div>
            <p className="font-medium">
              {isDragActive ? 'Drop logos here' : 'Upload company logos'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, SVG files. Name files to match company names.
            </p>
          </div>
        </div>
      </div>

      {logoArray.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {logoArray.map(([filename, file]) => (
            <div key={filename} className="relative group">
              <div className="bg-white border rounded-lg p-2 hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-50 rounded flex items-center justify-center mb-2">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={filename}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <p className="text-xs text-gray-600 truncate" title={filename}>
                  {filename}
                </p>
                <button
                  onClick={() => removeLogo(filename)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {companies.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 text-sm">
          <h3 className="font-medium text-blue-800 mb-1">Logo Matching Tips:</h3>
          <ul className="text-blue-700 space-y-1 text-xs">
            <li>• Name image files to match company names exactly</li>
            <li>• Or use the logo_filename specified in your data</li>
            <li>• Supported formats: PNG, JPG, SVG</li>
          </ul>
        </div>
      )}
    </div>
  );
}
