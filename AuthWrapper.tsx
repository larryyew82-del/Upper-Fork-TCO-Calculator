import React from 'react';
import App from './App';
import AuthPage, { CompanyDetailsForm } from './LandingPage';

export default function AuthWrapper() {
    const currentUserEmail = localStorage.getItem('tco_currentUser');
    const users = JSON.parse(localStorage.getItem('tco_users') || '{}');
    const userData = currentUserEmail ? users[currentUserEmail] : null;

    const isAuthenticated = userData && userData.isVerified;
    const hasProvidedDetails = userData && userData.companyDetails;

    const handleLogout = () => {
        localStorage.removeItem('tco_currentUser');
        window.location.reload();
    };

    const handleDetailsSubmit = (details: any) => {
        if (currentUserEmail) {
            const currentUsers = JSON.parse(localStorage.getItem('tco_users') || '{}');
            if (currentUsers[currentUserEmail]) {
                currentUsers[currentUserEmail].companyDetails = details;
                localStorage.setItem('tco_users', JSON.stringify(currentUsers));
                window.location.reload();
            }
        }
    };

    if (isAuthenticated) {
        if (hasProvidedDetails) {
            return <App onLogout={handleLogout} />;
        } else {
            return <CompanyDetailsForm userEmail={currentUserEmail} onSubmit={handleDetailsSubmit} />;
        }
    }
    
    return <AuthPage />; 
}