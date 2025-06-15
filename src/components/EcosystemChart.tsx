
'use client';

import React, { useRef, useState } from 'react';
import { Download, Share2, Sparkles, Settings2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useEcosystemStore } from '../lib/useEcosystemStore';
import { getContrastColor } from '../lib/colorFromString';
import ChartCustomizationPanel from './ChartCustomizationPanel';
import { ScrollArea } from './ui/scroll-area';

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
      case 'small': return { container: 'col-span-1 max-w-xs', width: 'w-80', height: 'min-h-72' };
      case 'medium': return { container: 'col-span-1 max-w-sm', width: 'w-96', height: 'min-h-80' };
      case 'large': return { container: 'col-span-1 max-w-md', width: 'w-[26rem]', height: 'min-h-96' };
      default: return { container: 'col-span-1 max-w-sm', width: 'w-96', height: 'min-h-80' };
    }
  };

  const getDynamicSizes = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small': return { 
        titleFont: 'text-lg', 
        subtitleFont: 'text-sm', 
        companyFont: 'text-xs', 
        logoSize: 'max-h-6 max-w-20',
        padding: 'p-4',
        spacing: 'space-y-4',
        companyPadding: 'p-3'
      };
      case 'medium': return { 
        titleFont: 'text-xl', 
        subtitleFont: 'text-base', 
        companyFont: 'text-sm', 
        logoSize: 'max-h-8 max-w-24',
        padding: 'p-6',
        spacing: 'space-y-6',
        companyPadding: 'p-4'
      };
      case 'large': return { 
        titleFont: 'text-2xl', 
        subtitleFont: 'text-lg', 
        companyFont: 'text-base', 
        logoSize: 'max-h-10 max-w-28',
        padding: 'p-8',
        spacing: 'space-y-8',
        companyPadding: 'p-5'
      };
      default: return { 
        titleFont: 'text-xl', 
        subtitleFont: 'text-base', 
        companyFont: 'text-sm', 
        logoSize: 'max-h-8 max-w-24',
        padding: 'p-6',
        spacing: 'space-y-6',
        companyPadding: 'p-4'
      };
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

      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Modern Silicon Valley Style Chart Header */}
        <div className="relative text-center py-16 px-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-cyan-600/10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(120,200,255,0.2),transparent_50%)]"></div>
          
          {/* Floating Elements */}
          <div className="absolute top-8 left-8 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <div className="absolute top-12 right-12 w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="absolute bottom-8 left-16 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></div>
          
          <div className="relative z-10">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-purple-200 mb-4 tracking-tight leading-tight">
              {chartCustomization.title}
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 mx-auto mb-6 rounded-full"></div>
            <p className="text-2xl text-gray-300 font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
              {chartCustomization.subtitle}
            </p>
          </div>
          
          {/* Bottom Gradient Line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        </div>

        {/* Chart Content with better spacing */}
        <div
          ref={chartRef}
          className="p-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-12 justify-items-center">
            {categories.map((category, categoryIndex) => {
              const customization = chartCustomization.categories[category.name] || {
                backgroundColor: category.color,
                borderColor: category.color,
                textColor: getContrastColor(category.color),
                size: 'medium' as const,
                position: { x: 0, y: 0 }
              };
              
              const sizeClasses = getSizeClasses(customization.size);
              const dynamicSizes = getDynamicSizes(customization.size);
              
              return (
                <div
                  key={category.name}
                  className={`group relative rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in ${sizeClasses.container} ${sizeClasses.width} ${sizeClasses.height}`}
                  style={{ 
                    backgroundColor: customization.backgroundColor,
                    borderColor: customization.borderColor,
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    animationDelay: `${categoryIndex * 150}ms`,
                    transform: `translate(${customization.position.x}px, ${customization.position.y}px)`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
                  
                  <div className={`relative h-full flex flex-col ${dynamicSizes.padding}`}>
                    <h3
                      className={`${dynamicSizes.titleFont} font-bold mb-6 text-center`}
                      style={{ color: customization.textColor }}
                    >
                      {category.name}
                    </h3>
                    
                    <div className={`flex-1 ${dynamicSizes.spacing}`}>
                      {category.subcategories?.map((subcategory, subcategoryIndex) => (
                        <div
                          key={subcategory.name}
                          className="animate-fade-in"
                          style={{ animationDelay: `${(categoryIndex * 150) + (subcategoryIndex * 100)}ms` }}
                        >
                          <h4
                            className={`${dynamicSizes.subtitleFont} font-semibold mb-4 text-center uppercase tracking-wide`}
                            style={{ color: customization.textColor, opacity: 0.8 }}
                          >
                            {subcategory.name}
                          </h4>
                          
                          <div className="grid grid-cols-1 gap-3">
                            {subcategory.companies.map((company, companyIndex) => (
                              <div
                                key={company.id}
                                className={`bg-white/95 backdrop-blur-sm rounded-xl ${dynamicSizes.companyPadding} flex flex-col items-center text-center transform transition-all duration-200 hover:scale-105 hover:bg-white animate-fade-in`}
                                style={{ animationDelay: `${(categoryIndex * 150) + (subcategoryIndex * 100) + (companyIndex * 50)}ms` }}
                              >
                                {company.logoUrl ? (
                                  <div className="mb-3 p-2 bg-white rounded-lg shadow-sm">
                                    <img
                                      src={company.logoUrl}
                                      alt={company.company_name}
                                      className={`${dynamicSizes.logoSize} object-contain`}
                                    />
                                  </div>
                                ) : (
                                  <div className={`mb-3 ${customization.size === 'small' ? 'w-6 h-6' : customization.size === 'large' ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center`}>
                                    <span className={`${customization.size === 'small' ? 'text-xs' : customization.size === 'large' ? 'text-base' : 'text-sm'} font-semibold text-gray-600`}>
                                      {company.company_name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <span className={`${dynamicSizes.companyFont} font-medium text-gray-800 leading-relaxed`}>
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
      </div>

      <ChartCustomizationPanel 
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
      />
    </div>
  );
}
