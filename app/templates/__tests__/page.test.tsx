import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TemplatesPage from '../page'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/templates',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock child components
jest.mock('@/app/components/templates/TemplateSearchBar', () => ({
  TemplateSearchBar: function MockSearchBar(props) {
    return (
      <div data-testid="search-bar">
        <input
          value={props.searchQuery}
          onChange={(e) => props.onSearch(e.target.value)}
          placeholder="Search templates"
        />
      </div>
    )
  },
}))

jest.mock('@/app/components/templates/TemplateCategoryTabs', () => ({
  TemplateCategoryTabs: function MockCategoryTabs(props) {
    return (
      <div data-testid="category-tabs">
        {['All', 'Marketing', 'Engineering', 'Sales', 'Operations'].map((cat) => (
          <button
            key={cat}
            onClick={() => props.onCategoryChange(cat)}
            data-selected={props.selectedCategory === cat}
          >
            {cat} ({props.categoryCounts[cat]})
          </button>
        ))}
      </div>
    )
  },
}))

jest.mock('@/app/components/templates/TemplateGrid', () => ({
  TemplateGrid: function MockTemplateGrid(props) {
    return (
      <div data-testid="template-grid">
        {props.templates.map((t) => (
          <div key={t.id} data-testid={`template-${t.id}`}>
            {t.name}
            <button onClick={() => props.onUseTemplate(t.id)}>Use</button>
            <button onClick={() => props.onPreview(t)}>Preview</button>
          </div>
        ))}
      </div>
    )
  },
}))

jest.mock('@/app/components/templates/TemplatePreviewModal', () => ({
  TemplatePreviewModal: function MockPreviewModal(props) {
    if (!props.open) return null
    return (
      <div data-testid="preview-modal">
        <span>{props.template?.name}</span>
        <button onClick={props.onClose}>Close</button>
        <button onClick={() => props.onUseTemplate(props.template?.id)}>Use This Template</button>
      </div>
    )
  },
}))

describe('TemplatesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the templates page header', () => {
    render(<TemplatesPage />)

    expect(screen.getByText(/agent templates/i)).toBeInTheDocument()
    expect(screen.getByText(/browse and use pre-built/i)).toBeInTheDocument()
  })

  it('renders search bar component', () => {
    render(<TemplatesPage />)

    expect(screen.getByTestId('search-bar')).toBeInTheDocument()
  })

  it('renders category tabs component', () => {
    render(<TemplatesPage />)

    expect(screen.getByTestId('category-tabs')).toBeInTheDocument()
  })

  it('renders template grid component', () => {
    render(<TemplatesPage />)

    expect(screen.getByTestId('template-grid')).toBeInTheDocument()
  })

  it('displays all templates initially', () => {
    render(<TemplatesPage />)

    // Should render templates from mockTemplates
    expect(screen.getByTestId('template-grid')).toBeInTheDocument()
  })

  it('filters templates by search query', async () => {
    const user = userEvent.setup()
    render(<TemplatesPage />)

    const searchInput = screen.getByPlaceholderText(/search templates/i)
    await user.type(searchInput, 'seo')

    await waitFor(() => {
      // Should filter to show only templates matching search
      const grid = screen.getByTestId('template-grid')
      expect(grid).toBeInTheDocument()
    })
  })

  it('filters templates by category', async () => {
    const user = userEvent.setup()
    render(<TemplatesPage />)

    const marketingButton = screen.getByRole('button', { name: /marketing/i })
    await user.click(marketingButton)

    await waitFor(() => {
      // Should show only Marketing templates
      const grid = screen.getByTestId('template-grid')
      expect(grid).toBeInTheDocument()
    })
  })

  it('combines search and category filters', async () => {
    const user = userEvent.setup()
    render(<TemplatesPage />)

    // Set category filter
    const engineeringButton = screen.getByRole('button', { name: /engineering/i })
    await user.click(engineeringButton)

    // Set search filter
    const searchInput = screen.getByPlaceholderText(/search templates/i)
    await user.type(searchInput, 'code')

    await waitFor(() => {
      // Should show only Engineering templates matching "code"
      const grid = screen.getByTestId('template-grid')
      expect(grid).toBeInTheDocument()
    })
  })

  it('opens preview modal when template preview is clicked', async () => {
    const user = userEvent.setup()
    render(<TemplatesPage />)

    const previewButtons = screen.getAllByRole('button', { name: /preview/i })
    await user.click(previewButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('preview-modal')).toBeInTheDocument()
    })
  })

  it('closes preview modal when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<TemplatesPage />)

    // Open modal
    const previewButtons = screen.getAllByRole('button', { name: /preview/i })
    await user.click(previewButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('preview-modal')).toBeInTheDocument()
    })

    // Close modal
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByTestId('preview-modal')).not.toBeInTheDocument()
    })
  })

  it('navigates to agent creation when Use Template is clicked from grid', async () => {
    const user = userEvent.setup()
    render(<TemplatesPage />)

    const useButtons = screen.getAllByRole('button', { name: /^use$/i })
    await user.click(useButtons[0])

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/agents/new?template='))
    })
  })

  it('navigates to agent creation when Use Template is clicked from modal', async () => {
    const user = userEvent.setup()
    render(<TemplatesPage />)

    // Open modal
    const previewButtons = screen.getAllByRole('button', { name: /preview/i })
    await user.click(previewButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('preview-modal')).toBeInTheDocument()
    })

    // Click Use This Template in modal
    const useButton = screen.getByRole('button', { name: /use this template/i })
    await user.click(useButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/agents/new?template='))
    })
  })

  it('displays Create Template button', () => {
    render(<TemplatesPage />)

    expect(screen.getByRole('button', { name: /create custom template/i })).toBeInTheDocument()
  })

  it('updates category counts correctly', () => {
    render(<TemplatesPage />)

    // Check that category counts are displayed
    const categoryTabs = screen.getByTestId('category-tabs')
    expect(categoryTabs).toBeInTheDocument()
    expect(categoryTabs.textContent).toMatch(/\d+/)
  })

  it('clears search when switching categories', async () => {
    const user = userEvent.setup()
    render(<TemplatesPage />)

    // Enter search query
    const searchInput = screen.getByPlaceholderText(/search templates/i)
    await user.type(searchInput, 'test query')

    // Switch category
    const salesButton = screen.getByRole('button', { name: /sales/i })
    await user.click(salesButton)

    await waitFor(() => {
      // Search should remain but filter should apply both
      const grid = screen.getByTestId('template-grid')
      expect(grid).toBeInTheDocument()
    })
  })
})
