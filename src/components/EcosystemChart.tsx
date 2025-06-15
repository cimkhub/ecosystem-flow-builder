'use client';

import React, { useRef, useState } from 'react';
import { Download, Share2, Sparkles, Settings2, Linkedin, Twitter, Reddit } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useEcosystemStore } from '../lib/useEcosystemStore';
import { getContrastColor } from '../lib/colorFromString';
import ChartCustomizationPanel from './ChartCustomizationPanel';
import ResizableCategory from './ResizableCategory';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function EcosystemChart() {
  const { categories, chartCustomization, updateChartCustomization, showCompanyText, updateShowCompanyText } = useEcosystemStore();
  const exportRef = useRef<HTMLDivElement>(null);
  const [showCustomization, setShowCustomization] = useState(false);

  const exportChart = async () => {
    if (!exportRef.current) return;

    // Capture text values directly from the state for safety
    const titleText = chartCustomization.title;
    const subtitleText = chartCustomization.subtitle;

    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        onclone: (clonedDoc) => {
          // --- NEW, MORE ROBUST HEADER REPLACEMENT ---
          // This approach rebuilds the header from scratch for the export,
          // avoiding all issues with complex CSS (gradients, animations).
          const header = clonedDoc.querySelector('.professional-header');
          if (header) {
            // Clear out all complex, animated inner elements
            header.innerHTML = '';
            
            // Rebuild a simple, static version for export
            const titleEl = clonedDoc.createElement('h1');
            titleEl.innerText = titleText;
            titleEl.style.fontSize = '60px';
            titleEl.style.fontWeight = '900';
            titleEl.style.color = '#F0F9FF'; // Solid light color
            titleEl.style.fontFamily = 'Arial, sans-serif'; // Web-safe font
            titleEl.style.textAlign = 'center';
            titleEl.style.margin = '0';
            titleEl.style.paddingBottom = '1rem';
            
            const subtitleEl = clonedDoc.createElement('p');
            subtitleEl.innerText = subtitleText;
            subtitleEl.style.fontSize = '24px';
            subtitleEl.style.fontWeight = '300';
            subtitleEl.style.color = '#D1D5DB'; // text-gray-300
            subtitleEl.style.fontFamily = 'Arial, sans-serif';
            subtitleEl.style.textAlign = 'center';
            subtitleEl.style.margin = '0 auto';
            subtitleEl.style.maxWidth = '42rem';
            
            // The header already has padding from its classes, so we can just append
            header.appendChild(titleEl);
            header.appendChild(subtitleEl);
          }

          // Fix for other animated elements (like categories) not appearing in export
          const animatedElements = clonedDoc.querySelectorAll('.animate-fade-in, .animate-pulse, .animate-bounce, .animate-ping');
          animatedElements.forEach(el => {
            const htmlEl = el as HTMLElement;
            // Disable animation and set final state for capture
            htmlEl.style.animation = 'none';
            htmlEl.style.opacity = '1';
            htmlEl.style.transform = 'none';
          });
        },
      });

      const link = document.createElement('a');
      link.download = `${chartCustomization.title.toLowerCase().replace(/\s+/g, '-')}-ecosystem-chart.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
  };

  const handleShare = (platform: 'twitter' | 'linkedin' | 'reddit') => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(chartCustomization.title);
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'reddit':
        shareUrl = `https://www.reddit.com/submit?url=${url}&title=${text}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const ifChartIsEmpty = categories.length === 0;

  if (ifChartIsEmpty) {
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

  // Calculate canvas size for professional layout
  const calculateCanvasSize = () => {
    if (ifChartIsEmpty) {
      return { width: 1280, height: 720 }; // Default to 16:9 landscape
    }
    const PADDING = 40;
    
    const allCustomizations = categories.map(c => c.customization || { position: {x:0, y:0}, width: 0, height: 0 });

    const contentWidth = Math.max(...allCustomizations.map(c => (c.position.x || 0) + (c.width || 0))) + PADDING;
    const contentHeight = Math.max(...allCustomizations.map(c => (c.position.y || 0) + (c.height || 0))) + PADDING;
    
    if (chartCustomization.layoutOrientation === 'landscape') {
      // PPT style - 16:9 aspect ratio
      const LANDSCAPE_ASPECT_RATIO = 16 / 9;
      
      let canvasWidth = Math.max(contentWidth, 1280);
      let canvasHeight = canvasWidth / LANDSCAPE_ASPECT_RATIO;

      if (canvasHeight < contentHeight) {
        canvasHeight = contentHeight;
        canvasWidth = canvasHeight * LANDSCAPE_ASPECT_RATIO;
      }

      return {
        width: Math.round(canvasWidth),
        height: Math.round(canvasHeight)
      };

    } else {
      // Portrait style - A4-ish aspect ratio (height > width)
      const PORTRAIT_ASPECT_RATIO = Math.sqrt(2); // height/width
      
      let canvasWidth = Math.max(contentWidth, 1100);
      let canvasHeight = canvasWidth * PORTRAIT_ASPECT_RATIO;

      if (canvasHeight < contentHeight) {
        canvasHeight = contentHeight;
        canvasWidth = canvasHeight / PORTRAIT_ASPECT_RATIO;
      }
      
      return { 
        width: Math.round(canvasWidth),
        height: Math.round(canvasHeight)
      };
    }
  };

  const canvasSize = calculateCanvasSize();

  console.log('Professional Layout - Categories:', categories.length);
  console.log('Canvas size:', canvasSize);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-end items-center gap-x-6 gap-y-3">
           <div className="flex items-center space-x-2">
            <Label htmlFor="layout-toggle" className="text-sm font-medium text-gray-700 whitespace-nowrap">Portrait</Label>
            <Switch
                id="layout-toggle"
                checked={chartCustomization.layoutOrientation === 'landscape'}
                onCheckedChange={(checked) => {
                    updateChartCustomization({ layoutOrientation: checked ? 'landscape' : 'portrait' });
                }}
            />
            <Label htmlFor="layout-toggle" className="text-sm font-medium text-gray-700">Landscape</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="logo-bg-toggle" className="text-sm font-medium text-gray-700">Logo BG</Label>
            <Switch
                id="logo-bg-toggle"
                checked={!!chartCustomization.showLogoBackground}
                onCheckedChange={(checked) => {
                    updateChartCustomization({ showLogoBackground: checked });
                }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="company-text-toggle" className="text-sm font-medium text-gray-700">Name</Label>
            <Switch
                id="company-text-toggle"
                checked={showCompanyText}
                onCheckedChange={(checked) => {
                    updateShowCompanyText(checked);
                }}
            />
          </div>
          <button
            onClick={() => setShowCustomization(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <Settings2 className="h-4 w-4" />
            <span>Customize</span>
          </button>

          <button
            onClick={exportChart}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <Download className="h-4 w-4" />
            <span>Export PNG</span>
          </button>
          
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center space-x-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-6 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Share Map</h4>
                  <p className="text-sm text-muted-foreground">
                    Share this ecosystem map with others.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => handleShare('twitter')}>
                    <Twitter className="mr-2 h-4 w-4" />
                    <span>Twitter</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => handleShare('linkedin')}>
                    <Linkedin className="mr-2 h-4 w-4" />
                    <span>LinkedIn</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => handleShare('reddit')}>
                    <Reddit className="mr-2 h-4 w-4" />
                    <span>Reddit</span>
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
      </div>

      <div
        ref={exportRef}
        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100"
      >
        {/* Professional Header Design */}
        <div className="professional-header relative text-center py-16 px-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-cyan-600/10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(120,200,255,0.2),transparent_50%)]"></div>
          
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
          
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        </div>

        {/* Professional Chart Content */}
        <div
          className="relative bg-white mx-auto"
          style={{ 
            width: canvasSize.width,
            height: canvasSize.height,
          }}
        >
          {categories.map((category, categoryIndex) => {
            const customization = chartCustomization.categories[category.name] || category.customization || {
              backgroundColor: category.color,
              borderColor: category.color,
              textColor: getContrastColor(category.color),
              size: 'medium' as const,
              position: { x: 60, y: 60 },
              width: 320,
              height: 400,
              twoColumn: false
            };
            
            return (
              <ResizableCategory
                key={category.name}
                category={category}
                customization={customization}
                categoryIndex={categoryIndex}
                showLogoBackground={!!chartCustomization.showLogoBackground}
                showCompanyText={showCompanyText}
              />
            );
          })}
        </div>
        
        <div className="text-center py-6 px-8 border-t border-gray-100">
          <p className="text-sm text-gray-500 tracking-wide">
            by{' '}
            <a
              href="https://www.ecosystem-flow-builder.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-purple-600 hover:underline"
            >
              www.ecosystem-flow-builder.com
            </a>
          </p>
        </div>
      </div>

      <ChartCustomizationPanel 
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
      />
    </div>
  );
}
