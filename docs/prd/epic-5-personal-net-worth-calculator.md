# Epic 5: Personal Net Worth Calculator

## Epic Overview

**Epic Name**: Personal Net Worth Calculator  
**Epic ID**: 5  
**Priority**: Medium  
**Estimated Duration**: 6-8 weeks  
**Dependencies**: Epic 1 (Foundation), Epic 2 (Account Integration)

### Business Value

Enable users to track their complete financial picture by calculating and monitoring their net worth (assets minus liabilities) over time. This provides a holistic view of financial health beyond just transaction tracking and budgeting.

### Epic Goal

Provide users with a comprehensive net worth tracking system that:
- Automatically incorporates existing connected account balances
- Allows manual entry of additional assets and liabilities
- Calculates and displays current net worth
- Tracks net worth changes over time
- Serves as foundation for future analytics and visualizations

## User Stories Summary

### 5.1 Net Worth Data Models & Database Schema
**As a** system architect  
**I want** to create proper data structures for assets, liabilities, and net worth calculations  
**So that** the application can reliably store and calculate net worth information

**Acceptance Criteria:**
- Database tables created for assets, liabilities, and net worth snapshots
- TypeScript interfaces defined for all net worth related data
- Data validation rules implemented
- Relationships established with existing account system

### 5.2 Manual Asset Management
**As a** user  
**I want** to add, edit, and manage my assets that aren't automatically tracked  
**So that** I can include all my wealth in my net worth calculation

**Acceptance Criteria:**
- Screen to add new assets (real estate, investments, cash, vehicles, etc.)
- Asset categories and types defined
- Edit and delete functionality for existing assets
- Value updates with optional automatic refresh
- Form validation and error handling

### 5.3 Manual Liability Management
**As a** user  
**I want** to add, edit, and manage my liabilities and debts  
**So that** I can accurately calculate my net worth by subtracting all debts

**Acceptance Criteria:**
- Screen to add new liabilities (loans, mortgages, credit cards, etc.)
- Liability categories and types defined
- Edit and delete functionality for existing liabilities
- Balance tracking with optional payment schedules
- Form validation and error handling

### 5.4 Net Worth Calculation Engine
**As a** user  
**I want** the system to automatically calculate my net worth from all sources  
**So that** I have an accurate, real-time view of my financial position

**Acceptance Criteria:**
- Service calculates total assets from connected accounts + manual assets
- Service calculates total liabilities from manual entries
- Net worth calculation: Total Assets - Total Liabilities
- Historical snapshots stored periodically (monthly)
- Integration with existing account balance updates

### 5.5 Net Worth Dashboard Screen
**As a** user  
**I want** a dedicated screen showing my current net worth and breakdown  
**So that** I can quickly understand my overall financial position

**Acceptance Criteria:**
- Main net worth display with current value
- Assets vs Liabilities breakdown with totals
- Simple trend visualization (month-over-month change)
- Quick action buttons to manage assets and liabilities
- Responsive design following app design system

### 5.6 Net Worth Historical Tracking
**As a** user  
**I want** to see how my net worth has changed over time  
**So that** I can track my financial progress and identify trends

**Acceptance Criteria:**
- Historical net worth data stored in snapshots
- Basic line chart showing net worth over time
- Period selection (3 months, 6 months, 1 year)
- Export functionality for historical data
- Integration with future analytics features

## Technical Requirements

### Data Models
- `Asset` model with categories, values, and metadata
- `Liability` model with categories, balances, and payment info
- `NetWorthSnapshot` model for historical tracking
- Integration with existing `Account` model

### API Endpoints
- CRUD operations for assets and liabilities
- Net worth calculation endpoint
- Historical data retrieval
- Bulk import/export capabilities

### UI Components
- Asset/Liability management forms
- Net worth summary cards
- Trend visualization components
- Category selector components

### Integration Points
- Existing account balance system (Mono API, MTN MoMo)
- Transaction categorization system
- User authentication and data isolation
- Background sync for periodic snapshots

## Success Metrics

- User engagement with net worth features
- Accuracy of net worth calculations
- Frequency of asset/liability updates
- User retention improvement
- Foundation readiness for analytics features

## Future Enhancements

- Advanced analytics and insights
- Goal setting based on net worth targets
- Investment portfolio integration
- Automated asset valuation updates
- Debt payoff calculators and recommendations
- Financial health scoring based on net worth trends