/**
 * Enhanced Validation Utilities for Backend v6.0
 * 
 * This module provides validation functions that match the enhanced
 * backend requirements including strict format validation and soft delete handling.
 */

// Valid content format URNs as defined in backend v6.0
export const VALID_CONTENT_FORMATS = [
  'urn:x-nmos:format:video',
  'urn:x-tam:format:image', 
  'urn:x-nmos:format:audio',
  'urn:x-nmos:format:data',
  'urn:x-nmos:format:multi'
] as const;

export type ContentFormat = typeof VALID_CONTENT_FORMATS[number];

// Valid MIME type patterns
export const MIME_TYPE_PATTERN = /^[a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9!#$&\-\^_]*$/;

// Time range validation pattern (TAMS format)
export const TIME_RANGE_PATTERN = /^(\[|\()?(-?(0|[1-9][0-9]*):(0|[1-9][0-9]{0,8}))?(_(-?(0|[1-9][0-9]*):(0|[1-9][0-9]{0,8}))?)?(\]|\))?$/;

/**
 * Validates content format URN
 */
export function validateContentFormat(format: string): format is ContentFormat {
  return VALID_CONTENT_FORMATS.includes(format as ContentFormat);
}

/**
 * Validates MIME type format
 */
export function validateMimeType(mimeType: string): boolean {
  return MIME_TYPE_PATTERN.test(mimeType);
}

/**
 * Validates time range format
 */
export function validateTimeRange(timeRange: string): boolean {
  return TIME_RANGE_PATTERN.test(timeRange);
}

/**
 * Validates soft delete fields
 */
export function validateSoftDeleteFields(data: {
  deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // If deleted is true, deleted_at and deleted_by should be present
  if (data.deleted === true) {
    if (!data.deleted_at) {
      errors.push('deleted_at is required when deleted is true');
    }
    if (!data.deleted_by) {
      errors.push('deleted_by is required when deleted is true');
    }
  }

  // If deleted is false, deleted_at and deleted_by should be null/undefined
  if (data.deleted === false) {
    if (data.deleted_at) {
      errors.push('deleted_at should be null when deleted is false');
    }
    if (data.deleted_by) {
      errors.push('deleted_by should be null when deleted is false');
    }
  }

  // Validate deleted_at format if present
  if (data.deleted_at && !isValidISODate(data.deleted_at)) {
    errors.push('deleted_at must be a valid ISO 8601 date string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates ISO 8601 date string
 */
function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && dateString.includes('T');
}

/**
 * Validates UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(uuid);
}

/**
 * Validates tag format (key:value pairs)
 */
export function validateTags(tags: Record<string, string>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(tags)) {
    if (!key || key.trim() === '') {
      errors.push('Tag key cannot be empty');
    }
    if (!value || value.trim() === '') {
      errors.push('Tag value cannot be empty');
    }
    if (key.includes(':') || value.includes(':')) {
      errors.push('Tag key and value cannot contain colons');
    }
    if (key.length > 50) {
      errors.push('Tag key cannot exceed 50 characters');
    }
    if (value.length > 200) {
      errors.push('Tag value cannot exceed 200 characters');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates flow-specific fields based on format
 */
export function validateFlowFields(format: string, fields: {
  frame_width?: number;
  frame_height?: number;
  frame_rate?: string;
  sample_rate?: number;
  bits_per_sample?: number;
  channels?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (format === 'urn:x-nmos:format:video') {
    // Video-specific validation
    if (fields.frame_width && (fields.frame_width < 1 || fields.frame_width > 8192)) {
      errors.push('Frame width must be between 1 and 8192');
    }
    if (fields.frame_height && (fields.frame_height < 1 || fields.frame_height > 4320)) {
      errors.push('Frame height must be between 1 and 4320');
    }
    if (fields.frame_rate && !/^\d+\/\d+$/.test(fields.frame_rate)) {
      errors.push('Frame rate must be in format numerator/denominator (e.g., 25/1)');
    }
  } else if (format === 'urn:x-nmos:format:audio') {
    // Audio-specific validation
    if (fields.sample_rate && (fields.sample_rate < 8000 || fields.sample_rate > 192000)) {
      errors.push('Sample rate must be between 8000 and 192000 Hz');
    }
    if (fields.bits_per_sample && ![8, 16, 24, 32].includes(fields.bits_per_sample)) {
      errors.push('Bits per sample must be 8, 16, 24, or 32');
    }
    if (fields.channels && (fields.channels < 1 || fields.channels > 8)) {
      errors.push('Channels must be between 1 and 8');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Comprehensive validation for TAMS entities
 */
export function validateTAMSEntity(
  entityType: 'source' | 'flow' | 'segment' | 'object',
  data: any
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Common validation
  if (!data.id || !validateUUID(data.id)) {
    errors.push('Valid UUID is required');
  }

  if (data.format && !validateContentFormat(data.format)) {
    errors.push(`Invalid content format. Must be one of: ${VALID_CONTENT_FORMATS.join(', ')}`);
  }

  if (data.tags) {
    const tagValidation = validateTags(data.tags);
    errors.push(...tagValidation.errors);
  }

  // Soft delete validation
  if (data.deleted !== undefined) {
    const softDeleteValidation = validateSoftDeleteFields(data);
    errors.push(...softDeleteValidation.errors);
  }

  // Entity-specific validation
  switch (entityType) {
    case 'flow':
      if (data.format) {
        const flowValidation = validateFlowFields(data.format, data);
        errors.push(...flowValidation.errors);
      }
      break;
    
    case 'segment':
      if (data.timerange && !validateTimeRange(data.timerange)) {
        errors.push('Invalid time range format');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes data for backend submission
 */
export function sanitizeForBackend(data: any): any {
  const sanitized = { ...data };

  // Remove undefined values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });

  // Ensure soft delete fields are properly set
  if (sanitized.deleted === false) {
    sanitized.deleted_at = null;
    sanitized.deleted_by = null;
  }

  // Ensure timestamps are in ISO format
  if (sanitized.created && typeof sanitized.created === 'string') {
    sanitized.created = new Date(sanitized.created).toISOString();
  }
  if (sanitized.updated && typeof sanitized.updated === 'string') {
    sanitized.updated = new Date(sanitized.updated).toISOString();
  }

  return sanitized;
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  
  if (errors.length === 1) {
    return errors[0] || '';
  }
  
  return errors.map((error, index) => `${index + 1}. ${error}`).join('\n');
}
