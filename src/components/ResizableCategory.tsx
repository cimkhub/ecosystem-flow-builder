'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Move } from 'lucide-react';
import { useEcosystemStore } from '../lib/useEcosystemStore';
import { Category, CategoryCustomization } from '../lib/types';

interface ResizableCategoryProps {
  category: Category;
  customization: CategoryCustomization;
  categoryIndex: number;
  showLogoBackground: boolean;
  showCompanyText: boolean;
}

export default function ResizableCategory({ 
  category, 
  customization, 
  categoryIndex,
  showLogoBackground,
  showCompanyText
}: ResizableCategoryProps) {
  const { updateCategoryCustomization } = useEcosystemStore();
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'e' | 's' | null>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const startMousePos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const startPosition = useRef({ x: 0, y: 0 });
  const [optimalColumns, setOptimalColumns] = useState(1);

  // Dynamically calculate the optimal number of columns to best fit content
  useEffect(() => {
    const size = customization.size || 'medium';
    const boxHeight = customization.height || 450;
    
    // Define layout constants based on the component's styling
    const PADDING_Y = { small: 32, medium: 48, large: 64 }[size];
    const HEADER_H = { small: 60, medium: 72, large: 90 }[size];
    const SUBCAT_HEADER_H = { small: 32, medium: 36, large: 40 }[size];
    const SUBCAT_SPACING_Y = 16;
    
    const ITEM_H_WITH_TEXT = { small: 56, medium: 76, large: 80 }[size];
    const ITEM_H_WITHOUT_TEXT = { small: 40, medium: 60, large: 64 }[size];
    const ITEM_H = showCompanyText ? ITEM_H_WITH_TEXT : ITEM_H_WITHOUT_TEXT;

    const availableHeight = boxHeight - HEADER_H - PADDING_Y;

    const totalCompanies = category.subcategories?.reduce((total, sub) => total + sub.companies.length, 0) || 0;
    if (totalCompanies === 0 || availableHeight <= 0) {
      setOptimalColumns(1);
      return;
    }

    let bestConfig = { columns: 1, score: Infinity };
    const maxColumnsToTest = 4;

    for (let cols = 1; cols <= maxColumnsToTest; cols++) {
      let requiredHeight = 0;
      
      if (category.subcategories && category.subcategories.length > 1) {
        category.subcategories.forEach(subcategory => {
          const rowsNeeded = Math.ceil(subcategory.companies.length / cols);
          requiredHeight += SUBCAT_HEADER_H + (rowsNeeded * ITEM_H);
        });
        requiredHeight += (category.subcategories.length - 1) * SUBCAT_SPACING_Y;
      } else if (category.subcategories && category.subcategories.length === 1) {
        const rowsNeeded = Math.ceil(category.subcategories[0].companies.length / cols);
        requiredHeight += (rowsNeeded * ITEM_H);
      }
      
      const unusedSpace = availableHeight - requiredHeight;
      
      let score;
      if (unusedSpace < 0) {
        // High penalty for overflow, proportional to how much it overflows
        score = 1000 + Math.abs(unusedSpace); 
      } else {
        // Low score for less wasted space
        score = unusedSpace;
      }
      
      if (score < bestConfig.score) {
        bestConfig = { columns: cols, score: score };
      }
    }
    
    setOptimalColumns(bestConfig.columns);

  }, [category.subcategories, customization.height, customization.size, category.name, showCompanyText]);


  const handleMouseDown = (e: React.MouseEvent, direction: 'se' | 'e' | 's') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    startMousePos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { 
      width: customization.width || 320, 
      height: customization.height || 200 
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startMousePos.current.x;
      const deltaY = e.clientY - startMousePos.current.y;
      
      let newWidth = startSize.current.width;
      let newHeight = startSize.current.height;

      if (direction === 'se' || direction === 'e') {
        newWidth = Math.max(320, startSize.current.width + deltaX);
      }
      if (direction === 'se' || direction === 's') {
        newHeight = Math.max(200, startSize.current.height + deltaY);
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
      
      const newX = Math.max(0, startPosition.current.x + deltaX);
      const newY = Math.max(0, startPosition.current.y + deltaY);

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
        logoSize: 'max-h-10 max-w-28', // Increased logo size
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
  const boxWidth = customization.width || 320;
  const boxHeight = customization.height || 200;

  const logoContainerClasses = showLogoBackground
    ? 'mb-1 p-1 bg-white rounded-md shadow-sm flex-shrink-0'
    : 'mb-1 flex-shrink-0';
  
  const companyItemClasses = showLogoBackground
    ? `bg-white/95 backdrop-blur-sm rounded-lg ${dynamicSizes.companyPadding} flex flex-col items-center text-center transform transition-all duration-200 hover:scale-105 hover:bg-white animate-fade-in`
    : `rounded-lg ${dynamicSizes.companyPadding} flex flex-col items-center text-center transform transition-all duration-200 hover:scale-105 hover:bg-black/10 animate-fade-in`;

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
        width: boxWidth,
        height: boxHeight,
        minWidth: '320px',
        minHeight: '200px'
      }}
      onMouseDown={handleDragStart}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
      
      {/* Controls */}
      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div 
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1.5 bg-white/20 rounded cursor-move" 
          title="Drag to move"
        >
          <Move className="h-3 w-3 text-white" />
        </div>
      </div>

      <div className={`relative h-full flex flex-col ${dynamicSizes.padding} overflow-hidden`}>
        {/* Main Category Title */}
        <h3
          className={`${dynamicSizes.titleFont} font-bold mb-2 text-center cursor-move flex-shrink-0`}
          style={{ color: customization.textColor }}
        >
          {category.name}
        </h3>
        
        {/* Category Subtitle */}
        <h4
          className={`${dynamicSizes.subtitleFont} font-semibold mb-4 text-center uppercase tracking-wide flex-shrink-0`}
          style={{ color: customization.textColor, opacity: 0.8 }}
        >
          {category.name.toUpperCase()}
        </h4>
        
        <div className="flex-1">
          {/* Show subcategories as grouped sections if they exist, otherwise show all companies */}
          {category.subcategories && category.subcategories.length > 1 ? (
            // Multiple subcategories - show them as organized sections
            <div className="space-y-4 h-full">
              {category.subcategories.map((subcategory, subcategoryIndex) => (
                <div
                  key={subcategory.name}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(categoryIndex * 150) + (subcategoryIndex * 100)}ms` }}
                >
                  <h5
                    className={`${dynamicSizes.subtitleFont} font-medium mb-2 text-left flex-shrink-0`}
                    style={{ color: customization.textColor, opacity: 0.7 }}
                  >
                    {subcategory.name}
                  </h5>
                  
                  <div 
                    className={`grid gap-2 mb-3`}
                    style={{ 
                      gridTemplateColumns: `repeat(${optimalColumns}, 1fr)` 
                    }}
                  >
                    {subcategory.companies.map((company, companyIndex) => (
                      <div
                        key={company.id}
                        className={companyItemClasses}
                        style={{ animationDelay: `${(categoryIndex * 150) + (subcategoryIndex * 100) + (companyIndex * 50)}ms` }}
                      >
                        {company.logoUrl ? (
                          <div className={logoContainerClasses}>
                            <img
                              src={company.logoUrl}
                              alt={company.company_name}
                              className={`${dynamicSizes.logoSize} object-contain`}
                            />
                          </div>
                        ) : (
                          <div className={`mb-1 ${customization.size === 'small' ? 'w-6 h-6' : customization.size === 'large' ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-br from-gray-200 to-gray-300 rounded-md flex items-center justify-center flex-shrink-0`}>
                            <span className={`${customization.size === 'small' ? 'text-xs' : customization.size === 'large' ? 'text-base' : 'text-sm'} font-semibold text-gray-600`}>
                              {company.company_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        {showCompanyText && (
                          <span 
                            className={`${dynamicSizes.companyFont} font-medium leading-tight text-center`}
                            style={{ color: showLogoBackground ? '#1f2937' : customization.textColor }}
                          >
                            {company.company_name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Single subcategory or no subcategories - show all companies in a grid
            <div 
              className={`grid gap-2 h-full`}
              style={{ 
                gridTemplateColumns: `repeat(${optimalColumns}, 1fr)`,
                gridAutoRows: 'min-content'
              }}
            >
              {(category.subcategories?.[0]?.companies || []).map((company, companyIndex) => (
                <div
                  key={company.id}
                  className={companyItemClasses}
                  style={{ animationDelay: `${(categoryIndex * 150) + (companyIndex * 50)}ms` }}
                >
                  {company.logoUrl ? (
                    <div className={logoContainerClasses}>
                      <img
                        src={company.logoUrl}
                        alt={company.company_name}
                        className={`${dynamicSizes.logoSize} object-contain`}
                      />
                    </div>
                  ) : (
                    <div className={`mb-1 ${customization.size === 'small' ? 'w-6 h-6' : customization.size === 'large' ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-br from-gray-200 to-gray-300 rounded-md flex items-center justify-center flex-shrink-0`}>
                      <span className={`${customization.size === 'small' ? 'text-xs' : customization.size === 'large' ? 'text-base' : 'text-sm'} font-semibold text-gray-600`}>
                        {company.company_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {showCompanyText && (
                    <span 
                      className={`${dynamicSizes.companyFont} font-medium leading-tight text-center`}
                      style={{ color: showLogoBackground ? '#1f2937' : customization.textColor }}
                    >
                      {company.company_name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Resize Handles - Made more visible and functional */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Bottom-right corner resize */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity z-30 bg-white/20 rounded-tl-lg flex items-center justify-center"
          onMouseDown={(e) => handleMouseDown(e, 'se')}
        >
          <GripVertical className="w-3 h-3 text-white/80 transform rotate-45" />
        </div>
        
        {/* Right edge resize */}
        <div
          className="absolute top-1/2 right-0 w-3 h-12 cursor-e-resize pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2 z-30 bg-white/20 rounded-l-lg flex items-center justify-center"
          onMouseDown={(e) => handleMouseDown(e, 'e')}
        >
          <div className="w-1 h-6 bg-white/60 rounded-full" />
        </div>
        
        {/* Bottom edge resize */}
        <div
          className="absolute bottom-0 left-1/2 w-12 h-3 cursor-s-resize pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2 z-30 bg-white/20 rounded-t-lg flex items-center justify-center"
          onMouseDown={(e) => handleMouseDown(e, 's')}
        >
          <div className="w-6 h-1 bg-white/60 rounded-full" />
        </div>
      </div>

      <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full" />
      <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/20 rounded-full" />
    </div>
  );
}
