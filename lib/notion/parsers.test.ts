// lib/notion/parsers.test.ts
import { describe, it, expect } from 'vitest';
import {
    extractTitle,
    extractRichText,
    extractSelect,
    extractCheckbox,
    extractNumber,
    extractRelation,
    extractRelationNullable,
    extractRelationMulti,
    extractDate,
    extractDateNullable,
} from './parsers';

describe('Notion Property Parsers', () => {
    describe('extractTitle', () => {
        it('should extract title from valid property', () => {
            const property = {
                type: 'title',
                title: [{ plain_text: 'Test Title' }],
            };
            expect(extractTitle(property)).toBe('Test Title');
        });

        it('should return empty string for invalid property', () => {
            expect(extractTitle(null)).toBe('');
            expect(extractTitle({})).toBe('');
            expect(extractTitle({ type: 'title', title: [] })).toBe('');
        });
    });

    describe('extractRichText', () => {
        it('should extract rich text from valid property', () => {
            const property = {
                type: 'rich_text',
                rich_text: [{ plain_text: 'Rich Text' }],
            };
            expect(extractRichText(property)).toBe('Rich Text');
        });

        it('should return default value for invalid property', () => {
            expect(extractRichText(null)).toBe('');
            expect(extractRichText({}, 'default')).toBe('default');
            expect(extractRichText({ type: 'rich_text', rich_text: [] }, 'fallback')).toBe('fallback');
        });
    });

    describe('extractSelect', () => {
        it('should extract select value from valid property', () => {
            const property = {
                type: 'select',
                select: { name: 'option1' },
            };
            expect(extractSelect(property, 'default')).toBe('option1');
        });

        it('should return default value for invalid property', () => {
            expect(extractSelect(null, 'default')).toBe('default');
            expect(extractSelect({}, 'fallback')).toBe('fallback');
            expect(extractSelect({ type: 'select', select: null }, 'none')).toBe('none');
        });

        it('should work with generic types', () => {
            type Color = 'red' | 'blue' | 'green';
            const property = {
                type: 'select',
                select: { name: 'red' },
            };
            const result: Color = extractSelect<Color>(property, 'blue');
            expect(result).toBe('red');
        });
    });

    describe('extractCheckbox', () => {
        it('should extract checkbox value from valid property', () => {
            const propertyTrue = {
                type: 'checkbox',
                checkbox: true,
            };
            const propertyFalse = {
                type: 'checkbox',
                checkbox: false,
            };
            expect(extractCheckbox(propertyTrue)).toBe(true);
            expect(extractCheckbox(propertyFalse)).toBe(false);
        });

        it('should return default value for invalid property', () => {
            expect(extractCheckbox(null)).toBe(false);
            expect(extractCheckbox({}, true)).toBe(true);
            expect(extractCheckbox({ type: 'checkbox', checkbox: null })).toBe(false);
        });
    });

    describe('extractNumber', () => {
        it('should extract number from valid property', () => {
            const property = {
                type: 'number',
                number: 42,
            };
            expect(extractNumber(property)).toBe(42);
        });

        it('should handle zero correctly', () => {
            const property = {
                type: 'number',
                number: 0,
            };
            expect(extractNumber(property)).toBe(0);
        });

        it('should return default value for invalid property', () => {
            expect(extractNumber(null)).toBe(0);
            expect(extractNumber({}, 99)).toBe(99);
            expect(extractNumber({ type: 'number', number: null }, 10)).toBe(10);
        });
    });

    describe('extractRelation', () => {
        it('should extract first relation ID from valid property', () => {
            const property = {
                type: 'relation',
                relation: [{ id: 'rel-123' }, { id: 'rel-456' }],
            };
            expect(extractRelation(property)).toBe('rel-123');
        });

        it('should return default value for invalid property', () => {
            expect(extractRelation(null)).toBe('');
            expect(extractRelation({}, 'default-id')).toBe('default-id');
            expect(extractRelation({ type: 'relation', relation: [] }, 'none')).toBe('none');
        });
    });

    describe('extractRelationNullable', () => {
        it('should extract first relation ID from valid property', () => {
            const property = {
                type: 'relation',
                relation: [{ id: 'rel-789' }],
            };
            expect(extractRelationNullable(property)).toBe('rel-789');
        });

        it('should return null for invalid property', () => {
            expect(extractRelationNullable(null)).toBeNull();
            expect(extractRelationNullable({})).toBeNull();
            expect(extractRelationNullable({ type: 'relation', relation: [] })).toBeNull();
        });
    });

    describe('extractRelationMulti', () => {
        it('should extract all relation IDs from valid property', () => {
            const property = {
                type: 'relation',
                relation: [{ id: 'rel-1' }, { id: 'rel-2' }, { id: 'rel-3' }],
            };
            expect(extractRelationMulti(property)).toEqual(['rel-1', 'rel-2', 'rel-3']);
        });

        it('should return empty array for invalid property', () => {
            expect(extractRelationMulti(null)).toEqual([]);
            expect(extractRelationMulti({})).toEqual([]);
            expect(extractRelationMulti({ type: 'relation', relation: [] })).toEqual([]);
        });

        it('should handle single relation', () => {
            const property = {
                type: 'relation',
                relation: [{ id: 'single' }],
            };
            expect(extractRelationMulti(property)).toEqual(['single']);
        });
    });

    describe('extractDate', () => {
        it('should extract date string from valid property', () => {
            const property = {
                type: 'date',
                date: { start: '2026-01-09' },
            };
            expect(extractDate(property)).toBe('2026-01-09');
        });

        it('should return default value for invalid property', () => {
            expect(extractDate(null)).toBe('');
            expect(extractDate({}, '2026-01-01')).toBe('2026-01-01');
            expect(extractDate({ type: 'date', date: null }, 'fallback')).toBe('fallback');
        });
    });

    describe('extractDateNullable', () => {
        it('should extract date string from valid property', () => {
            const property = {
                type: 'date',
                date: { start: '2026-12-31' },
            };
            expect(extractDateNullable(property)).toBe('2026-12-31');
        });

        it('should return null for invalid property', () => {
            expect(extractDateNullable(null)).toBeNull();
            expect(extractDateNullable({})).toBeNull();
            expect(extractDateNullable({ type: 'date', date: null })).toBeNull();
        });
    });
});
