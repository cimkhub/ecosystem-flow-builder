'use client';

import React, { useState } from 'react';
import { Building2, Upload, Image } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import LogoUploader from '../components/LogoUploader';
import EcosystemChart from '../components/EcosystemChart';
import { useEcosystemStore } from '../lib/useEcosystemStore';

export default function Index() {
  const [activeTab, setActiveTab] = useState<'data' | 'logos' | 'chart'>('data');
  const { companies, categories } = useEcosystemStore();

  const tabs = [
    { id: 'data', label: 'Upload Data', icon: Upload, count: companies.length },
    { id: 'logos', label: 'Add Logos', icon: Image, disabled: companies.length === 0 },
    { id: 'chart', label: 'View Chart', icon: Building2, count: categories.length, disabled: companies.length === 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Ecosystem Chart Builder
          </h1>
          <p className="text-lg text-gray-600">
            Create beautiful market-map visualizations from your company data
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center mb-8 bg-white rounded-lg p-2 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                disabled={tab.disabled}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : tab.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`
                    px-2 py-1 rounded-full text-xs
                    ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'}
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {activeTab === 'data' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Upload Company Data</h2>
                <FileUploader />
              </div>
            )}

            {activeTab === 'logos' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Upload Company Logos</h2>
                <LogoUploader />
              </div>
            )}

            {activeTab === 'chart' && <EcosystemChart />}
          </div>
        </div>
      </div>
    </div>
  );
}
