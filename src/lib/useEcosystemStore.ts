
import { create } from 'zustand';
import { EcosystemState, Company, Category, RawDataRow, ColumnMapping } from './types';
import { colorFromString } from './colorFromString';

export const useEcosystemStore = create<EcosystemState>((set, get) => ({
  companies: [],
  logos: new Map(),
  categories: [],
  uploadErrors: [],
  rawData: [],
  csvColumns: [],
  showColumnMapper: false,

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
    set({ rawData: data, csvColumns: columns, showColumnMapper: true });
  },

  setShowColumnMapper: (show: boolean) => {
    set({ showColumnMapper: show });
  },

  mapColumnsAndCreateCompanies: (mapping: ColumnMapping) => {
    const { rawData } = get();
    const companies: Company[] = [];

    rawData.forEach((row, index) => {
      const companyName = row[mapping.company_name]?.trim();
      const category = row[mapping.category]?.trim();
      
      if (companyName && category) {
        companies.push({
          id: `${companyName}-${category}-${index}`,
          company_name: companyName,
          category: category,
          subcategory: mapping.subcategory ? row[mapping.subcategory]?.trim() : undefined,
          logo_filename: mapping.logo_filename ? row[mapping.logo_filename]?.trim() : undefined,
        });
      }
    });

    set({ companies });
    get().generateCategories();
  },

  generateCategories: () => {
    const { companies, logos } = get();
    const categoryMap = new Map<string, Company[]>();

    // Group companies by category
    companies.forEach(company => {
      if (!categoryMap.has(company.category)) {
        categoryMap.set(company.category, []);
      }

      // Check if we have a logo for this company
      const logoFile = logos.get(company.logo_filename || '') || 
                      logos.get(company.company_name.toLowerCase()) ||
                      logos.get(company.company_name);

      const companyWithLogo = {
        ...company,
        logoUrl: logoFile ? URL.createObjectURL(logoFile) : undefined,
      };

      categoryMap.get(company.category)!.push(companyWithLogo);
    });

    // Convert to Category objects and sort companies alphabetically
    const categories: Category[] = Array.from(categoryMap.entries())
      .map(([name, companies]) => ({
        name,
        companies: companies.sort((a, b) => a.company_name.localeCompare(b.company_name)),
        color: colorFromString(name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    set({ categories });
  },
}));
