export class ExportService {
  static generateCSV(data: any[], headers: string[]): string {
    const rows = [headers.map(h => this.escapeCSVField(h))];

    data.forEach(item => {
      const row = headers.map(header => {
        const value = String(item[header] ?? '');
        return this.escapeCSVField(value);
      });
      rows.push(row);
    });

    return rows.map(row => row.join(',')).join('\n');
  }

  private static escapeCSVField(value: string): string {
    if (/^[=+\-@\t\r]/.test(value)) {
      value = "'" + value;
    }
    if (value.includes('"') || value.includes(',') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  static generateExcel(data: any[], headers: string[]): Buffer {
    const csv = this.generateCSV(data, headers);
    return Buffer.from(csv, 'utf-8');
  }

  static downloadCSV(filename: string, csv: string) {
    if (typeof window !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  static formatPercent(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }
}
