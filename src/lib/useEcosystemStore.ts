
import { create } from 'zustand';
import { EcosystemState, Company, Category, RawDataRow, ColumnMapping, ChartCustomization, CategoryCustomization } from './types';
import { colorFromString, getContrastColor } from './colorFromString';

export const useEcosystemStore = create<EcosystemState>((set, get) => ({
  companies: [],
  logos: new Map(),
  categories: [],
  uploadErrors: [],
  rawData: [],
  csvColumns: [],
  showColumnMapper: false,
  chartCustomization: {
    title: 'AI Ecosystem Map',
    subtitle: 'Market Landscape Overview',
    categories: {}
  },

  setCompanies: (companies: Company[]) => {
    set({ companies });
    get().generateCategories();
  },

  addLogo: (filename: string, file: File) => {
    const { logos } = get();
    const newLogos = new Map(logos);
    newLogos.set(filename, file);
    set({ logos: newLogos });
    get().generateCategories();
  },

  removeLogo: (filename: string) => {
    const { logos } = get();
    const newLogos = new Map(logos);
    newLogos.delete(filename);
    set({ logos: newLogos });
    get().generateCategories();
  },

  setUploadErrors: (errors: string[]) => {
    set({ uploadErrors: errors });
  },

  setRawData: (data: RawDataRow[], columns: string[]) => {
    set({ rawData: data, csvColumns: columns, showColumnMapper: true, uploadErrors: [] });
  },

  setShowColumnMapper: (show: boolean) => {
    set({ showColumnMapper: show });
  },

  updateChartCustomization: (customization: Partial<ChartCustomization>) => {
    const { chartCustomization } = get();
    set({ 
      chartCustomization: { 
        ...chartCustomization, 
        ...customization 
      } 
    });
  },

  updateCategoryCustomization: (categoryName: string, customization: Partial<CategoryCustomization>) => {
    const { chartCustomization } = get();
    const currentCategoryCustomization = chartCustomization.categories[categoryName] || {
      backgroundColor: colorFromString(categoryName),
      borderColor: colorFromString(categoryName),
      textColor: getContrastColor(colorFromString(categoryName)),
      size: 'medium' as const,
      position: { x: 0, y: 0 },
      width: 320,
      height: 288,
      twoColumn: false
    };

    set({
      chartCustomization: {
        ...chartCustomization,
        categories: {
          ...chartCustomization.categories,
          [categoryName]: {
            ...currentCategoryCustomization,
            ...customization
          }
        }
      }
    });
  },

  mapColumnsAndCreateCompanies: (mapping: ColumnMapping) => {
    const { rawData } = get();
    const companies: Company[] = [];
    const errors: string[] = [];

    rawData.forEach((row, index) => {
      const companyName = row[mapping.company_name]?.trim();
      const category = row[mapping.category]?.trim();
      
      if (!companyName || !category) {
        return;
      }

      companies.push({
        id: `${companyName}-${category}-${index}`,
        company_name: companyName,
        category: category,
        subcategory: mapping.subcategory ? row[mapping.subcategory]?.trim() : undefined,
        logo_filename: mapping.logo_filename ? row[mapping.logo_filename]?.trim() : undefined,
      });
    });

    if (companies.length === 0) {
      errors.push('No valid companies found after mapping. Please check your column mapping.');
    }

    set({ companies, uploadErrors: errors, showColumnMapper: false });
    get().generateCategories();
  },

  generateCategories: () => {
    const { companies, logos, chartCustomization } = get();
    const categoryMap = new Map<string, Map<string, Company[]>>();

    companies.forEach(company => {
      if (!categoryMap.has(company.category)) {
        categoryMap.set(company.category, new Map());
      }

      const subcategoryMap = categoryMap.get(company.category)!;
      const subcategory = company.subcategory || 'Other';
      
      if (!subcategoryMap.has(subcategory)) {
        subcategoryMap.set(subcategory, []);
      }

      const logoFile = logos.get(company.logo_filename || '') || 
                      logos.get(company.company_name.toLowerCase()) ||
                      logos.get(company.company_name);

      const companyWithLogo = {
        ...company,
        logoUrl: logoFile ? URL.createObjectURL(logoFile) : undefined,
      };

      subcategoryMap.get(subcategory)!.push(companyWithLogo);
    });

    const categories: Category[] = Array.from(categoryMap.entries())
      .map(([name, subcategoryMap], categoryIndex) => {
        const allCompanies: Company[] = [];
        const subcategories: { name: string; companies: Company[] }[] = [];

        Array.from(subcategoryMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([subcategoryName, companies]) => {
            const sortedCompanies = companies.sort((a, b) => a.company_name.localeCompare(b.company_name));
            subcategories.push({
              name: subcategoryName,
              companies: sortedCompanies
            });
            allCompanies.push(...sortedCompanies);
          });

        const existingCustomization = chartCustomization.categories[name];
        const defaultColor = colorFromString(name);

        // Calculate optimal width and height for this category
        const totalCompanies = allCompanies.length;
        let optimalWidth = 320;
        let optimalHeight = 250;
        
        if (totalCompanies > 0) {
          const itemWidth = 120;
          const itemHeight = 68;
          const padding = 48;
          const headerHeight = 100;
          const subcategoryHeaderHeight = 28;
          const subcategorySpacing = 16;
          
          let bestArea = Infinity;
          
          for (let cols = 1; cols <= Math.min(4, totalCompanies); cols++) {
            const contentWidth = cols * itemWidth + padding;
            let totalHeight = headerHeight;
            
            if (subcategories.length > 1) {
              subcategories.forEach(subcategory => {
                const companiesInSubcategory = subcategory.companies.length;
                const rowsNeeded = Math.ceil(companiesInSubcategory / cols);
                totalHeight += subcategoryHeaderHeight + (rowsNeeded * itemHeight) + subcategorySpacing;
              });
            } else {
              const rowsNeeded = Math.ceil(totalCompanies / cols);
              totalHeight += rowsNeeded * itemHeight;
            }
            
            totalHeight += padding;
            const area = contentWidth * totalHeight;
            
            if (area < bestArea) {
              bestArea = area;
              optimalWidth = Math.max(320, contentWidth);
              optimalHeight = Math.max(250, totalHeight);
            }
          }
        }

        return {
          name,
          companies: allCompanies,
          subcategories,
          color: existingCustomization?.backgroundColor || defaultColor,
          customization: existingCustomization || {
            backgroundColor: defaultColor,
            borderColor: defaultColor,
            textColor: getContrastColor(defaultColor),
            size: 'medium' as const,
            position: { x: 0, y: 0 }, // Will be calculated below
            width: optimalWidth,
            height: optimalHeight,
            twoColumn: false
          }
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // Better grid-based positioning with proper spacing
    const canvasWidth = 1400;
    const canvasHeight = 1000;
    const margin = 20;
    const minSpacing = 15; // Minimum space between boxes
    
    if (categories.length === 0) {
      set({ categories });
      return;
    }

    // Calculate optimal grid layout
    const totalCategories = categories.length;
    let bestCols = 1;
    let bestRows = totalCategories;
    
    // Find the best grid configuration that minimizes wasted space
    for (let cols = 1; cols <= Math.min(4, totalCategories); cols++) {
      const rows = Math.ceil(totalCategories / cols);
      const avgWidth = categories.reduce((sum, cat) => sum + (cat.customization?.width || 320), 0) / totalCategories;
      const avgHeight = categories.reduce((sum, cat) => sum + (cat.customization?.height || 250), 0) / totalCategories;
      
      const totalWidth = cols * avgWidth + (cols - 1) * minSpacing + 2 * margin;
      const totalHeight = rows * avgHeight + (rows - 1) * minSpacing + 2 * margin;
      
      if (totalWidth <= canvasWidth && totalHeight <= canvasHeight) {
        bestCols = cols;
        bestRows = rows;
      }
    }

    // Calculate available space per column
    const availableWidth = canvasWidth - 2 * margin - (bestCols - 1) * minSpacing;
    const colWidth = availableWidth / bestCols;
    
    const updatedChartCustomization = { ...chartCustomization };
    
    categories.forEach((category, index) => {
      const row = Math.floor(index / bestCols);
      const col = index % bestCols;
      
      const categoryWidth = Math.min(category.customization?.width || 320, colWidth);
      const categoryHeight = category.customization?.height || 250;
      
      // Calculate position with proper spacing
      const x = margin + col * (colWidth + minSpacing);
      const y = margin + row * (categoryHeight + minSpacing);
      
      // Ensure the box stays within bounds
      const finalX = Math.min(x, canvasWidth - categoryWidth - margin);
      const finalY = Math.min(y, canvasHeight - categoryHeight - margin);
      
      const categoryCustomization: CategoryCustomization = {
        backgroundColor: category.customization?.backgroundColor || category.color,
        borderColor: category.customization?.borderColor || category.color,
        textColor: category.customization?.textColor || getContrastColor(category.color),
        size: category.customization?.size || 'medium',
        position: { x: finalX, y: finalY },
        width: categoryWidth,
        height: categoryHeight,
        twoColumn: category.customization?.twoColumn || false
      };
      
      category.customization = categoryCustomization;
      updatedChartCustomization.categories[category.name] = categoryCustomization;
      
      console.log(`Positioned category ${category.name} at (${finalX}, ${finalY}) with size ${categoryWidth}x${categoryHeight} in grid ${col},${row}`);
    });

    set({ 
      categories,
      chartCustomization: updatedChartCustomization
    });
  },
}));
