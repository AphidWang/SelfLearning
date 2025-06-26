# Learning Progress Tracking Tool - Architecture

## Core Architecture

### Frontend Architecture
- React 18+ with TypeScript
- Vite for build tooling
- Context API for state management
- Tailwind CSS for styling

### Database Architecture
- **Supabase Auth**: 內建認證系統 (auth.users)
- **User Management**: 使用 auth.users.raw_user_meta_data 儲存用戶資料
- **No Custom Users Table**: 不再使用 public.users 表
- **Role-based Access**: 角色儲存在 user_metadata.role 中

### Component Structure
```
src/
├── components/         # Reusable UI components
│   ├── blocks/        # Complex business components
│   ├── calendar/      # Calendar components
│   ├── curriculum/    # Curriculum & learning map components
│   ├── layout/        # Layout components (Header, Sidebar)
│   ├── progress/      # Progress tracking components
│   └── tasks/         # Task management components
├── contexts/          # React Context providers
│   ├── UserContext    # User authentication & data
│   ├── PlannerContext # Planning & scheduling
│   └── CurriculumContext # Curriculum management
├── pages/            # Page components
│   ├── mentor/       # Mentor-specific pages
│   ├── student/      # Student-specific pages
│   └── shared/       # Shared pages
├── styles/          # Styling utilities
│   └── tokens.ts    # Design system tokens
└── types/           # TypeScript type definitions
```

### Key Design Patterns
1. **Component Composition**
   - Smaller, focused components
   - Clear separation of concerns
   - Reusable UI elements

2. **Context-based State Management**
   - UserContext for authentication
   - PlannerContext for scheduling
   - CurriculumContext for learning content
   - Avoid prop drilling

3. **Route-based Code Splitting**
   - Lazy loading for routes
   - Optimized bundle sizes
   - Improved initial load time

4. **Responsive Design**
   - Mobile-first approach
   - Tailwind CSS breakpoints
   - Flexible layouts

## Core Features

### Student Features
- **Planning System**
  - Goal setting and breakdown
  - Action items management
  - Task integration with Schedule/Dashboard
  - AI-assisted planning suggestions

- **Learning Management**
  - Schedule management
  - Task tracking
  - Progress monitoring
  - Learning journal

### Mentor Features
- **Student Progress Monitoring**
  - Individual progress tracking
  - Performance analytics
  - Feedback system

- **Curriculum Planning**
  - Learning map creation
  - Resource management
  - Task assignment
  - Progress tracking

## Data Flow
1. User authentication through UserContext
2. Role-based route access
3. Component-level state for UI
4. Context API for global state
5. Props for component-specific data

## Performance Considerations
- Lazy loading for routes
- Optimized re-renders
- Efficient state updates
- Image optimization
- Bundle size management

## Development Guidelines
1. **Component Development**
   - Use TypeScript for type safety
   - Follow single responsibility principle
   - Implement proper error boundaries
   - Write clear documentation

2. **State Management**
   - Use Context API for global state
   - Keep component state minimal
   - Implement proper data fetching
   - Handle loading states

3. **Styling Approach**
   - Use Tailwind CSS utilities
   - Follow design system tokens
   - Maintain dark mode support
   - Ensure accessibility

4. **Testing Strategy**
   - Component unit tests
   - Integration testing
   - Accessibility testing
   - Performance monitoring