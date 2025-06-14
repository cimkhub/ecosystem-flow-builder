
'use client';

import React, { useRef, useState } from 'react';
import { Download, Share2, Sparkles, Settings2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useEcosystemStore } from '../lib/useEcosystemStore';
import { getContrastColor } from '../lib/colorFromString';
import ChartCustomizationPanel from './ChartCustomizationPanel';

export default function EcosystemChart() {
  const { categories, chartCustomization } = useEcosystemStore();
  const chartRef = useRef<HTMLDivElement>(null);
  const [showCustomization, setShowCustomization] = useState(false);

  const exportChart = async () => {
    if (!chartRef.current) return;

    try {
      const originalTransform = chartRef.current.style.transform;
      chartRef.current.style.transform = 'scale(2)';
      chartRef.current.style.transformOrigin = 'top left';

      const canvas = await html2canvas(chartRef.current, {
        scale: 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
      });

      chartRef.current.style.transform = originalTransform;

      const link = document.createElement('a');
      link.download = `${chartCustomization.title.toLowerCase().replace(/\s+/g, '-')}-ecosystem-chart.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
  };

  const getSizeClasses = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'md:col-span-1 lg:col-span-1';
      case 'large': return 'md:col-span-2 lg:col-span-1';
      default: return 'md:col-span-1 lg:col-span-1';
    }
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
            <Sparkles className="h-12 w-12 text-blue-500" />
          </div>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to visualize</h3>
        <p className="text-gray-600">Upload company data to see your ecosystem chart come to life</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Ecosystem Chart</h2>
          <p className="text-gray-600">Your market visualization is ready</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCustomization(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <Settings2 className="h-4 w-4" />
            <span>Customize</span>
          </button>
          
          <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
          
          <button
            onClick={exportChart}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <Download className="h-4 w-4" />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      <div
        ref={chartRef}
        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
        {/* Chart Header with Title and Subtitle */}
        <div className="text-center py-8 px-8 bg-gradient-to-r from-slate-50 to-gray-100 border-b">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {chartCustomization.title}
          </h1>
          <p className="text-xl text-gray-600">
            {chartCustomization.subtitle}
          </p>
        </div>

        {/* Chart Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
          {categories.map((category, categoryIndex) => {
            const customization = category.customization || {
              backgroundColor: category.color,
              borderColor: category.color,
              textColor: getContrastColor(category.color),
              size: 'medium' as const,
              position: { x: 0, y: 0 }
            };
            
            return (
              <div
                key={category.name}
                className={`group relative rounded-2xl p-6 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in ${getSizeClasses(customization.size)}`}
                style={{ 
                  backgroundColor: customization.backgroundColor,
                  borderColor: customization.borderColor,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  animationDelay: `${categoryIndex * 150}ms`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
                
                <div className="relative">
                  <h3
                    className="text-xl font-bold mb-6 text-center"
                    style={{ color: customization.textColor }}
                  >
                    {category.name}
                  </h3>
                  
                  <div className="space-y-6">
                    {category.subcategories?.map((subcategory, subcategoryIndex) => (
                      <div
                        key={subcategory.name}
                        className="animate-fade-in"
                        style={{ animationDelay: `${(categoryIndex * 150) + (subcategoryIndex * 100)}ms` }}
                      >
                        <h4
                          className="text-sm font-semibold mb-3 text-center uppercase tracking-wide"
                          style={{ color: customization.textColor, opacity: 0.8 }}
                        >
                          {subcategory.name}
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {subcategory.companies.map((company, companyIndex) => (
                            <div
                              key={company.id}
                              className="bg-white/95 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center text-center transform transition-all duration-200 hover:scale-105 hover:bg-white animate-fade-in"
                              style={{ animationDelay: `${(categoryIndex * 150) + (subcategoryIndex * 100) + (companyIndex * 50)}ms` }}
                            >
                              {company.logoUrl ? (
                                <div className="mb-2 p-2 bg-white rounded-lg shadow-sm">
                                  <img
                                    src={company.logoUrl}
                                    alt={company.company_name}
                                    className="max-h-6 max-w-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="mb-2 w-6 h-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                                  <span className="text-xs font-semibold text-gray-600">
                                    {company.company_name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <span className="text-xs font-medium text-gray-800">
                                {company.company_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full" />
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/20 rounded-full" />
              </div>
            );
          })}
        </div>
      </div>

      <ChartCustomizationPanel 
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
      />
    </div>
  );
}
