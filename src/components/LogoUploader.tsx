'use client';

import React, { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image, X, Upload, Sparkles, CheckCircle2, FolderOpen } from 'lucide-react';
import { useEcosystemStore } from '../lib/useEcosystemStore';

export default function LogoUploader() {
  const { logos, addLogo, removeLogo, companies } = useEcosystemStore();
  const folderInputRef = useRef<HTMLInputElement>(null);

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

  const handleFolderSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files).filter(file => 
      file.type.startsWith('image/') || 
      file.name.toLowerCase().endsWith('.png') ||
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg') ||
      file.name.toLowerCase().endsWith('.svg')
    );

    fileArray.forEach(file => {
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

    // Reset the input
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
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
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Drag & Drop Area */}
        <div
          {...getRootProps()}
          className={`
            relative group border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden
            ${isDragActive 
              ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 scale-105' 
              : 'border-gray-200 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-pink-50/50 hover:scale-102'
            }
          `}
        >
          <input {...getInputProps()} />
          
          <div className="relative flex flex-col items-center space-y-4">
            <div className="relative">
              <div className={`
                h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110
                ${isDragActive 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 group-hover:from-purple-100 group-hover:to-pink-100 group-hover:text-purple-600'
                }
              `}>
                <Image className="h-6 w-6" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDragActive ? 'text-purple-700' : 'text-gray-800'
              }`}>
                {isDragActive ? 'Drop files here' : 'Drag & Drop'}
              </h3>
              
              <p className={`text-sm transition-colors duration-300 ${
                isDragActive ? 'text-purple-600' : 'text-gray-500'
              }`}>
                Individual logo files
              </p>
            </div>
          </div>
        </div>

        {/* Folder Selection */}
        <div className="relative group border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-indigo-50/50 hover:scale-102">
          <input
            ref={folderInputRef}
            type="file"
            {...({ webkitdirectory: "" } as any)}
            multiple
            onChange={handleFolderSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/*"
          />
          
          <div className="relative flex flex-col items-center space-y-4 pointer-events-none">
            <div className="relative">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 group-hover:from-blue-200 group-hover:to-indigo-200 group-hover:text-blue-700 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <FolderOpen className="h-6 w-6" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-800 transition-colors duration-300">
                Select Folder
              </h3>
              
              <p className="text-sm text-gray-500 transition-colors duration-300">
                Upload entire logo folder
              </p>
            </div>
          </div>
        </div>
      </div>

      {logoArray.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {logoArray.map(([filename, file], index) => (
            <div 
              key={filename} 
              className="relative group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:shadow-lg hover:border-purple-200 transition-all duration-300 hover:scale-105">
                <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={filename}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <p className="text-xs text-gray-600 truncate font-medium" title={filename}>
                  {filename}
                </p>
                
                {/* Success indicator */}
                <div className="absolute top-2 left-2 bg-green-100 text-green-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                
                <button
                  onClick={() => removeLogo(filename)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {companies.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <h3 className="font-semibold text-purple-800 mb-3 flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>Logo Matching Tips</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <div className="font-medium text-purple-700 mb-1">Folder Upload</div>
              <div className="text-purple-600 text-xs">Select entire folder with all logos</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <div className="font-medium text-purple-700 mb-1">File Naming</div>
              <div className="text-purple-600 text-xs">Name files to match company names exactly</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <div className="font-medium text-purple-700 mb-1">Auto-matching</div>
              <div className="text-purple-600 text-xs">Uses logo_filename or company name</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
