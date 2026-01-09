// lib/notion/parsers.ts
// Common Notion property parsing utilities

/**
 * Extract plain text from Title property
 */
export function extractTitle(property: unknown): string {
    if (
        property &&
        typeof property === 'object' &&
        'type' in property &&
        property.type === 'title' &&
        'title' in property &&
        Array.isArray(property.title) &&
        property.title.length > 0
    ) {
        return property.title[0].plain_text;
    }
    return '';
}

/**
 * Extract plain text from Rich Text property
 */
export function extractRichText(property: unknown, defaultValue = ''): string {
    if (
        property &&
        typeof property === 'object' &&
        'type' in property &&
        property.type === 'rich_text' &&
        'rich_text' in property &&
        Array.isArray(property.rich_text) &&
        property.rich_text.length > 0
    ) {
        return property.rich_text[0].plain_text;
    }
    return defaultValue;
}

/**
 * Extract value from Select property with generic type
 */
export function extractSelect<T extends string>(
    property: unknown,
    defaultValue: T
): T {
    if (
        property &&
        typeof property === 'object' &&
        'type' in property &&
        property.type === 'select' &&
        'select' in property &&
        property.select &&
        typeof property.select === 'object' &&
        'name' in property.select
    ) {
        return property.select.name as T;
    }
    return defaultValue;
}

/**
 * Extract value from Checkbox property
 */
export function extractCheckbox(property: unknown, defaultValue = false): boolean {
    if (
        property &&
        typeof property === 'object' &&
        'type' in property &&
        property.type === 'checkbox' &&
        'checkbox' in property &&
        typeof property.checkbox === 'boolean'
    ) {
        return property.checkbox;
    }
    return defaultValue;
}

/**
 * Extract value from Number property
 */
export function extractNumber(property: unknown, defaultValue = 0): number {
    if (
        property &&
        typeof property === 'object' &&
        'type' in property &&
        property.type === 'number' &&
        'number' in property &&
        typeof property.number === 'number'
    ) {
        return property.number;
    }
    return defaultValue;
}

/**
 * Extract single ID from Relation property
 */
export function extractRelation(property: unknown, defaultValue = ''): string {
    if (
        property &&
        typeof property === 'object' &&
        'type' in property &&
        property.type === 'relation' &&
        'relation' in property &&
        Array.isArray(property.relation) &&
        property.relation.length > 0
    ) {
        return property.relation[0].id;
    }
    return defaultValue;
}

/**
 * Extract single ID from Relation property, returning null if not found
 */
export function extractRelationNullable(property: unknown): string | null {
    if (
        property &&
        typeof property === 'object' &&
        'type' in property &&
        property.type === 'relation' &&
        'relation' in property &&
        Array.isArray(property.relation) &&
        property.relation.length > 0
    ) {
        return property.relation[0].id;
    }
    return null;
}

/**
 * Extract multiple IDs from Relation property
 */
export function extractRelationMulti(property: unknown): string[] {
    if (
        property &&
        typeof property === 'object' &&
        'type' in property &&
        property.type === 'relation' &&
        'relation' in property &&
        Array.isArray(property.relation)
    ) {
        return property.relation.map(rel => rel.id);
    }
    return [];
}

/**
 * Extract date start value from Date property
 */
export function extractDate(property: unknown, defaultValue = ''): string {
    if (
        property &&
        typeof property === 'object' &&
        'type' in property &&
        property.type === 'date' &&
        'date' in property &&
        property.date &&
        typeof property.date === 'object' &&
        'start' in property.date &&
        typeof property.date.start === 'string'
    ) {
        return property.date.start;
    }
    return defaultValue;
}

/**
 * Extract date start value from Date property, returning null if not found
 */
export function extractDateNullable(property: unknown): string | null {
    if (
        property &&
        typeof property === 'object' &&
        'type' in property &&
        property.type === 'date' &&
        'date' in property &&
        property.date &&
        typeof property.date === 'object' &&
        'start' in property.date &&
        typeof property.date.start === 'string'
    ) {
        return property.date.start;
    }
    return null;
}
