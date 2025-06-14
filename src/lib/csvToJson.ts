import Papa from 'papaparse';
import { RawDataRow } from './types';

export function parseCsvForMapping(csvContent: string): { data: RawDataRow[], columns: string[], errors: string[] } {
  const errors: string[] = [];
  let data: RawDataRow[] = [];
  let columns: string[] = [];

  try {
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (result.errors.length > 0) {
      errors.push(...result.errors.map(err => `CSV Parse Error: ${err.message}`));
    }

    data = result.data as RawDataRow[];
    columns = result.meta.fields || [];

    if (columns.length === 0) {
      errors.push('No columns found in CSV file');
    }

    if (data.length === 0) {
      errors.push('No data rows found in CSV file');
    }
  } catch (error) {
    errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { data, columns, errors };
}

export function csvToJson(csvContent: string): { companies: any[], errors: string[] } {
  const { data, errors } = parseCsvForMapping(csvContent);
  return { companies: [], errors }; // This will be handled by the column mapper now
}

export function validateJsonData(data: any): { companies: any[], errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(data)) {
    errors.push('JSON data must be an array of company objects');
    return { companies: [], errors };
  }

  // For JSON, we'll also show the column mapper
  return { companies: [], errors };
}
