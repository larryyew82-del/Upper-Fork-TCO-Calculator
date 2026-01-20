import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { useLanguage } from '../contexts/LanguageContext';
import { TrendingUpIcon, AlertTriangleIcon, CheckCircleIcon, LightbulbIcon, RulerIcon } from './icons';

interface RecommendationData {
    key: string;
    params?: Record<string, string | number>;
}

type MachineType = 'forklift' | 'ic_forklift' | 'stacker' | 'reach_truck' | '3_wheel';
type SurfaceType = 'dry_concrete' | 'wet_concrete' | 'asphalt' | 'gravel';
type LoadState = 'loaded' | 'empty';

export default function GradeabilityCalculator() {
    const { t } = useLanguage();

    // Inputs
    const [machineType, setMachineType] = useState<MachineType>('forklift');
    const [loadState, setLoadState] = useState<LoadState>('loaded');
    const [surface, setSurface] = useState<SurfaceType>('dry_concrete');
    const [rampRise, setRampRise] = useState<number>(0);
    const [rampRun, setRampRun] = useState<number>(0);

    // Results
    const [calculated, setCalculated] = useState(false);
    const [gradePercent, setGradePercent] = useState(0);
    const [gradeAngle, setGradeAngle] = useState(0);
    const [safetyStatus, setSafetyStatus] = useState<'safe' | 'caution' | 'unsafe'>('safe');
    const [maxGradeLimit, setMaxGradeLimit] = useState(0);
    const [warnings, setWarnings] = useState<RecommendationData[]>([]);

    // Constants
    // Max Gradeability (Approximate Reference Values)
    const gradeSpecs: Record<MachineType, { loaded: number, empty: number }> = {
        'stacker': { loaded: 6, empty: 10 },
        'reach_truck': { loaded: 8, empty: 12 },
        'forklift': { loaded: 14, empty: 18 }, // Electric 4-wheel
        '3_wheel': { loaded: 12, empty: 15 },
        'ic_forklift': { loaded: 20, empty: 25 },
    };

    const surfaceFactors: Record<SurfaceType, number> = {
        'dry_concrete': 1.0,
        'wet_concrete': 0.75, // Significantly reduced traction
        'asphalt': 0.85,
        'gravel': 0.50, // Very poor traction
    };

    const calculate = () => {
        if (rampRun <= 0) return;

        // 1. Calculate Grade
        // Grade % = (Rise / Run) * 100
        const pct = (rampRise / rampRun) * 100;
        // Angle = arctan(Rise / Run) * (180 / PI)
        const angle = Math.atan(rampRise / rampRun) * (180 / Math.PI);

        setGradePercent(Number(pct.toFixed(1)));
        setGradeAngle(Number(angle.toFixed(1)));

        // 2. Determine Max Limit
        const baseLimit = gradeSpecs[machineType][loadState];
        const factor = surfaceFactors[surface];
        const adjustedLimit = Math.floor(baseLimit * factor);
        
        setMaxGradeLimit(adjustedLimit);

        // 3. Safety Check
        let status: 'safe' | 'caution' | 'unsafe' = 'safe';
        const newWarnings: RecommendationData[] = [];

        // Check 1: Tractive Effort / Power Limit
        if (pct > adjustedLimit) {
            status = 'unsafe';
            // Translate machine type to human readable key for params
            const typeKeyMap: Record<MachineType, string> = {
                'forklift': 'optForklift',
                'ic_forklift': 'optICForklift',
                'stacker': 'optStacker',
                'reach_truck': 'optReachTruck',
                '3_wheel': 'opt3Wheel'
            };

            const loadKeyMap: Record<LoadState, string> = {
                'loaded': 'statusLoaded',
                'empty': 'statusEmpty'
            };

            newWarnings.push({
                key: 'gradeWarningText',
                params: {
                    grade: pct.toFixed(1),
                    limit: adjustedLimit,
                    load: t(loadKeyMap[loadState]),
                    type: t(typeKeyMap[machineType])
                }
            });
        } else if (pct > adjustedLimit * 0.85) {
            status = 'caution';
        }

        // Check 2: Ground Clearance (Simple heuristic)
        // Most industrial forklifts bottom out > 15-18% unless rough terrain
        if (pct > 15 && machineType !== 'ic_forklift') {
             // Downgrade status if it was safe, keep unsafe if it was unsafe
             if (status === 'safe') status = 'caution';
             newWarnings.push({ key: 'clearanceWarningText' });
        }

        setSafetyStatus(status);
        setWarnings(newWarnings);
        setCalculated(true);
    };

    const getWarningMessage = (w: RecommendationData) => {
        let msg = t(w.key);
        if (w.params) {
            Object.entries(w.params).forEach(([k, v]) => {
                msg = msg.replace(`{${k}}`, String(v));
            });
        }
        return msg;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs */}
            <Card className="rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-slate-100 border-b pb-2 border-slate-100 dark:border-slate-700">
                        <TrendingUpIcon className="h-5 w-5" /> {t('rampParams')}
                    </h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>{t('rampRise')}</Label>
                                <Input type="number" value={rampRise || ''} onChange={(e) => setRampRise(Number(e.target.value))} placeholder="e.g. 1000" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>{t('rampRun')}</Label>
                                <Input type="number" value={rampRun || ''} onChange={(e) => setRampRun(Number(e.target.value))} placeholder="e.g. 10000" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('machineType')}</Label>
                            <Select value={machineType} onValueChange={(v: any) => setMachineType(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stacker">{t('optStacker')}</SelectItem>
                                    <SelectItem value="reach_truck">{t('optReachTruck')}</SelectItem>
                                    <SelectItem value="3_wheel">{t('opt3Wheel')}</SelectItem>
                                    <SelectItem value="forklift">{t('optForklift')}</SelectItem>
                                    <SelectItem value="ic_forklift">{t('optICForklift')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('loadStatus')}</Label>
                            <Select value={loadState} onValueChange={(v: any) => setLoadState(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="loaded">{t('statusLoaded')}</SelectItem>
                                    <SelectItem value="empty">{t('statusEmpty')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                         <div className="space-y-1.5">
                            <Label>{t('surfaceCondition')}</Label>
                            <Select value={surface} onValueChange={(v: any) => setSurface(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dry_concrete">{t('surfDryConcrete')}</SelectItem>
                                    <SelectItem value="wet_concrete">{t('surfWetConcrete')}</SelectItem>
                                    <SelectItem value="asphalt">{t('surfAsphalt')}</SelectItem>
                                    <SelectItem value="gravel">{t('surfGravel')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={calculate} className="w-full mt-4" size="default">
                            {t('analyzeGrade')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            <Card className={`rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-opacity duration-300 ${calculated ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <CardContent className="p-6">
                     <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-slate-100 border-b pb-2 border-slate-100 dark:border-slate-700">
                        <TrendingUpIcon className="h-5 w-5" /> {t('gradeResult')}
                    </h2>

                    <div className={`p-4 rounded-lg text-center mb-6 border-2 ${!calculated ? 'border-slate-300 bg-slate-50' : safetyStatus === 'safe' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : safetyStatus === 'caution' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                         {!calculated ? (
                             <span className="text-xl font-bold text-slate-500">{t('statusWaiting')}</span>
                         ) : safetyStatus === 'safe' ? (
                            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                                <CheckCircleIcon className="h-6 w-6" />
                                <span className="text-xl font-bold">{t('statusGo')}</span>
                            </div>
                         ) : safetyStatus === 'caution' ? (
                            <div className="flex items-center justify-center gap-2 text-yellow-700 dark:text-yellow-400">
                                <AlertTriangleIcon className="h-6 w-6" />
                                <span className="text-xl font-bold">{t('statusCaution')}</span>
                            </div>
                         ) : (
                            <div className="flex items-center justify-center gap-2 text-red-700 dark:text-red-400">
                                <AlertTriangleIcon className="h-6 w-6" />
                                <span className="text-xl font-bold">{t('statusStop')}</span>
                            </div>
                         )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 uppercase flex items-center gap-1"><TrendingUpIcon className="h-3 w-3"/> {t('calculatedGrade')}</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{gradePercent}%</p>
                            <p className="text-xs text-slate-400">({gradeAngle}°)</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 uppercase flex items-center gap-1"><RulerIcon className="h-3 w-3"/> {t('maxGradeForMachine')}</p>
                            <p className={`text-lg font-bold ${safetyStatus === 'unsafe' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>{maxGradeLimit}%</p>
                            <p className="text-xs text-slate-400">{t('surfaceFactor')}: {surfaceFactors[surface] * 100}%</p>
                        </div>
                    </div>

                    {warnings.map((w, idx) => (
                        <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-400 p-3 mb-4 text-sm rounded-r">
                            <p className="font-bold flex items-center gap-2"><AlertTriangleIcon className="h-4 w-4"/> {w.key.includes('grade') ? t('gradeWarningTitle') : t('clearanceWarning')}</p>
                            <p>{getWarningMessage(w)}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}