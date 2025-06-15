
'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Settings, MapPin } from 'lucide-react';
import { useEcosystemStore } from '../lib/useEcosystemStore';
import { ColumnMapping } from '../lib/types';

interface ColumnMapperProps {
  onMappingComplete?: () => void;
}

export default function ColumnMapper({ onMappingComplete }: ColumnMapperProps) {
  const { rawData, csvColumns, mapColumnsAndCreateCompanies, setShowColumnMapper } = useEcosystemStore();
  const [mapping, setMapping] = useState<ColumnMapping>({
    company_name: '',
    category: '',
    subcategory: '',
    logo_filename: '',
  });

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setMapping(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmMapping = () => {
    if (!mapping.company_name || !mapping.category) {
      return;
    }
    mapColumnsAndCreateCompanies(mapping);
    setShowColumnMapper(false);
    // Call the callback to switch to logos tab
    if (onMappingComplete) {
      onMappingComplete();
    }
  };

  const isValid = mapping.company_name && mapping.category;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          <MapPin className="h-6 w-6 text-blue-600" />
          <span className="text-sm font-semibold uppercase tracking-wider">Column Mapping</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Map Your Data Columns</h2>
        <p className="text-gray-600">Tell us which columns contain your company information</p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Data Preview */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <span>Your Data Preview</span>
            </h3>
            <div className="bg-white rounded-xl p-4 border border-blue-200 max-h-64 overflow-auto">
              <div className="text-xs font-medium text-gray-500 mb-2">
                Columns found: {csvColumns.join(', ')}
              </div>
              <div className="space-y-2">
                {rawData.slice(0, 3).map((row, index) => (
                  <div key={index} className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                    {Object.entries(row).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span className="text-gray-600">{value}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column Mapping */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <ArrowRight className="h-5 w-5 text-purple-600" />
              <span>Map to Fields</span>
            </h3>
            <div className="space-y-4">
              {/* Company Name - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={mapping.company_name}
                  onChange={(e) => handleMappingChange('company_name', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select column...</option>
                  {csvColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Category - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={mapping.category}
                  onChange={(e) => handleMappingChange('category', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select column...</option>
                  {csvColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory <span className="text-gray-400">(optional)</span>
                </label>
                <select
                  value={mapping.subcategory || ''}
                  onChange={(e) => handleMappingChange('subcategory', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select column...</option>
                  {csvColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Logo Filename - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo Filename <span className="text-gray-400">(optional)</span>
                </label>
                <select
                  value={mapping.logo_filename || ''}
                  onChange={(e) => handleMappingChange('logo_filename', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select column...</option>
                  {csvColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={() => setShowColumnMapper(false)}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Back to Upload
          </button>
          
          <button
            onClick={handleConfirmMapping}
            disabled={!isValid}
            className={`
              flex items-center space-x-2 px-8 py-3 rounded-xl font-medium transition-all duration-200
              ${isValid 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:scale-105' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>Confirm Mapping</span>
          </button>
        </div>
      </div>
    </div>
  );
}
