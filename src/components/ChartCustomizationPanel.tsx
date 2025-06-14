
'use client';

import React, { useState } from 'react';
import { Palette, Type, Move, Maximize2, Settings2, X, Save } from 'lucide-react';
import { useEcosystemStore } from '../lib/useEcosystemStore';
import { CategoryCustomization } from '../lib/types';
import { getContrastColor } from '../lib/colorFromString';

interface ChartCustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChartCustomizationPanel({ isOpen, onClose }: ChartCustomizationPanelProps) {
  const { 
    categories, 
    chartCustomization, 
    updateChartCustomization, 
    updateCategoryCustomization 
  } = useEcosystemStore();
  
  const [activeTab, setActiveTab] = useState<'general' | 'categories'>('general');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  const sizeOptions = [
    { value: 'small', label: 'Small', width: 'w-48' },
    { value: 'medium', label: 'Medium', width: 'w-64' },
    { value: 'large', label: 'Large', width: 'w-80' }
  ];

  const colorPresets = [
    '#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B',
    '#EF4444', '#EC4899', '#6366F1', '#84CC16', '#F97316'
  ];

  const handleCategoryCustomization = (categoryName: string, updates: Partial<CategoryCustomization>) => {
    updateCategoryCustomization(categoryName, updates);
  };

  const handleSave = () => {
    // The changes are already saved in real-time via the store
    // This button provides user feedback that changes are saved
    onClose();
  };

  const getCurrentCategoryCustomization = (categoryName: string) => {
    return chartCustomization.categories[categoryName] || {
      backgroundColor: categories.find(c => c.name === categoryName)?.color || '#3B82F6',
      borderColor: categories.find(c => c.name === categoryName)?.color || '#3B82F6',
      textColor: getContrastColor(categories.find(c => c.name === categoryName)?.color || '#3B82F6'),
      size: 'medium' as const,
      position: { x: 0, y: 0 }
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Settings2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Chart Customization</h2>
                <p className="text-blue-100">Create your perfect ecosystem visualization</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r">
            <div className="p-4">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'general'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Type className="h-5 w-5" />
                  <span className="font-medium">General</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'categories'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Palette className="h-5 w-5" />
                  <span className="font-medium">Categories</span>
                </button>
              </div>

              {activeTab === 'categories' && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Select Category
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {categories.map((category) => (
                      <button
                        key={category.name}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                          selectedCategory === category.name
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: getCurrentCategoryCustomization(category.name).backgroundColor }}
                          />
                          <span className="text-sm font-medium truncate">
                            {category.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[70vh]">
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Chart Titles</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Main Title
                      </label>
                      <input
                        type="text"
                        value={chartCustomization.title}
                        onChange={(e) => updateChartCustomization({ title: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter chart title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={chartCustomization.subtitle}
                        onChange={(e) => updateChartCustomization({ subtitle: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter chart subtitle"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'categories' && selectedCategory && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Customize {selectedCategory}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Adjust colors, size, and positioning for this category
                  </p>
                </div>

                {/* Color Customization */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Colors
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Color
                      </label>
                      <div className="flex space-x-2 mb-2">
                        {colorPresets.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleCategoryCustomization(selectedCategory, { 
                              backgroundColor: color,
                              textColor: getContrastColor(color)
                            })}
                            className="w-8 h-8 rounded-lg border-2 border-white shadow-md hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={getCurrentCategoryCustomization(selectedCategory).backgroundColor}
                        onChange={(e) => handleCategoryCustomization(selectedCategory, { 
                          backgroundColor: e.target.value,
                          textColor: getContrastColor(e.target.value)
                        })}
                        className="w-full h-12 border border-gray-300 rounded-xl cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Border Color
                      </label>
                      <input
                        type="color"
                        value={getCurrentCategoryCustomization(selectedCategory).borderColor}
                        onChange={(e) => handleCategoryCustomization(selectedCategory, { 
                          borderColor: e.target.value 
                        })}
                        className="w-full h-12 border border-gray-300 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Size Customization */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <Maximize2 className="h-5 w-5 mr-2" />
                    Size
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {sizeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleCategoryCustomization(selectedCategory, { 
                          size: option.value as 'small' | 'medium' | 'large'
                        })}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          getCurrentCategoryCustomization(selectedCategory).size === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`${option.width} h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded mx-auto mb-2`} />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'categories' && !selectedCategory && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Palette className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Category
                </h3>
                <p className="text-gray-600">
                  Choose a category from the sidebar to customize its appearance
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
