
import { create } from 'zustand';
import { EcosystemState, Company, Category } from './types';
import { colorFromString } from './colorFromString';

export const useEcosystemStore = create<EcosystemState>((set, get) => ({
  companies: [],
  logos: new Map(),
  categories: [],
  uploadErrors: [],

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
