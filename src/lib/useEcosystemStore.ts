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

    // Recalculate all positions when a box is resized
    get().repositionAllCategories();
  },

  repositionAllCategories: () => {
    const { categories, chartCustomization } = get();
    
    // Sort categories to maintain consistent ordering
    const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    
    const containerWidth = 1200; // Chart container width
    const margin = 50; // Space between boxes
    let currentX = margin;
    let currentY = margin;
    let rowHeight = 0;
    
    sortedCategories.forEach((category) => {
      const currentCustomization = chartCustomization.categories[category.name];
      const boxWidth = currentCustomization?.width || 320;
      const boxHeight = currentCustomization?.height || 250;
      
      // Check if box fits in current row
      if (currentX + boxWidth > containerWidth - margin && currentX > margin) {
        // Move to next row
        currentX = margin;
        currentY += rowHeight + margin;
        rowHeight = 0;
      }
      
      // Update position
      get().updateCategoryCustomization(category.name, {
        position: { x: currentX, y: currentY }
      });
      
      // Update for next box
      currentX += boxWidth + margin;
      rowHeight = Math.max(rowHeight, boxHeight);
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

        // Calculate optimal initial dimensions
        const totalCompanies = allCompanies.length;
        let optimalWidth = 320;
        let optimalHeight = 250;
        
        if (totalCompanies > 0) {
          // Calculate minimum dimensions needed to show all content
          const itemWidth = 120;
          const itemHeight = 68;
          const padding = 48;
          const headerHeight = 100;
          const subcategoryHeaderHeight = 28;
          const subcategorySpacing = 16;
          
          // Start with 2 columns and calculate needed height
          const cols = 2;
          optimalWidth = Math.max(320, cols * itemWidth + padding);
          
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
          
          optimalHeight = Math.max(250, totalHeight + padding);
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
            position: { x: 0, y: 0 }, // Will be set by repositionAllCategories
            width: optimalWidth,
            height: optimalHeight,
            twoColumn: false
          }
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    set({ categories });
    
    // Position all categories after generating them
    get().repositionAllCategories();
  },
}));
