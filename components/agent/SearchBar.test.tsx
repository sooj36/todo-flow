import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  afterEach(() => {
    cleanup();
  });
  it('renders with placeholder text', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/검색어를 입력하세요/i);
    expect(input).toBeInTheDocument();
  });

  it('calls onSearch when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/검색어를 입력하세요/i);
    await user.type(input, 'test query{Enter}');

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });

  it('does not call onSearch when input is empty', async () => {
    const user = userEvent.setup();
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/검색어를 입력하세요/i);
    await user.type(input, '{Enter}');

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('does not call onSearch during IME composition', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/검색어를 입력하세요/i) as HTMLInputElement;

    // Simulate typing during IME composition (e.g., Korean input)
    fireEvent.change(input, { target: { value: '한글' } });

    // Create a KeyboardEvent with isComposing: true
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true
    });

    // Mock isComposing on the nativeEvent
    Object.defineProperty(event, 'isComposing', {
      value: true,
      writable: false
    });

    fireEvent(input, event);

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('calls onSearch after IME composition is complete', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/검색어를 입력하세요/i);

    // Simulate typing with IME composition complete
    fireEvent.change(input, { target: { value: '한글' } });
    fireEvent.keyDown(input, {
      key: 'Enter',
      nativeEvent: { isComposing: false } as KeyboardEvent
    });

    expect(mockOnSearch).toHaveBeenCalledWith('한글');
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });
});
