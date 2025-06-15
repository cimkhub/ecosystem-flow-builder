
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

        // Calculate optimal dimensions first
        const totalCompanies = allCompanies.length;
        let optimalWidth = 320;
        let optimalHeight = 250;
        
        if (totalCompanies > 0) {
          // Try different column configurations to find the most efficient layout
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

        // Calculate grid-based positioning with dynamic spacing based on box sizes
        const margin = 40;
        const canvasWidth = 1200;
        
        // Calculate how many boxes can fit per row based on their width
        const boxWidthWithMargin = optimalWidth + margin;
        const columnsPerRow = Math.max(1, Math.floor((canvasWidth - margin) / boxWidthWithMargin));
        
        const row = Math.floor(categoryIndex / columnsPerRow);
        const col = categoryIndex % columnsPerRow;
        
        // Use dynamic heights for vertical positioning
        let yOffset = margin;
        
        // Calculate Y position based on previous boxes in the same column
        for (let prevIndex = col; prevIndex < categoryIndex; prevIndex += columnsPerRow) {
          const prevCategory = Array.from(categoryMap.keys())[prevIndex];
          if (prevCategory && chartCustomization.categories[prevCategory]) {
            yOffset += (chartCustomization.categories[prevCategory].height || 250) + margin;
          } else {
            yOffset += 250 + margin; // Default height estimate
          }
        }
        
        const defaultPosition = {
          x: col * boxWidthWithMargin + margin,
          y: yOffset
        };

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
            position: defaultPosition,
            width: optimalWidth,
            height: optimalHeight,
            twoColumn: false
          }
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    set({ categories });
  },
}));
