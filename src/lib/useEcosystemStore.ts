
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
        let optimalWidth = 300;
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
              optimalWidth = Math.max(300, contentWidth);
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
            position: { x: 0, y: 0 }, // Will be calculated after all categories are created
            width: optimalWidth,
            height: optimalHeight,
            twoColumn: false
          }
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // Calculate grid positions to fill the entire canvas
    const canvasWidth = 1400; // Increased canvas width
    const canvasHeight = 1000; // Fixed canvas height
    const margin = 20; // Reduced margin for better space utilization
    
    if (categories.length === 0) {
      set({ categories });
      return;
    }

    // Calculate optimal grid layout
    const totalCategories = categories.length;
    let bestLayout = { cols: 1, rows: totalCategories };
    let minWastedSpace = Infinity;

    // Try different column configurations to find the best fit
    for (let cols = 1; cols <= Math.min(5, totalCategories); cols++) {
      const rows = Math.ceil(totalCategories / cols);
      const avgWidth = categories.reduce((sum, cat) => sum + (cat.customization?.width || 300), 0) / totalCategories;
      const avgHeight = categories.reduce((sum, cat) => sum + (cat.customization?.height || 250), 0) / totalCategories;
      
      const requiredWidth = cols * avgWidth + (cols + 1) * margin;
      const requiredHeight = rows * avgHeight + (rows + 1) * margin;
      
      // Check if this layout fits in the canvas
      if (requiredWidth <= canvasWidth && requiredHeight <= canvasHeight) {
        const wastedSpace = (canvasWidth * canvasHeight) - (requiredWidth * requiredHeight);
        if (wastedSpace < minWastedSpace) {
          minWastedSpace = wastedSpace;
          bestLayout = { cols, rows };
        }
      }
    }

    const { cols: optimalColumns } = bestLayout;
    
    // Position categories in the grid
    categories.forEach((category, index) => {
      const row = Math.floor(index / optimalColumns);
      const col = index % optimalColumns;
      
      // Calculate available space for this column
      const availableWidth = (canvasWidth - ((optimalColumns + 1) * margin)) / optimalColumns;
      const categoryWidth = Math.min(category.customization?.width || 300, availableWidth);
      
      // Position X - center boxes within their columns
      const x = margin + (col * (availableWidth + margin)) + ((availableWidth - categoryWidth) / 2);
      
      // Position Y - stack rows with dynamic spacing
      let y = margin;
      for (let prevRowIndex = 0; prevRowIndex < row; prevRowIndex++) {
        // Find the tallest box in the previous row
        let maxHeightInRow = 0;
        for (let prevColIndex = 0; prevColIndex < optimalColumns; prevColIndex++) {
          const prevCategoryIndex = prevRowIndex * optimalColumns + prevColIndex;
          if (prevCategoryIndex < categories.length) {
            const prevCategory = categories[prevCategoryIndex];
            maxHeightInRow = Math.max(maxHeightInRow, prevCategory.customization?.height || 250);
          }
        }
        y += maxHeightInRow + margin;
      }
      
      // Update the category's position and ensure it fits properly
      if (category.customization) {
        category.customization.position = { 
          x: Math.max(margin, Math.min(x, canvasWidth - categoryWidth - margin)), 
          y: Math.max(margin, y)
        };
        category.customization.width = categoryWidth;
      }
    });

    set({ categories });
  },
}));
