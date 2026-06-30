# AlignME Pre-Screening Feature Documentation

## Overview

The Pre-Screening feature is a comprehensive questionnaire builder and automated screening dashboard that allows recruiters to create custom screening tests and automatically categorize candidates as "Qualified" or "Unqualified" based on their responses.

## Features

### 1. Questionnaire Builder (`/questionnaire-builder.html`)

#### Key Features:

- **Drag-and-drop question types** from sidebar
- **AI-powered question generation** for different job roles
- **Multiple question types**:
  - Multiple Choice (with correct answer marking)
  - Yes/No questions
  - Short Answer (with keyword scoring)
  - File Upload (resume/documents)
- **Real-time preview** functionality
- **Auto-save** and draft management
- **Custom scoring weights** per question
- **Passing score threshold** configuration

#### AI Question Generation:

- Supports job roles: Software Developer, Data Analyst, Marketing Manager, Sales Representative, Project Manager
- Generates contextually relevant questions based on role and question type
- Provides intelligent scoring suggestions

#### Question Types in Detail:

**Multiple Choice:**

- Up to 10 options per question
- Visual correct answer marking
- Weighted scoring system
- Interactive option management

**Yes/No:**

- Simple binary questions
- Configurable scoring for yes/no responses
- Quick assessment tool

**Short Answer:**

- Keyword-based automatic scoring
- Character limit controls
- Expected keyword configuration for scoring

**File Upload:**

- Multiple file type support (PDF, DOC, DOCX, TXT)
- File size validation (max 10MB)
- Drag-and-drop interface
- File type restrictions per question

### 2. Results Dashboard (`/screening-results-dashboard.html`)

#### Key Features:

- **Real-time analytics** with charts and metrics
- **Automatic candidate categorization** (Qualified/Unqualified)
- **Detailed scoring breakdown** per question
- **Export functionality** (CSV format)
- **Candidate detail views** with response analysis
- **Performance analytics** with score distribution

#### Dashboard Sections:

**Overview Cards:**

- Total candidates processed
- Qualified vs unqualified counts
- Qualification rate percentage
- Trend indicators

**Candidate Lists:**

- Filterable by status (All/Qualified/Unqualified)
- Sortable by score
- Individual candidate detail views
- Contact/interview scheduling actions

**Analytics Sidebar:**

- Score distribution pie chart
- Performance breakdown by score ranges
- Visual progress bars for different score levels

### 3. Candidate Questionnaire Interface (`/screening-questionnaire.html`)

#### Features:

- **Public access** via shareable links
- **Progressive questionnaire** with navigation
- **Real-time progress tracking**
- **Auto-save responses** as user progresses
- **Responsive design** for mobile and desktop
- **Immediate results** upon completion
- **File upload support** with drag-and-drop

#### User Experience:

- Clean, intuitive interface following AlignME design guidelines
- Keyboard navigation support
- Progress indicators
- Validation and error handling
- Mobile-optimized touch interactions

## Technical Implementation

### Backend API Endpoints

#### Questionnaire Management:

- `GET /api/screening/questionnaires` - Get all questionnaires for employer
- `POST /api/screening/questionnaires` - Create new questionnaire
- `PUT /api/screening/questionnaires/:id` - Update questionnaire
- `DELETE /api/screening/questionnaires/:id` - Delete questionnaire
- `GET /api/screening/questionnaire/:id/public` - Public access for candidates

#### AI Question Generation:

- `GET /api/screening/questions/generate` - Generate AI questions
  - Parameters: jobRole, questionType, count
  - Returns contextually relevant questions with scoring

#### Response Handling:

- `POST /api/screening/respond` - Submit questionnaire responses
- `GET /api/screening/results/:questionnaireId` - Get screening results

#### Results & Analytics:

- Automatic scoring calculation
- Real-time analytics generation
- Candidate categorization based on thresholds

### Scoring Algorithm

#### Multiple Choice:

- Full points for correct answer
- Zero points for incorrect answer

#### Yes/No:

- Configurable scoring (typically "Yes" = full points)

#### Short Answer:

- Base score for adequate length (>50 characters)
- Keyword matching algorithm (0.3 weight for length, 0.7 for keywords)
- Intelligent content analysis

#### File Upload:

- Points awarded for file presence
- Bonus points for correct file types
- File validation and processing

#### Overall Categorization:

- **Qualified**: Score >= passing threshold (default 70%)
- **Unqualified**: Score < passing threshold
- Automatic recommendation generation

### Data Storage

#### Files:

- `questionnaires.json` - Questionnaire definitions
- `screening-responses.json` - Candidate responses
- `screening-candidates.json` - Candidate metadata

#### Data Structure:

```json
{
  "questionnaire": {
    "id": "unique_id",
    "title": "Software Developer Pre-Screening",
    "description": "Initial screening for software development positions",
    "questions": [...],
    "passingScore": 70,
    "statistics": {
      "totalResponses": 45,
      "qualifiedCandidates": 32,
      "averageScore": 78.5
    }
  }
}
```

## Design Philosophy

### AlignME Color Scheme:

- Primary: #003B6F (Deep Blue)
- Secondary: #1565C0, #42A5F5 (Blue variants)
- Success: #4CAF50 (Green)
- Warning: #FF9800 (Orange)
- Error: #F44336 (Red)

### UI/UX Principles:

- **Circular, collaborative design elements** throughout
- **Responsive design** for all screen sizes
- **Accessibility compliant** with proper ARIA labels
- **Intuitive navigation** with clear visual hierarchy
- **Real-time feedback** for all user actions

### Performance Features:

- **Auto-save functionality** prevents data loss
- **Lazy loading** for large candidate lists
- **Optimized rendering** for smooth interactions
- **Client-side validation** for immediate feedback

## Usage Workflow

### For Employers:

1. **Create Questionnaire**:
   - Access questionnaire builder
   - Add basic information (title, description, passing score)
   - Build questions using sidebar tools or AI generation
   - Preview and test questionnaire
   - Publish and get shareable link

2. **Share with Candidates**:
   - Copy public questionnaire link
   - Share via email, job posting, or direct message
   - Track responses in real-time

3. **Review Results**:
   - Access results dashboard
   - Review qualified/unqualified candidates
   - Export data for further analysis
   - Contact qualified candidates for next steps

### For Candidates:

1. **Access Questionnaire**:
   - Click on provided link
   - View questionnaire overview
   - Start answering questions

2. **Complete Assessment**:
   - Progress through questions
   - Submit responses
   - View immediate results

3. **Follow Up**:
   - Wait for employer contact if qualified
   - Receive feedback on performance

## Integration Points

### With Existing AlignME Features:

- **Job Posting System**: Link questionnaires to specific job postings
- **User Authentication**: Secure access for employers
- **Analytics Dashboard**: Integration with broader platform analytics
- **Notification System**: Alerts for new responses
- **Email System**: Automated candidate communications

### Future Enhancements:

- **Video Interview Integration**: Schedule interviews directly from results
- **Advanced Analytics**: Machine learning for question effectiveness
- **Template Library**: Pre-built questionnaire templates
- **Bulk Operations**: Mass candidate management tools
- **API Integration**: Third-party ATS system connections

## Security & Privacy

### Data Protection:

- Secure API endpoints with authentication
- Input validation and sanitization
- File upload security measures
- GDPR compliance considerations

### Access Control:

- Employer-only access to builder and results
- Public read-only access for candidates
- Session management and timeout handling

## Mobile Optimization

### Responsive Features:

- Touch-optimized interface elements
- Swipe navigation support
- Optimized file upload for mobile
- Adaptive layouts for different screen sizes
- Haptic feedback for touch interactions

## Accessibility

### Compliance Features:

- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management
- Alternative text for all visual elements

## Performance Metrics

### Key Performance Indicators:

- Questionnaire completion rate
- Average completion time
- Qualification rate trends
- Question effectiveness scores
- User engagement metrics

This Pre-Screening feature represents a significant enhancement to AlignME's recruitment capabilities, providing a powerful, user-friendly solution for automated candidate screening that saves time while maintaining high-quality candidate assessment standards.
