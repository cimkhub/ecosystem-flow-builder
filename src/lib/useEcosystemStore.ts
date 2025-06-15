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
      height: 400,
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
            width: 320,
            height: 400,
            twoColumn: false
          }
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // PROFESSIONAL GRID LAYOUT - DYNAMIC & COMPACT
    if (categories.length > 0) {
      const updatedChartCustomization = { ...chartCustomization };
      
      const CATEGORY_WIDTH = 320;
      const HORIZONTAL_GAP = 24;
      const VERTICAL_GAP = 40;
      const CANVAS_PADDING = 40;

      const calculateCategoryHeight = (category: Category) => {
        const HEADER_H = 120;
        const SUBCAT_HEADER_H = 36;
        const SUBCAT_SPACING_Y = 16;
        const ITEM_H = 76;
        const ITEM_GAP_Y = 8;
        
        let contentHeight = 0;
        const totalCompanies = category.companies.length;
        let logoColumns = 1;
        if (totalCompanies > 3) logoColumns = 2;
        if (totalCompanies > 8) logoColumns = 3;

        if (category.subcategories && category.subcategories.length > 1) {
          category.subcategories.forEach(subcategory => {
            const rowsNeeded = Math.ceil(subcategory.companies.length / logoColumns);
            contentHeight += SUBCAT_HEADER_H;
            if (rowsNeeded > 0) {
              contentHeight += (rowsNeeded * ITEM_H) + (Math.max(0, rowsNeeded - 1) * ITEM_GAP_Y);
            }
          });
          contentHeight += (category.subcategories.length - 1) * SUBCAT_SPACING_Y;
        } else if (totalCompanies > 0) {
          const rowsNeeded = Math.ceil(totalCompanies / logoColumns);
           if (rowsNeeded > 0) {
            contentHeight += (rowsNeeded * ITEM_H) + (Math.max(0, rowsNeeded - 1) * ITEM_GAP_Y);
          }
        }
        
        return Math.max(250, HEADER_H + contentHeight);
      };
      
      const categoryHeights = categories.map(category => calculateCategoryHeight(category));
      
      const categoryCount = categories.length;
      let cols = 3;
      if (categoryCount <= 2) cols = 2;
      else if (categoryCount <= 6) cols = 3;
      else if (categoryCount <= 12) cols = 4;
      else cols = Math.min(5, Math.ceil(Math.sqrt(categoryCount)));
      
      const rowHeights: number[] = [];
      for (let i = 0; i < Math.ceil(categoryCount / cols); i++) {
        const rowSlice = categoryHeights.slice(i * cols, (i * cols) + cols);
        if (rowSlice.length > 0) {
          rowHeights.push(Math.max(...rowSlice));
        }
      }
      
      const rowYOffsets = [CANVAS_PADDING];
      for (let i = 0; i < rowHeights.length - 1; i++) {
        rowYOffsets.push(rowYOffsets[i] + rowHeights[i] + VERTICAL_GAP);
      }

      categories.forEach((category, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        const x = CANVAS_PADDING + (col * (CATEGORY_WIDTH + HORIZONTAL_GAP));
        const y = rowYOffsets[row];
        
        const categoryCustomization: CategoryCustomization = {
          ...category.customization,
          backgroundColor: category.customization?.backgroundColor || category.color,
          borderColor: category.customization?.borderColor || category.color,
          textColor: category.customization?.textColor || getContrastColor(category.color),
          size: 'medium',
          position: { x, y },
          width: CATEGORY_WIDTH,
          height: categoryHeights[index],
          twoColumn: false
        };
        
        category.customization = categoryCustomization;
        updatedChartCustomization.categories[category.name] = categoryCustomization;
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
