import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'safeNumber',
  standalone: true
})
export class SafeNumberPipe implements PipeTransform {
  transform(value: any, defaultValue: string = '0'): string {
    if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
      return defaultValue;
    }
    return value.toString();
  }
}

@Pipe({
  name: 'safePercentage',
  standalone: true
})
export class SafePercentagePipe implements PipeTransform {
  transform(value: any): string {
    if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
      return '0%';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue) || !isFinite(numValue)) {
      return '0%';
    }

    return `${Math.abs(numValue).toFixed(1)}%`;
  }
}

@Pipe({
  name: 'safeCurrency',
  standalone: true
})
export class SafeCurrencyPipe implements PipeTransform {
  transform(value: any, locale: string = 'es-AR', currency: string = 'ARS'): string {
    if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(0);
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue) || !isFinite(numValue)) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(0);
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  }
}
