import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
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
});
