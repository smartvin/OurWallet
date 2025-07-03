# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
## General Guidelines
1. the most important guideline is: Occam's razor. Always choose the simplest solution to the problem at hand. Do solve the problem completely - and solve it completely in the most compact form possible. We call the shortest code implementing the required logic the "silverlynx normal form" (SNF).
2. Only propose new components, such as libraries, modules or frameworks when they are truly required. Truly required meaning, it cannot be solved in reasonable effort without introducing the new component.
3. **SNF Code Pruning**: Any good code wishing to achieve SNF MUST continuously prune unused code. Dead code, redundant implementations, and unused files violate the SNF principle and must be aggressively removed to maintain the shortest possible codebase that implements the required functionality.  
    - When the need does arise, ALWAYS discuss with the user first.
    - The basic flow should be: 
        - Discover: an issue appears which requires rethinking.
        - Analyse it and try to find several possible approaches to fix it. We call those "scenarios". 
        - Present the scenarios to the user.
        - Think about the PROs and the CONs for each scenario.
        - Think about the suitability of each scebario for the problem at hand and think about how to evaluate evaluate them qualitatively.
        - Based on this evaluation, order them according to suitability, feasibility and applicability.
        - FINALLY: Propose which scenario to follow and explain your thinking and rationale.
- be very conscious of potential CORS issues. Before suggesting code which interacts with other domains, e.g. when authenticating with Google, ensure the requirements of the domain regarding headers etc. and CORS-specific constraints in general.

## Structural and architectural guidelines
- when building applications optimize structure, encapsulation, clean interfaces and segregation of concern.
- avoid file sizes (count only non-comment lines) getting too large. Ideally not more than 400 lines of code per file, definitely less than 1000 lines of code for a major component. 
- Comment all public functions in a format which allows automatic generation of web documents
- for backend APIs use swagger with decorators to automate the process of documenting, providing a page where APIs can called and serving the APIs.

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production.
    This command should always be executed by the user himself. When reaching this point, let the user know to execute the command and ask the user to report back. 
- `npm run lint` - Run ESLint checks
- `npm run preview` - Preview production build

## Code Style Guidelines
- Use TypeScript with strict mode enabled
- Use functional React components with hooks
- Use SCSS modules for styling (filename.module.scss)
- Follow ESLint configuration (extends recommended JS/TS configs)
- Use React hooks properly (follow rules of hooks)

## Naming Conventions
- Components: PascalCase (Button.tsx)
- Hooks: camelCase with 'use' prefix (useAuth.ts)
- Interfaces: PascalCase with descriptive names (ButtonProps)
- CSS modules: camelCase (button.module.scss)
- API functions: camelCase grouped by domain (userApi, predictionApi)

## Error Handling
- Use try/catch blocks for API calls
- Type all API responses properly
- Handle Axios errors with proper error messages

## Import Organization
- React imports first
- Third-party libraries next
- Local components/hooks/utils last
- Relative imports for closely related files
- Style imports at the end