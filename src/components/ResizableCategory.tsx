
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Move } from 'lucide-react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'e' | 's' | null>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startMousePos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const startPosition = useRef({ x: 0, y: 0 });
  const [optimalColumns, setOptimalColumns] = useState(2);

  // Calculate optimal number of columns based on available space and content
  useEffect(() => {
    if (!contentRef.current) return;
    
    const availableWidth = (customization.width || 320) - 48; // Subtract padding
    const availableHeight = (customization.height || 288) - 120; // Subtract header and padding
    
    const totalCompanies = category.subcategories?.reduce((total, sub) => total + sub.companies.length, 0) || 0;
    
    if (totalCompanies === 0) {
      setOptimalColumns(1);
      return;
    }

    // Calculate item dimensions based on size
    const itemHeight = customization.size === 'small' ? 56 : customization.size === 'large' ? 80 : 68;
    const itemWidth = 120; // Approximate width for company items
    
    // Try different column counts to find the best fit
    let bestColumns = 1;
    let bestFit = 0;
    
    for (let cols = 1; cols <= Math.min(6, Math.floor(availableWidth / itemWidth)); cols++) {
      const itemsPerColumn = Math.ceil(totalCompanies / cols);
      const neededHeight = itemsPerColumn * itemHeight;
      const neededWidth = cols * itemWidth;
      
      // Check if it fits and calculate how well it utilizes space
      if (neededHeight <= availableHeight && neededWidth <= availableWidth) {
        const utilization = (neededHeight / availableHeight) * (neededWidth / availableWidth);
        if (utilization > bestFit) {
          bestFit = utilization;
          bestColumns = cols;
        }
      }
    }
    
    // If user has manually set twoColumn, respect that unless it's clearly better to use optimal
    if (customization.twoColumn && bestColumns <= 2) {
      setOptimalColumns(2);
    } else {
      setOptimalColumns(bestColumns);
    }
  }, [category.subcategories, customization.width, customization.height, customization.size, customization.twoColumn]);

  const handleMouseDown = (e: React.MouseEvent, direction: 'se' | 'e' | 's') => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleDragStart = (e: React.MouseEvent) => {
    if (isResizing) return;
    e.preventDefault();
    setIsDragging(true);
    startMousePos.current = { x: e.clientX, y: e.clientY };
    startPosition.current = { x: customization.position.x, y: customization.position.y };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startMousePos.current.x;
      const deltaY = e.clientY - startMousePos.current.y;
      
      const newX = startPosition.current.x + deltaX;
      const newY = startPosition.current.y + deltaY;

      updateCategoryCustomization(category.name, {
        position: { x: newX, y: newY }
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const cycleColumns = () => {
    const maxColumns = Math.min(6, Math.floor(((customization.width || 320) - 48) / 120));
    let nextColumns = optimalColumns + 1;
    if (nextColumns > maxColumns) {
      nextColumns = 1;
    }
    setOptimalColumns(nextColumns);
    
    updateCategoryCustomization(category.name, {
      twoColumn: nextColumns === 2
    });
  };

  const getDynamicSizes = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small': return { 
        titleFont: 'text-lg', 
        subtitleFont: 'text-xs', 
        companyFont: 'text-xs', 
        logoSize: 'max-h-6 max-w-20',
        padding: 'p-4',
        companyPadding: 'p-2'
      };
      case 'medium': return { 
        titleFont: 'text-xl', 
        subtitleFont: 'text-sm', 
        companyFont: 'text-xs', 
        logoSize: 'max-h-8 max-w-24',
        padding: 'p-6',
        companyPadding: 'p-2'
      };
      case 'large': return { 
        titleFont: 'text-2xl', 
        subtitleFont: 'text-base', 
        companyFont: 'text-sm', 
        logoSize: 'max-h-10 max-w-28',
        padding: 'p-8',
        companyPadding: 'p-3'
      };
      default: return { 
        titleFont: 'text-xl', 
        subtitleFont: 'text-sm', 
        companyFont: 'text-xs', 
        logoSize: 'max-h-8 max-w-24',
        padding: 'p-6',
        companyPadding: 'p-2'
      };
    }
  };

  const dynamicSizes = getDynamicSizes(customization.size);
  const columnsToUse = optimalColumns;

  // Group all companies for display with subcategory grouping
  const allCompanies = category.subcategories?.flatMap(sub => 
    sub.companies.map(company => ({ ...company, subcategoryName: sub.name }))
  ) || [];

  return (
    <div
      ref={categoryRef}
      className={`group absolute rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in cursor-move ${isDragging ? 'scale-105 z-50' : ''} ${isResizing ? 'scale-105' : ''}`}
      style={{ 
        backgroundColor: customization.backgroundColor,
        borderColor: customization.borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        animationDelay: `${categoryIndex * 150}ms`,
        left: customization.position.x,
        top: customization.position.y,
        width: customization.width || 320,
        height: customization.height || 288,
        minWidth: '200px',
        minHeight: '150px'
      }}
      onMouseDown={handleDragStart}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
      
      {/* Controls */}
      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={cycleColumns}
          className="p-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
          title={`Switch to ${columnsToUse === 1 ? '2' : columnsToUse + 1} columns`}
        >
          <span className="text-xs font-bold text-white">{columnsToUse}</span>
        </button>
        <div className="p-1 bg-white/20 rounded">
          <Move className="h-3 w-3 text-white" />
        </div>
      </div>

      <div className={`relative h-full flex flex-col ${dynamicSizes.padding}`}>
        {/* Main Category Title */}
        <h3
          className={`${dynamicSizes.titleFont} font-bold mb-2 text-center cursor-move`}
          style={{ color: customization.textColor }}
        >
          {category.name}
        </h3>
        
        {/* Category Subtitle */}
        <h4
          className={`${dynamicSizes.subtitleFont} font-semibold mb-4 text-center uppercase tracking-wide`}
          style={{ color: customization.textColor, opacity: 0.8 }}
        >
          {category.name.toUpperCase()}
        </h4>
        
        <div 
          ref={contentRef}
          className="flex-1 overflow-hidden"
        >
          {/* Show subcategories as grouped sections if they exist, otherwise show all companies */}
          {category.subcategories && category.subcategories.length > 1 ? (
            // Multiple subcategories - show them as organized sections
            <div className="space-y-4">
              {category.subcategories.map((subcategory, subcategoryIndex) => (
                <div
                  key={subcategory.name}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(categoryIndex * 150) + (subcategoryIndex * 100)}ms` }}
                >
                  <h5
                    className={`${dynamicSizes.subtitleFont} font-medium mb-2 text-left`}
                    style={{ color: customization.textColor, opacity: 0.7 }}
                  >
                    {subcategory.name}
                  </h5>
                  
                  <div 
                    className={`grid gap-2 mb-3`}
                    style={{ 
                      gridTemplateColumns: `repeat(${columnsToUse}, 1fr)` 
                    }}
                  >
                    {subcategory.companies.map((company, companyIndex) => (
                      <div
                        key={company.id}
                        className={`bg-white/95 backdrop-blur-sm rounded-lg ${dynamicSizes.companyPadding} flex flex-col items-center text-center transform transition-all duration-200 hover:scale-105 hover:bg-white animate-fade-in`}
                        style={{ animationDelay: `${(categoryIndex * 150) + (subcategoryIndex * 100) + (companyIndex * 50)}ms` }}
                      >
                        {company.logoUrl ? (
                          <div className="mb-1 p-1 bg-white rounded-md shadow-sm">
                            <img
                              src={company.logoUrl}
                              alt={company.company_name}
                              className={`${dynamicSizes.logoSize} object-contain`}
                            />
                          </div>
                        ) : (
                          <div className={`mb-1 ${customization.size === 'small' ? 'w-6 h-6' : customization.size === 'large' ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-br from-gray-200 to-gray-300 rounded-md flex items-center justify-center`}>
                            <span className={`${customization.size === 'small' ? 'text-xs' : customization.size === 'large' ? 'text-base' : 'text-sm'} font-semibold text-gray-600`}>
                              {company.company_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span className={`${dynamicSizes.companyFont} font-medium text-gray-800 leading-tight text-center`}>
                          {company.company_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Single subcategory or no subcategories - show all companies in a grid
            <div 
              className={`grid gap-2`}
              style={{ 
                gridTemplateColumns: `repeat(${columnsToUse}, 1fr)` 
              }}
            >
              {allCompanies.map((company, companyIndex) => (
                <div
                  key={company.id}
                  className={`bg-white/95 backdrop-blur-sm rounded-lg ${dynamicSizes.companyPadding} flex flex-col items-center text-center transform transition-all duration-200 hover:scale-105 hover:bg-white animate-fade-in`}
                  style={{ animationDelay: `${(categoryIndex * 150) + (companyIndex * 50)}ms` }}
                >
                  {company.logoUrl ? (
                    <div className="mb-1 p-1 bg-white rounded-md shadow-sm">
                      <img
                        src={company.logoUrl}
                        alt={company.company_name}
                        className={`${dynamicSizes.logoSize} object-contain`}
                      />
                    </div>
                  ) : (
                    <div className={`mb-1 ${customization.size === 'small' ? 'w-6 h-6' : customization.size === 'large' ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-br from-gray-200 to-gray-300 rounded-md flex items-center justify-center`}>
                      <span className={`${customization.size === 'small' ? 'text-xs' : customization.size === 'large' ? 'text-base' : 'text-sm'} font-semibold text-gray-600`}>
                        {company.company_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className={`${dynamicSizes.companyFont} font-medium text-gray-800 leading-tight text-center`}>
                    {company.company_name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Resize Handles */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Bottom-right corner resize */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onMouseDown={(e) => handleMouseDown(e, 'se')}
        >
          <GripVertical className="w-3 h-3 text-white/60 transform rotate-45" />
        </div>
        
        {/* Right edge resize */}
        <div
          className="absolute top-1/2 right-0 w-2 h-8 cursor-e-resize pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2 z-20"
          onMouseDown={(e) => handleMouseDown(e, 'e')}
        >
          <div className="w-1 h-full bg-white/30 rounded-full mx-auto" />
        </div>
        
        {/* Bottom edge resize */}
        <div
          className="absolute bottom-0 left-1/2 w-8 h-2 cursor-s-resize pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2 z-20"
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
