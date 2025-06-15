
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
          
          for (let cols = 1; cols <= Math.min(6, totalCompanies); cols++) {
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
              optimalWidth = contentWidth;
              optimalHeight = totalHeight;
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

    // Now calculate grid positions for all categories
    const canvasWidth = 1200;
    const canvasHeight = 1200;
    const margin = 30;
    
    // Calculate how many columns we can fit
    const avgWidth = categories.reduce((sum, cat) => sum + (cat.customization?.width || 320), 0) / categories.length;
    const maxColumnsBasedOnWidth = Math.max(1, Math.floor((canvasWidth - margin) / (avgWidth + margin)));
    const optimalColumns = Math.min(maxColumnsBasedOnWidth, Math.ceil(Math.sqrt(categories.length)));
    
    // Position categories in a grid
    categories.forEach((category, index) => {
      const row = Math.floor(index / optimalColumns);
      const col = index % optimalColumns;
      
      // Calculate X position - distribute evenly across available width
      const availableWidth = canvasWidth - (2 * margin);
      const columnWidth = availableWidth / optimalColumns;
      const categoryWidth = category.customization?.width || 320;
      const x = margin + (col * columnWidth) + (columnWidth - categoryWidth) / 2;
      
      // Calculate Y position - stack rows with proper spacing
      let y = margin;
      for (let prevRowIndex = 0; prevRowIndex < row; prevRowIndex++) {
        // Find the tallest box in this previous row
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
      
      // Update the category's position
      if (category.customization) {
        category.customization.position = { x: Math.max(0, x), y };
      }
    });

    set({ categories });
  },
}));
