import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from '../Layout';

describe('Layout Component', () => {
  it('renders children correctly', () => {
    render(
      <Layout>
        <div data-testid="test-content">Test Content</div>
      </Layout>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('displays default title in header', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByText('EduConnect')).toBeInTheDocument();
  });

  it('displays custom title when provided', () => {
    render(
      <Layout title="Custom Title">
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.queryByText('EduConnect')).not.toBeInTheDocument();
  });

  it('shows header by default', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByText('EduConnect')).toBeInTheDocument();
  });

  it('hides header when showHeader is false', () => {
    render(
      <Layout showHeader={false}>
        <div>Content</div>
      </Layout>
    );

    expect(screen.queryByText('EduConnect')).not.toBeInTheDocument();
  });

  it('displays footer with copyright text', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByText('© 2024 EduConnect - Sistema de Gestión de Estudiantes')).toBeInTheDocument();
  });

  it('applies Material UI theme', () => {
    const { container } = render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    // Check that CssBaseline is applied (removes default margins)
    expect(document.body).toHaveStyle('margin: 0');
  });

  it('has proper layout structure', () => {
    render(
      <Layout>
        <div data-testid="content">Content</div>
      </Layout>
    );

    // Check main content area exists
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    
    // Check content is within main
    const content = screen.getByTestId('content');
    expect(main).toContainElement(content);
  });
});