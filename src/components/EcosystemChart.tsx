'use client';

import React, { useRef } from 'react';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useEcosystemStore } from '../lib/useEcosystemStore';
import { getContrastColor } from '../lib/colorFromString';

export default function EcosystemChart() {
  const { categories } = useEcosystemStore();
  const chartRef = useRef<HTMLDivElement>(null);

  const exportChart = async () => {
    if (!chartRef.current) return;

    try {
      // Temporarily scale up for better quality
      const originalTransform = chartRef.current.style.transform;
      chartRef.current.style.transform = 'scale(2)';
      chartRef.current.style.transformOrigin = 'top left';

      const canvas = await html2canvas(chartRef.current, {
        scale: 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
      });

      // Restore original transform
      chartRef.current.style.transform = originalTransform;

      // Download the image
      const link = document.createElement('a');
      link.download = 'ecosystem-chart.png';
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-lg">Upload company data to see your ecosystem chart</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ecosystem Chart</h2>
        <button
          onClick={exportChart}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export PNG</span>
        </button>
      </div>

      <div
        ref={chartRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-white p-6 rounded-lg"
      >
        {categories.map((category) => {
          const textColor = getContrastColor(category.color);
          
          return (
            <div
              key={category.name}
              className="rounded-lg p-6 shadow-lg"
              style={{ backgroundColor: category.color }}
            >
              <h3
                className="text-xl font-bold mb-4 text-center"
                style={{ color: textColor }}
              >
                {category.name}
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                {category.companies.map((company) => (
                  <div
                    key={company.id}
                    className="bg-white bg-opacity-90 rounded-lg p-3 flex flex-col items-center text-center"
                  >
                    {company.logoUrl ? (
                      <div className="mb-2">
                        <img
                          src={company.logoUrl}
                          alt={company.company_name}
                          className="max-h-10 max-w-full object-contain"
                        />
                      </div>
                    ) : null}
                    <span className="text-sm font-medium text-gray-800">
                      {company.company_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
