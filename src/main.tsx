import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import TrainingPage from './components/TrainingPage.tsx'
import AssessmentPage from './components/AssessmentPage.tsx'
import StandardsPage from './components/StandardsPage.tsx'
import ReportPreviewDev from './components/ReportPreviewDev.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route 
          path="/training" 
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <TrainingPage />
            </Suspense>
          } 
        />
        <Route 
          path="/assessment" 
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <AssessmentPage />
            </Suspense>
          } 
        />
        <Route
          path="/standards"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <StandardsPage />
            </Suspense>
          }
        />
        {import.meta.env.DEV && (
          <Route
            path="/dev/report-preview"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <ReportPreviewDev />
              </Suspense>
            }
          />
        )}
      </Routes>
    </HashRouter>
  </StrictMode>,
)
