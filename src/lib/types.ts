
export interface Company {
  id: string;
  company_name: string;
  category: string;
  subcategory?: string;
  logo_filename?: string;
  logoUrl?: string;
}

export interface Category {
  name: string;
  companies: Company[];
  subcategories?: { name: string; companies: Company[] }[];
  color: string;
}

export interface ColumnMapping {
  company_name: string;
  category: string;
  subcategory?: string;
  logo_filename?: string;
}

export interface RawDataRow {
  [key: string]: string;
}

export interface EcosystemState {
  companies: Company[];
  logos: Map<string, File>;
  categories: Category[];
  uploadErrors: string[];
  rawData: RawDataRow[];
  csvColumns: string[];
  showColumnMapper: boolean;
  setCompanies: (companies: Company[]) => void;
  addLogo: (filename: string, file: File) => void;
  removeLogo: (filename: string) => void;
  setUploadErrors: (errors: string[]) => void;
  generateCategories: () => void;
  setRawData: (data: RawDataRow[], columns: string[]) => void;
  setShowColumnMapper: (show: boolean) => void;
  mapColumnsAndCreateCompanies: (mapping: ColumnMapping) => void;
}
