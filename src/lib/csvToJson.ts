
import Papa from 'papaparse';
import { Company } from './types';

export function csvToJson(csvContent: string): { companies: Company[], errors: string[] } {
  const errors: string[] = [];
  const companies: Company[] = [];

  try {
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim(),
    });

    if (result.errors.length > 0) {
      errors.push(...result.errors.map(err => `CSV Parse Error: ${err.message}`));
    }

    result.data.forEach((row: any, index: number) => {
      const rowNumber = index + 2; // +2 because index starts at 0 and we have header

      if (!row.company_name || !row.category) {
        errors.push(`Row ${rowNumber}: Missing required fields (company_name, category)`);
        return;
      }

      companies.push({
        id: `${row.company_name}-${row.category}-${index}`,
        company_name: row.company_name.trim(),
        category: row.category.trim(),
        logo_filename: row.logo_filename?.trim() || undefined,
      });
    });
  } catch (error) {
    errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { companies, errors };
}

export function validateJsonData(data: any): { companies: Company[], errors: string[] } {
  const errors: string[] = [];
  const companies: Company[] = [];

  if (!Array.isArray(data)) {
    errors.push('JSON data must be an array of company objects');
    return { companies, errors };
  }

  data.forEach((item: any, index: number) => {
    if (!item.company_name || !item.category) {
      errors.push(`Item ${index + 1}: Missing required fields (company_name, category)`);
      return;
    }

    companies.push({
      id: `${item.company_name}-${item.category}-${index}`,
      company_name: item.company_name.trim(),
      category: item.category.trim(),
      logo_filename: item.logo_filename?.trim() || undefined,
    });
  });

  return { companies, errors };
}
