
'use client';

import React, { useState, useRef } from 'react';
import { GripVertical, Columns2, Columns } from 'lucide-react';
import { useEcosystemStore } from '../lib/useEcosystemStore';
import { Category, CategoryCustomization } from '../lib/types';

interface ResizableCategoryProps {
  category: Category;
  customization: CategoryCustomization;
  categoryIndex: number;
}

export default function ResizableCategory({ 
  category, 
  customization, 
  categoryIndex 
}: ResizableCategoryProps) {
  const { updateCategoryCustomization } = useEcosystemStore();
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'e' | 's' | null>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const startMousePos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });

  const handleMouseDown = (e: React.MouseEvent, direction: 'se' | 'e' | 's') => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    startMousePos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { 
      width: customization.width || 320, 
      height: customization.height || 288 
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startMousePos.current.x;
      const deltaY = e.clientY - startMousePos.current.y;
      
      let newWidth = startSize.current.width;
      let newHeight = startSize.current.height;

      if (direction === 'se' || direction === 'e') {
        newWidth = Math.max(200, startSize.current.width + deltaX);
      }
      if (direction === 'se' || direction === 's') {
        newHeight = Math.max(150, startSize.current.height + deltaY);
      }

      updateCategoryCustomization(category.name, {
        width: newWidth,
        height: newHeight
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleTwoColumn = () => {
    updateCategoryCustomization(category.name, {
      twoColumn: !customization.twoColumn
    });
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

  const dynamicSizes = getDynamicSizes(customization.size);

  return (
    <div
      ref={categoryRef}
      className={`group relative rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in ${isResizing ? 'scale-105' : ''}`}
      style={{ 
        backgroundColor: customization.backgroundColor,
        borderColor: customization.borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        animationDelay: `${categoryIndex * 150}ms`,
        transform: `translate(${customization.position.x}px, ${customization.position.y}px)`,
        width: customization.width || 320,
        height: customization.height || 288,
        minWidth: '200px',
        minHeight: '150px'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
      
      {/* Controls */}
      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={toggleTwoColumn}
          className="p-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
          title={customization.twoColumn ? "Switch to single column" : "Switch to two columns"}
        >
          {customization.twoColumn ? (
            <Columns className="h-3 w-3 text-white" />
          ) : (
            <Columns2 className="h-3 w-3 text-white" />
          )}
        </button>
      </div>

      <div className={`relative h-full flex flex-col ${dynamicSizes.padding}`}>
        <h3
          className={`${dynamicSizes.titleFont} font-bold mb-6 text-center`}
          style={{ color: customization.textColor }}
        >
          {category.name}
        </h3>
        
        <div className={`flex-1 ${dynamicSizes.spacing} overflow-y-auto`}>
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
              
              <div className={`grid gap-3 ${customization.twoColumn ? 'grid-cols-2' : 'grid-cols-1'}`}>
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
      
      {/* Resize Handles */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Bottom-right corner resize */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleMouseDown(e, 'se')}
        >
          <GripVertical className="w-3 h-3 text-white/60 transform rotate-45" />
        </div>
        
        {/* Right edge resize */}
        <div
          className="absolute top-1/2 right-0 w-2 h-8 cursor-e-resize pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2"
          onMouseDown={(e) => handleMouseDown(e, 'e')}
        >
          <div className="w-1 h-full bg-white/30 rounded-full mx-auto" />
        </div>
        
        {/* Bottom edge resize */}
        <div
          className="absolute bottom-0 left-1/2 w-8 h-2 cursor-s-resize pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
          onMouseDown={(e) => handleMouseDown(e, 's')}
        >
          <div className="w-full h-1 bg-white/30 rounded-full" />
        </div>
      </div>

      <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full" />
      <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/20 rounded-full" />
    </div>
  );
}
