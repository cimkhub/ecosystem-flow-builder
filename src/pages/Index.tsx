'use client';

import React, { useState } from 'react';
import { Building2, Upload, Image, Sparkles, Zap, TrendingUp } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import LogoUploader from '../components/LogoUploader';
import EcosystemChart from '../components/EcosystemChart';
import { useEcosystemStore } from '../lib/useEcosystemStore';

export default function Index() {
  const [activeTab, setActiveTab] = useState<'data' | 'logos' | 'chart'>('data');
  const { companies, categories, showColumnMapper } = useEcosystemStore();

  const handleMappingComplete = () => {
    setActiveTab('logos');
  };

  const handleViewChart = () => {
    setActiveTab('chart');
  };

  const tabs = [
    { 
      id: 'data', 
      label: 'Upload Data', 
      icon: Upload, 
      count: companies.length,
      description: 'Import your company data'
    },
    { 
      id: 'logos', 
      label: 'Add Logos', 
      icon: Image, 
      disabled: companies.length === 0,
      description: 'Upload company logos'
    },
    { 
      id: 'chart', 
      label: 'View Chart', 
      icon: Building2, 
      count: categories.length, 
      disabled: companies.length === 0,
      description: 'Generate visualization'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-blue-500/20 to-transparent rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 animate-fade-in">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-semibold uppercase tracking-wider">Build by a data guy</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 animate-fade-in">
              Ecosystem Chart
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                Builder
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed animate-fade-in">
              Transform companies into stunning ecosystem-map visualizations. Trusted by over 500 ecosystem builders worldwide.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 animate-fade-in">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>Lightning Fast</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Enterprise Ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span>AI Enhanced</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center mb-12">
            <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-white/20">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                  disabled={tab.disabled}
                  className={`
                    group relative flex items-center space-x-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 min-w-[180px]
                    ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                      : tab.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:scale-102'
                    }
                  `}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animation: 'fade-in 0.6s ease-out forwards'
                  }}
                >
                  <div className={`
                    p-2 rounded-lg transition-all duration-300
                    ${activeTab === tab.id
                      ? 'bg-white/20'
                      : 'bg-gray-100 group-hover:bg-gray-200'
                    }
                  `}>
                    <tab.icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium transition-all duration-300
                          ${activeTab === tab.id 
                            ? 'bg-white/20 text-white' 
                            : 'bg-blue-100 text-blue-600'
                          }
                        `}>
                          {tab.count}
                        </span>
                      )}
                    </div>
                    <p className={`
                      text-xs mt-1 transition-all duration-300
                      ${activeTab === tab.id ? 'text-white/80' : 'text-gray-500'}
                    `}>
                      {tab.description}
                    </p>
                  </div>

                  {activeTab === tab.id && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="relative">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600" />
              
              <div className="p-8 md:p-12">
                {activeTab === 'data' && (
                  <div className="animate-fade-in">
                    {!showColumnMapper && (
                      <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Upload Company Data</h2>
                        <p className="text-gray-600">Import your company data to get started with visualization</p>
                      </div>
                    )}
                    <FileUploader onMappingComplete={handleMappingComplete} />
                  </div>
                )}

                {activeTab === 'logos' && (
                  <div className="animate-fade-in">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-900 mb-3">Upload Company Logos</h2>
                      <p className="text-gray-600">Add logos to make your ecosystem chart more professional</p>
                    </div>
                    <LogoUploader onViewChart={handleViewChart} />
                  </div>
                )}

                {activeTab === 'chart' && (
                  <div className="animate-fade-in">
                    <EcosystemChart />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
