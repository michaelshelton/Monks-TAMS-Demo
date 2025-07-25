# Contributing to TAMS Frontend

Thank you for your interest in contributing to the TAMS Frontend application! This guide will help you get started.

## 🚀 Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Local Development

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/vastDemoTAMS.git
   cd vastDemoTAMS/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:5173](http://localhost:5173)

## 📝 Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes
- Follow the coding standards below
- Write tests for new functionality
- Update documentation as needed

### 3. Test Your Changes
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### 4. Commit Your Changes
```bash
git add .
git commit -m "feat: add new feature description"
```

### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

## 🎨 Coding Standards

### TypeScript
- Use strict TypeScript configuration
- Define proper types for all functions and components
- Avoid `any` type - use proper typing instead

### React Components
- Use functional components with hooks
- Follow the naming convention: `PascalCase` for components
- Export components as default exports
- Use proper prop types with TypeScript interfaces

### File Structure
```
src/
├── components/          # Reusable components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── styles/             # CSS and styling files
└── constants/          # Application constants
```

### Component Example
```typescript
import React from 'react';
import { ComponentProps } from '@mantine/core';

interface MyComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export default function MyComponent({ 
  title, 
  description, 
  onAction 
}: MyComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {onAction && <button onClick={onAction}>Action</button>}
    </div>
  );
}
```

### Styling
- Use Mantine components and props for styling
- Avoid inline styles when possible
- Use CSS classes for custom styling
- Follow the TAMS design system

### Naming Conventions
- **Files**: `kebab-case` (e.g., `my-component.tsx`)
- **Components**: `PascalCase` (e.g., `MyComponent`)
- **Functions**: `camelCase` (e.g., `handleClick`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- **Types/Interfaces**: `PascalCase` (e.g., `UserProfile`)

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests
- Test component rendering
- Test user interactions
- Test error states
- Test loading states

### Test Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders with title', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', () => {
    const mockAction = jest.fn();
    render(<MyComponent title="Test" onAction={mockAction} />);
    
    fireEvent.click(screen.getByText('Action'));
    expect(mockAction).toHaveBeenCalled();
  });
});
```

## 📚 Documentation

### Code Comments
- Comment complex logic
- Document component props
- Explain business logic
- Use JSDoc for functions

### README Updates
- Update README.md for new features
- Add usage examples
- Update installation instructions if needed

## 🔍 Code Review Process

### Before Submitting
- [ ] Code follows TypeScript standards
- [ ] All tests pass
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Documentation is updated
- [ ] No console errors

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] All tests pass

## Screenshots (if applicable)
Add screenshots for UI changes
```

## 🐛 Bug Reports

When reporting bugs, please include:
1. **Environment**: OS, Node.js version, browser
2. **Steps to reproduce**: Clear, step-by-step instructions
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Console errors**: Any error messages

## 💡 Feature Requests

When requesting features, please include:
1. **Use case**: Why this feature is needed
2. **Proposed solution**: How it should work
3. **Mockups**: UI/UX designs if applicable
4. **Priority**: High/Medium/Low

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Documentation**: Check the README and code comments

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing to TAMS Frontend! 🎉 