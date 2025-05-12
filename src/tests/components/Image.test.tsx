import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils';
import Image from '../../components/shared/Image';

describe('Image Component', () => {
  beforeEach(() => {
    // Clear console mocks before each test
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders with loading state', () => {
    render(
      <Image
        src="test.jpg"
        alt="Test"
        loadingComponent={<div data-testid="loader">Loading...</div>}
      />
    );
    expect(screen.getByTestId('loader')).toBeInTheDocument();
    expect(screen.getByTestId('image-container')).toBeInTheDocument();
  });

  it('handles successful image load', async () => {
    const onLoad = vi.fn();
    render(<Image src="test.jpg" alt="Test" onLoad={onLoad} />);
    const img = screen.getByAltText('Test');
    fireEvent.load(img);
    
    await waitFor(() => {
      expect(img).toHaveClass('opacity-100');
      expect(onLoad).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Image loaded successfully: test.jpg');
    });
  });

  it('handles image error and shows fallback', async () => {
    const onError = vi.fn();
    const customFallback = 'custom-fallback.jpg';
    
    render(
      <Image 
        src="invalid.jpg" 
        alt="Test" 
        onError={onError}
        fallbackSrc={customFallback}
      />
    );
    
    const img = screen.getByAltText('Test');
    fireEvent.error(img);
    
    await waitFor(() => {
      expect(img).toHaveAttribute('src', customFallback);
      expect(onError).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load image: invalid.jpg',
        expect.objectContaining({
          originalSrc: 'invalid.jpg',
          fallbackSrc: customFallback,
          alt: 'Test'
        })
      );
    });
  });

  it('updates image source when src prop changes', async () => {
    const { rerender } = render(<Image src="initial.jpg" alt="Test" />);
    const img = screen.getByAltText('Test');
    expect(img).toHaveAttribute('src', 'initial.jpg');

    rerender(<Image src="updated.jpg" alt="Test" />);
    await waitFor(() => {
      expect(img).toHaveAttribute('src', 'updated.jpg');
    });
  });

  it('applies custom className correctly', () => {
    render(<Image src="test.jpg" alt="Test" className="custom-class" />);
    const img = screen.getByAltText('Test');
    expect(img).toHaveClass('custom-class');
  });

  it('maintains loading state until image loads', async () => {
    render(
      <Image
        src="test.jpg"
        alt="Test"
        loadingComponent={<div data-testid="loader">Loading...</div>}
      />
    );
    
    expect(screen.getByTestId('loader')).toBeInTheDocument();
    const img = screen.getByAltText('Test');
    expect(img).toHaveClass('opacity-0');
    
    fireEvent.load(img);
    
    await waitFor(() => {
      expect(img).toHaveClass('opacity-100');
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });
  });
});