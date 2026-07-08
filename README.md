mfi360-platform/
│
├── README.md
├── .env.example
├── docker-compose.yml
├── .gitignore
│
├── frontend/                         # React.js frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── index.html
│   │
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       │
│       ├── assets/
│       │   ├── images/
│       │   ├── icons/
│       │   └── logos/
│       │
│       ├── components/               # Reusable UI components
│       │   ├── common/
│       │   │   ├── Button.jsx
│       │   │   ├── Input.jsx
│       │   │   ├── Select.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── Table.jsx
│       │   │   ├── Badge.jsx
│       │   │   ├── Card.jsx
│       │   │   ├── Loader.jsx
│       │   │   └── EmptyState.jsx
│       │   │
│       │   ├── layout/
│       │   │   ├── Navbar.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   ├── DashboardLayout.jsx
│       │   │   ├── AuthLayout.jsx
│       │   │   └── ProtectedRoute.jsx
│       │   │
│       │   ├── forms/
│       │   │   ├── LoanApplicationForm.jsx
│       │   │   ├── DocumentUploadForm.jsx
│       │   │   ├── LoginForm.jsx
│       │   │   └── RegisterForm.jsx
│       │   │
│       │   ├── charts/
│       │   │   ├── RiskPieChart.jsx
│       │   │   ├── PortfolioLineChart.jsx
│       │   │   ├── AgentBarChart.jsx
│       │   │   └── ProfitChart.jsx
│       │   │
│       │   ├── maps/
│       │   │   └── CollectionRouteMap.jsx
│       │   │
│       │   └── chatbot/
│       │       ├── ChatWindow.jsx
│       │       ├── ChatMessage.jsx
│       │       └── ChatInput.jsx
│       │
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── Login.jsx
│       │   │   └── Register.jsx
│       │   │
│       │   ├── borrower/             # Borrower portal
│       │   │   ├── BorrowerHome.jsx
│       │   │   ├── LoanApplication.jsx
│       │   │   ├── DocumentUpload.jsx
│       │   │   ├── ApplicationStatus.jsx
│       │   │   ├── LoanOffer.jsx
│       │   │   └── BorrowerChatbot.jsx
│       │   │
│       │   ├── officer/              # Loan officer dashboard
│       │   │   ├── OfficerDashboard.jsx
│       │   │   ├── ApplicationQueue.jsx
│       │   │   ├── ApplicationDetails.jsx
│       │   │   ├── FraudReview.jsx
│       │   │   └── ManualDecision.jsx
│       │   │
│       │   ├── agent/                # Collection agent app
│       │   │   ├── AgentDashboard.jsx
│       │   │   ├── TodayCollections.jsx
│       │   │   ├── BorrowerVisitDetails.jsx
│       │   │   ├── OptimizedRoute.jsx
│       │   │   └── PaymentReceipt.jsx
│       │   │
│       │   └── admin/                # CEO/admin dashboard
│       │       ├── AdminDashboard.jsx
│       │       ├── PortfolioAnalytics.jsx
│       │       ├── FraudAnalytics.jsx
│       │       ├── DefaultRiskAnalytics.jsx
│       │       ├── ProfitabilitySimulator.jsx
│       │       ├── StressTesting.jsx
│       │       └── AgentPerformance.jsx
│       │
│       ├── services/                 # Frontend API layer
│       │   ├── api.js                # Axios base instance
│       │   ├── authApi.js
│       │   ├── borrowerApi.js
│       │   ├── applicationApi.js
│       │   ├── documentApi.js
│       │   ├── fraudApi.js
│       │   ├── creditApi.js
│       │   ├── riskApi.js
│       │   ├── collectionApi.js
│       │   ├── dashboardApi.js
│       │   └── chatbotApi.js
│       │
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── LanguageContext.jsx
│       │
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useApi.js
│       │   ├── useRole.js
│       │   └── useDebounce.js
│       │
│       ├── routes/
│       │   ├── AppRoutes.jsx
│       │   └── RoleRoutes.jsx
│       │
│       ├── utils/
│       │   ├── formatCurrency.js
│       │   ├── formatDate.js
│       │   ├── riskLabel.js
│       │   ├── loanStatus.js
│       │   └── validators.js
│       │
│       └── i18n/
│           ├── en.json
│           └── bn.json
│
├── backend/                          # Node.js + Express.js backend
│   ├── Dockerfile
│   ├── package.json
│   │
│   └── src/
│       ├── server.js                 # Starts backend server
│       ├── app.js                    # Express app setup
│       │
│       ├── config/
│       │   ├── env.js
│       │   ├── database.js
│       │   ├── cors.js
│       │   └── constants.js
│       │
│       ├── database/                 # PostgreSQL database layer
│       │   ├── schema.sql            # Main SQL schema
│       │   ├── seed.sql              # Demo and edge-case data
│       │   ├── connection.js         # PostgreSQL connection pool
│       │   └── queries/
│       │       ├── user.queries.js
│       │       ├── borrower.queries.js
│       │       ├── application.queries.js
│       │       ├── fraud.queries.js
│       │       ├── credit.queries.js
│       │       ├── risk.queries.js
│       │       ├── collection.queries.js
│       │       └── dashboard.queries.js
│       │
│       ├── routes/                   # API route definitions
│       │   ├── index.routes.js
│       │   ├── auth.routes.js
│       │   ├── borrower.routes.js
│       │   ├── application.routes.js
│       │   ├── document.routes.js
│       │   ├── fraud.routes.js
│       │   ├── credit.routes.js
│       │   ├── risk.routes.js
│       │   ├── collection.routes.js
│       │   ├── dashboard.routes.js
│       │   ├── notification.routes.js
│       │   └── chatbot.routes.js
│       │
│       ├── controllers/              # Request and response handling
│       │   ├── auth.controller.js
│       │   ├── borrower.controller.js
│       │   ├── application.controller.js
│       │   ├── document.controller.js
│       │   ├── fraud.controller.js
│       │   ├── credit.controller.js
│       │   ├── risk.controller.js
│       │   ├── collection.controller.js
│       │   ├── dashboard.controller.js
│       │   ├── notification.controller.js
│       │   └── chatbot.controller.js
│       │
│       ├── services/                 # Business logic
│       │   ├── auth.service.js
│       │   ├── borrower.service.js
│       │   ├── application.service.js
│       │   ├── document.service.js
│       │   ├── fraud.service.js
│       │   ├── credit.service.js
│       │   ├── risk.service.js
│       │   ├── collection.service.js
│       │   ├── dashboard.service.js
│       │   ├── notification.service.js
│       │   ├── chatbot.service.js
│       │   └── ai.service.js          # Calls Python AI service
│       │
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   ├── role.middleware.js
│       │   ├── upload.middleware.js
│       │   ├── validate.middleware.js
│       │   ├── error.middleware.js
│       │   └── notFound.middleware.js
│       │
│       ├── validators/
│       │   ├── auth.validator.js
│       │   ├── borrower.validator.js
│       │   ├── application.validator.js
│       │   ├── document.validator.js
│       │   ├── payment.validator.js
│       │   └── decision.validator.js
│       │
│       ├── utils/
│       │   ├── apiResponse.js
│       │   ├── asyncHandler.js
│       │   ├── generateToken.js
│       │   ├── passwordHash.js
│       │   ├── calculateEmi.js
│       │   ├── fraudRules.js
│       │   ├── creditRules.js
│       │   ├── riskRules.js
│       │   └── auditLogger.js
│       │
│       └── uploads/
│           ├── nid/
│           ├── selfies/
│           ├── business-docs/
│           └── bank-statements/
│
├── ai-service/                       # Python FastAPI AI service
│   ├── Dockerfile
│   ├── requirements.txt
│   │
│   └── app/
│       ├── main.py                   # FastAPI entry point
│       │
│       ├── routes/
│       │   ├── ocr.routes.py
│       │   ├── fraud.routes.py
│       │   ├── credit.routes.py
│       │   ├── risk.routes.py
│       │   ├── route_optimizer.routes.py
│       │   └── chatbot.routes.py
│       │
│       ├── services/
│       │   ├── ocr_service.py
│       │   ├── face_match_service.py
│       │   ├── document_forgery_service.py
│       │   ├── fraud_service.py
│       │   ├── credit_service.py
│       │   ├── default_risk_service.py
│       │   ├── route_optimizer_service.py
│       │   └── chatbot_service.py
│       │
│       ├── models/
│       │   ├── credit_score_model.pkl
│       │   ├── default_risk_model.pkl
│       │   └── README.md
│       │
│       ├── schemas/
│       │   ├── ocr_schema.py
│       │   ├── fraud_schema.py
│       │   ├── credit_schema.py
│       │   ├── risk_schema.py
│       │   ├── route_schema.py
│       │   └── chatbot_schema.py
│       │
│       ├── utils/
│       │   ├── text_cleaner.py
│       │   ├── bangla_normalizer.py
│       │   ├── score_helper.py
│       │   └── response_helper.py
│       │
│       └── data/
│           ├── sample_borrowers.csv
│           ├── sample_repayments.csv
│           └── sample_fraud_cases.csv
│
├── docs/
│   ├── architecture.md
│   ├── api-documentation.md
│   ├── database-schema.md
│   ├── demo-script.md
│   ├── team-task-division.md
│   └── screenshots/
│
└── scripts/
    ├── start-dev.sh
    ├── seed-db.sh
    └── reset-db.sh



# TASK2 part:
mfi360-platform/
│
├── frontend/
│   └── src/
│       │
│       ├── pages/
│       │   ├── borrower/
│       │   │   ├── LoanApplication.jsx
│       │   │   ├── DocumentUpload.jsx         
│       │   │   └── ApplicationStatus.jsx       
│       │   │
│       │   └── officer/
│       │       ├── ApplicationQueue.jsx        
│       │       ├── ApplicationDetails.jsx      
│       │       ├── FraudReview.jsx             
│       │       └── ManualDecision.jsx          
│       │
│       ├── components/
│       │   ├── forms/
│       │   │   └── DocumentUploadForm.jsx      
│       │   │
│       │   └── common/
│       │       ├── Badge.jsx                   
│       │       ├── Card.jsx                    
│       │       └── Table.jsx                   
│       │
│       ├── services/
│       │   ├── documentApi.js                  
│       │   └── fraudApi.js                     
│       │
│       └── utils/
│           ├── riskLabel.js                    
│           └── validators.js                   
│
├── backend/
│   └── src/
│       │
│       ├── routes/
│       │   ├── document.routes.js             
│       │   └── fraud.routes.js                 
│       │
│       ├── controllers/
│       │   ├── document.controller.js         
│       │   └── fraud.controller.js             
│       │
│       ├── services/
│       │   ├── document.service.js             
│       │   ├── fraud.service.js               
│       │   └── ai.service.js                   
│       │
│       ├── database/
│       │   ├── schema.sql                      
│       │   ├── seed.sql                        
│       │   │
│       │   └── queries/
│       │       ├── fraud.queries.js            
│       │       ├── application.queries.js      
│       │       └── borrower.queries.js         
│       │
│       ├── middleware/
│       │   ├── upload.middleware.js            # TASK 2: Multer file upload
│       │   ├── auth.middleware.js              # TASK 2: Secure fraud review APIs
│       │   └── role.middleware.js              # TASK 2: Only officer/admin can review
│       │
│       ├── validators/
│       │   ├── document.validator.js           # TASK 2: Validate NID/selfie/docs
│       │   └── decision.validator.js           # TASK 2: Validate manual review decision
│       │
│       ├── utils/
│       │   ├── fraudRules.js                   # TASK 2 MAIN RULE ENGINE
│       │   ├── apiResponse.js
│       │   └── auditLogger.js                  # TASK 2: Log fraud decisions
│       │
│       └── uploads/
│           ├── nid/                            # TASK 2: Uploaded NID images
│           ├── selfies/                        # TASK 2: Uploaded live selfies
│           ├── business-docs/                  # TASK 2: Business license/trade docs
│           └── bank-statements/                # TASK 2: Uploaded statements
│
├── ai-service/
│   └── app/
│       │
│       ├── routes/
│       │   ├── ocr.routes.py                  # TASK 2: OCR endpoint
│       │   └── fraud.routes.py                # TASK 2 MAIN AI ROUTES
│       │
│       ├── services/
│       │   ├── ocr_service.py                 # TASK 2: Extract NID/document text
│       │   ├── face_match_service.py          # TASK 2: Selfie vs NID photo match
│       │   ├── document_forgery_service.py    # TASK 2: Fake/tampered document check
│       │   └── fraud_service.py               # TASK 2 MAIN AI FRAUD SCORE
│       │
│       ├── schemas/
│       │   ├── ocr_schema.py                  # TASK 2: OCR request/response format
│       │   └── fraud_schema.py                # TASK 2: Fraud request/response format
│       │
│       ├── utils/
│       │   ├── text_cleaner.py                
│       │   ├── bangla_normalizer.py           
│       │   └── score_helper.py                
│       │
│       └── data/
│           └── sample_fraud_cases.csv         
│
└── docs/
    ├── architecture.md
    ├── api-documentation.md
    ├── database-schema.md
    └── demo-script.md