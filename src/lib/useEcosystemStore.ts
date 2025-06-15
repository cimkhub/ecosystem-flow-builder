
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
      .map(([name, subcategoryMap]) => {
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

        // Calculate optimal dimensions based on content
        const totalCompanies = allCompanies.length;
        const itemHeight = 68;
        const itemWidth = 120;
        const padding = 48;
        const headerHeight = 100;
        
        // Find optimal width (2-3 columns typically work best)
        let optimalCols = Math.min(3, Math.max(2, Math.ceil(Math.sqrt(totalCompanies))));
        const contentWidth = Math.max(320, optimalCols * itemWidth + padding);
        
        // Calculate height based on rows needed
        const rowsNeeded = Math.ceil(totalCompanies / optimalCols);
        const contentHeight = Math.max(250, headerHeight + (rowsNeeded * itemHeight) + padding);

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
            position: { x: 0, y: 0 },
            width: contentWidth,
            height: contentHeight,
            twoColumn: false
          }
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // NEW POSITIONING ALGORITHM: Proper 2D Grid Layout
    if (categories.length > 0) {
      const canvasWidth = 1400;
      const canvasHeight = 1000;
      const margin = 30;
      const spacing = 20;
      
      // Calculate how many columns we can fit
      const avgWidth = categories.reduce((sum, cat) => sum + (cat.customization?.width || 320), 0) / categories.length;
      const maxColumns = Math.floor((canvasWidth - 2 * margin + spacing) / (avgWidth + spacing));
      const optimalColumns = Math.min(maxColumns, Math.max(2, Math.ceil(Math.sqrt(categories.length))));
      
      console.log(`Grid layout: ${optimalColumns} columns for ${categories.length} categories`);
      
      const updatedChartCustomization = { ...chartCustomization };
      
      // Position each category in the grid
      categories.forEach((category, index) => {
        const row = Math.floor(index / optimalColumns);
        const col = index % optimalColumns;
        
        const categoryWidth = category.customization?.width || 320;
        const categoryHeight = category.customization?.height || 250;
        
        // Calculate position with proper grid spacing
        const x = margin + col * (Math.floor((canvasWidth - 2 * margin) / optimalColumns));
        const y = margin + row * (categoryHeight + spacing);
        
        // Ensure categories stay within canvas bounds
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
        
        console.log(`Category "${category.name}" positioned at (${finalX}, ${finalY}) - Grid position: col ${col}, row ${row}`);
      });

      set({ 
        categories,
        chartCustomization: updatedChartCustomization
      });
    } else {
      set({ categories });
    }
  },
}));
