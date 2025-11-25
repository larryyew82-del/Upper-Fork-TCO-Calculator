import React, { useState } from 'react';
import { Button } from './components/ui/Button';
import { Card, CardContent } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Label } from './components/ui/Label';
import { useLanguage } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';
import { MoonIcon, SunIcon } from './components/icons';

const VERIFICATION_CODE = '123456';

function LoginForm({ onSwitch, onLogin }: { onSwitch: () => void, onLogin: (email: string) => void }) {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const users = JSON.parse(localStorage.getItem('tco_users') || '{}');
        const user = users[email];

        if (user && user.password === password) {
            if (!user.isVerified) {
                setError(t('emailNotVerified'));
                return;
            }
            onLogin(email);
        } else {
            setError(t('invalidCredentials'));
        }
    };

    return (
        <Card className="w-full max-w-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <CardContent className="p-8">
                 <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('loginTitle')}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('loginSubtitle')}</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    {error && <p className="text-center text-sm text-red-500">{error}</p>}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email">{t('emailLabel')}</Label>
                            <Input id="email" type="email" placeholder="you@company.com" required value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password">{t('passwordLabel')}</Label>
                            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                    </div>
                    <Button type="submit" className="w-full">{t('loginButton')}</Button>
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                        {t('dontHaveAccount')}{' '}
                        <button type="button" onClick={onSwitch} className="font-medium text-slate-800 dark:text-slate-200 hover:underline">
                            {t('signUp')}
                        </button>
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}

function RegisterForm({ onSwitch, onRegister }: { onSwitch: () => void, onRegister: (email: string) => void }) {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const users = JSON.parse(localStorage.getItem('tco_users') || '{}');
        
        if (users[email]) {
            setError(t('emailExists'));
        } else if (email && password) {
            users[email] = { password, companyDetails: null, isVerified: false };
            localStorage.setItem('tco_users', JSON.stringify(users));
            onRegister(email);
        }
    };
    
    return (
        <Card className="w-full max-w-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <CardContent className="p-8">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('registerTitle')}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('registerSubtitle')}</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-6">
                    {error && <p className="text-center text-sm text-red-500">{error}</p>}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email-reg">{t('emailLabel')}</Label>
                            <Input id="email-reg" type="email" placeholder="you@company.com" required value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password-reg">{t('passwordLabel')}</Label>
                            <Input id="password-reg" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                    </div>
                    <Button type="submit" className="w-full">{t('registerButton')}</Button>
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                        {t('alreadyHaveAccount')}{' '}
                        <button type="button" onClick={onSwitch} className="font-medium text-slate-800 dark:text-slate-200 hover:underline">
                            {t('login')}
                        </button>
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}

function VerifyForm({ email, onSuccess }: { email: string, onSuccess: () => void }) {
    const { t } = useLanguage();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleVerification = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (code === VERIFICATION_CODE) {
            const users = JSON.parse(localStorage.getItem('tco_users') || '{}');
            if (users[email]) {
                users[email].isVerified = true;
                localStorage.setItem('tco_users', JSON.stringify(users));
                onSuccess();
            }
        } else {
            setError(t('invalidVerificationCode'));
        }
    };
    
    return (
        <Card className="w-full max-w-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <CardContent className="p-8">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('verifyTitle')}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('verifySubtitle')}</p>
                </div>
                <form onSubmit={handleVerification} className="space-y-6">
                     <p className="text-xs text-center text-slate-400 dark:text-slate-500 -mt-4">{t('verifyHint')}</p>
                    {error && <p className="text-center text-sm text-red-500">{error}</p>}
                    <div className="space-y-1.5">
                        <Label htmlFor="verificationCode">{t('verificationCode')}</Label>
                        <Input id="verificationCode" type="text" required value={code} onChange={e => setCode(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full">{t('verifyButton')}</Button>
                </form>
            </CardContent>
        </Card>
    );
}

export function CompanyDetailsForm({ userEmail, onSubmit }: { userEmail: string | null, onSubmit: (details: any) => void }) {
  const { t } = useLanguage();
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [companyEmail, setCompanyEmail] = useState(userEmail || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const details = { companyName, companyAddress, contactPerson, contactNumber, companyEmail };
    onSubmit(details);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <Card className="w-full max-w-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('companyDetailsTitle')}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('companyDetailsSubtitle')}</p>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-1.5">
                <Label htmlFor="companyName">{t('companyName')}</Label>
                <Input id="companyName" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="companyAddress">{t('companyAddress')}</Label>
                <Input id="companyAddress" type="text" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactPerson">{t('contactPerson')}</Label>
                <Input id="contactPerson" type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactNumber">{t('contactNumber')}</Label>
                <Input id="contactNumber" type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value)} required />
              </div>
               <div className="space-y-1.5">
                <Label htmlFor="companyEmail">{t('companyEmail')}</Label>
                <Input id="companyEmail" type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} placeholder="corporate@company.com" required />
              </div>
            </div>
            <Button type="submit" className="w-full">{t('submit')}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
    const { language, setLanguage, t } = useLanguage();
    const { theme, setTheme } = useTheme();

    const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');
    const [emailToVerify, setEmailToVerify] = useState('');

    const handleLogin = (email: string) => {
        localStorage.setItem('tco_currentUser', email);
        window.location.reload();
    };

    const handleRegister = (email: string) => {
        setEmailToVerify(email);
        setMode('verify');
    };
    
    const handleVerify = () => {
        alert(t('verificationSuccess'));
        setMode('login');
    };

    const renderForm = () => {
        switch (mode) {
            case 'register':
                return <RegisterForm onSwitch={() => setMode('login')} onRegister={handleRegister} />;
            case 'verify':
                return <VerifyForm email={emailToVerify} onSuccess={handleVerify} />;
            case 'login':
            default:
                return <LoginForm onSwitch={() => setMode('register')} onLogin={handleLogin} />;
        }
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen flex flex-col">
            <header className="p-4">
                <div className="container mx-auto flex justify-end items-center">
                     <div className="flex items-center gap-2">
                        <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                            <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${language === 'en' ? 'bg-white text-slate-900 dark:bg-slate-300 dark:text-slate-900 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>EN</button>
                            <button onClick={() => setLanguage('zh')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${language === 'zh' ? 'bg-white text-slate-900 dark:bg-slate-300 dark:text-slate-900 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>中文</button>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                            <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1 flex items-center justify-center p-4">
               {renderForm()}
            </main>
        </div>
    );
}