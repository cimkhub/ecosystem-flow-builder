
export interface Company {
  id: string;
  company_name: string;
  category: string;
  logo_filename?: string;
  logoUrl?: string;
}

export interface Category {
  name: string;
  companies: Company[];
  color: string;
}

export interface EcosystemState {
  companies: Company[];
  logos: Map<string, File>;
  categories: Category[];
  uploadErrors: string[];
  setCompanies: (companies: Company[]) => void;
  addLogo: (filename: string, file: File) => void;
  removeLogo: (filename: string) => void;
  setUploadErrors: (errors: string[]) => void;
  generateCategories: () => void;
}
