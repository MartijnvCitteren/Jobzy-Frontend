import { Navigate, Route, Routes } from 'react-router-dom';
import { VacancyCreatePage } from '../pages/vacancy-create';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/vacancies/new" replace />} />
      <Route path="/vacancies/new" element={<VacancyCreatePage />} />
    </Routes>
  );
}
