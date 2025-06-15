
'use client';

import React, { useRef, useState } from 'react';
import { Download, Share2, Sparkles, Settings2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useEcosystemStore } from '../lib/useEcosystemStore';
import { getContrastColor } from '../lib/colorFromString';
import ChartCustomizationPanel from './ChartCustomizationPanel';
import ResizableCategory from './ResizableCategory';

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

        {/* Chart Content with absolute positioning for free movement */}
        <div
          ref={chartRef}
          className="relative bg-white"
          style={{ minHeight: '800px', height: '1200px' }}
        >
          {categories.map((category, categoryIndex) => {
            const customization = chartCustomization.categories[category.name] || {
              backgroundColor: category.color,
              borderColor: category.color,
              textColor: getContrastColor(category.color),
              size: 'medium' as const,
              position: { 
                x: (categoryIndex % 3) * 380 + 50, 
                y: Math.floor(categoryIndex / 3) * 350 + 50 
              },
              width: 320,
              height: 288,
              twoColumn: false
            };
            
            return (
              <ResizableCategory
                key={category.name}
                category={category}
                customization={customization}
                categoryIndex={categoryIndex}
              />
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
