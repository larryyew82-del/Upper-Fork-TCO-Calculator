import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Separator } from './ui/Separator';
import { useLanguage } from '../contexts/LanguageContext';
import { RulerIcon, WeightIcon, AlertTriangleIcon, CheckCircleIcon, LightbulbIcon, TruckIcon, CalculatorIcon } from './icons';

interface Recommendation {
    title: string;
    message: string;
}

export default function LoadCalculator() {
    const { t } = useLanguage();

    // Inputs
    const [machineType, setMachineType] = useState<'forklift' | 'stacker' | 'ic_forklift'>('forklift');
    const [wheelbase, setWheelbase] = useState<'standard' | 'short'>('standard');
    const [tonnage, setTonnage] = useState<number>(3000);
    const [loadWeight, setLoadWeight] = useState<number>(0);
    const [dimL, setDimL] = useState<number>(0);
    const [dimW, setDimW] = useState<number>(0);
    const [dimH, setDimH] = useState<number>(0);
    const [forkLength, setForkLength] = useState<number>(1070);

    // Results
    const [calculated, setCalculated] = useState(false);
    const [safeCap, setSafeCap] = useState(0);
    const [actualLC, setActualLC] = useState(0);
    const [ratedLC, setRatedLC] = useState(500);
    const [isSafe, setIsSafe] = useState(true);
    const [forkWarning, setForkWarning] = useState<string | null>(null);
    const [heightData, setHeightData] = useState<any[]>([]);
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

    const forkliftOptions = [1500, 2000, 2500, 3000, 3500, 4000, 5000, 7000, 10000];
    const stackerOptions = [1500, 2000];

    // Effect to handle machine type switching constraints
    useEffect(() => {
        if (machineType === 'stacker') {
            setWheelbase('short');
            if (!stackerOptions.includes(tonnage)) {
                setTonnage(1500); // Reset to valid
            }
        }
    }, [machineType]);

    const calculate = () => {
        // Constants & Variables
        // Determine Rated Load Center (Standard rule: <5T = 500mm, >=5T = 600mm)
        const currentRatedLC = (tonnage >= 5000) ? 600 : 500;
        
        // Determine 'C' (Lost Load Center)
        const cDim = (wheelbase === 'short') ? 400 : 480;

        // Calculate Actual Load Center
        const currentActualLC = dimL > 0 ? dimL / 2 : 0;

        // Main Calculation Logic
        let calculatedSafeCap = 0;
        if (currentActualLC <= currentRatedLC) {
            calculatedSafeCap = tonnage;
        } else {
            // Formula: RatedCap * (RatedLC + C) / (ActualLC + C)
            calculatedSafeCap = (tonnage * (currentRatedLC + cDim)) / (currentActualLC + cDim);
        }
        calculatedSafeCap = Math.floor(calculatedSafeCap);

        // Update State
        setSafeCap(calculatedSafeCap);
        setActualLC(currentActualLC);
        setRatedLC(currentRatedLC);
        
        const safe = loadWeight > 0 && loadWeight <= calculatedSafeCap;
        setIsSafe(safe);

        // Fork Length Check
        const minForkLen = dimL * 0.66;
        if (dimL > 0 && forkLength < minForkLen) {
            setForkWarning(t('forkWarningText')
                .replace('{loadLen}', dimL.toString())
                .replace('{forkLen}', forkLength.toString())
                .replace('{minLen}', Math.floor(minForkLen).toString())
            );
        } else {
            setForkWarning(null);
        }

        // Generate Height Table
        const heightSteps = [
            { h: 3000, f: 1.00 },
            { h: 3500, f: 0.96 },
            { h: 4000, f: 0.92 },
            { h: 4500, f: 0.88 }, 
            { h: 5000, f: 0.83 },
            { h: 5500, f: 0.78 },
            { h: 6000, f: 0.72 }
        ];

        const tableData = heightSteps.filter(s => !(machineType === 'stacker' && s.h > 3500)).map(s => {
            const capAtHeight = Math.floor(calculatedSafeCap * s.f);
            return {
                h: s.h,
                cap: capAtHeight,
                safe: loadWeight <= capAtHeight
            };
        });
        setHeightData(tableData);

        // Recommendation Logic
        if (!safe) {
            findBetterMachine(loadWeight, currentActualLC, currentRatedLC, cDim, tonnage, machineType);
        } else {
            setRecommendation(null);
        }

        setCalculated(true);
    };

    const findBetterMachine = (targetWeight: number, actualLC: number, ratedLC: number, cDim: number, currentCap: number, type: string) => {
        // Scenario 1: Stacker Insufficient
        if (type === 'stacker') {
            const maxStackerCap = (2000 * (ratedLC + cDim)) / (actualLC + cDim);
            if (targetWeight > maxStackerCap) {
                setRecommendation({
                    title: t('recommendationTitle'),
                    message: t('recommendationStacker').replace('{cap}', Math.floor(maxStackerCap).toString())
                });
                return;
            }
        }

        // Scenario 2: Find larger tonnage
        let searchList = forkliftOptions;
        let suggestion = 0;
        let found = false;

        for (let cap of searchList) {
            if (cap <= currentCap) continue;

            let tempRatedLC = (cap >= 5000) ? 600 : 500;
            let capacityAtLC = (cap * (tempRatedLC + cDim)) / (actualLC + cDim);
            
            if (capacityAtLC >= targetWeight) {
                suggestion = cap;
                found = true;
                break;
            }
        }

        if (found) {
            // Recommendation name logic: if it was a stacker but needs huge capacity, suggest forklift.
            // If it was IC forklift, we just suggest a bigger "Forklift" (generic).
            let unitName = (suggestion >= 1500 && type === 'stacker' && suggestion <= 2000) ? "Stacker" : "Forklift";
            
            setRecommendation({
                title: t('recommendationTitle'),
                message: t('recommendationUpgrade')
                    .replace('{ton}', (suggestion/1000).toFixed(1))
                    .replace('{type}', unitName)
                    .replace('{cap}', Math.floor((suggestion * (ratedLC + cDim)) / (actualLC + cDim)).toString())
            });
        } else {
            setRecommendation({
                title: t('recommendationTitle'),
                message: t('recommendationFail')
            });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card className="rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-slate-100 border-b pb-2 border-slate-100 dark:border-slate-700">
                        <TruckIcon className="h-5 w-5" /> {t('parameters')}
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>{t('machineType')}</Label>
                            <Select value={machineType} onValueChange={(v: any) => setMachineType(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="forklift">{t('optForklift')}</SelectItem>
                                    <SelectItem value="ic_forklift">{t('optICForklift')}</SelectItem>
                                    <SelectItem value="stacker">{t('optStacker')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('wheelbase')}</Label>
                            <Select value={wheelbase} onValueChange={(v: any) => setWheelbase(v)} disabled={machineType === 'stacker'}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard">{t('optStdWheelbase')}</SelectItem>
                                    <SelectItem value="short">{t('optShortWheelbase')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('machineCapacity')}</Label>
                            <Select value={tonnage.toString()} onValueChange={(v) => setTonnage(parseInt(v))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {(machineType === 'stacker' ? stackerOptions : forkliftOptions).map(opt => (
                                        <SelectItem key={opt} value={opt.toString()}>{(opt/1000).toFixed(1)} Ton</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('weightOfGoods')}</Label>
                            <Input type="number" value={loadWeight || ''} onChange={(e) => setLoadWeight(Number(e.target.value))} placeholder="e.g. 2500" />
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('dimensions')}</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <Input type="number" value={dimL || ''} onChange={(e) => setDimL(Number(e.target.value))} placeholder={t('length')} />
                                    <span className="text-xs text-slate-500">{t('length')}</span>
                                </div>
                                <div className="space-y-1">
                                    <Input type="number" value={dimW || ''} onChange={(e) => setDimW(Number(e.target.value))} placeholder={t('width')} />
                                    <span className="text-xs text-slate-500">{t('width')}</span>
                                </div>
                                <div className="space-y-1">
                                    <Input type="number" value={dimH || ''} onChange={(e) => setDimH(Number(e.target.value))} placeholder={t('height')} />
                                    <span className="text-xs text-slate-500">{t('height')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('forkLength')}</Label>
                            <Select value={forkLength.toString()} onValueChange={(v) => setForkLength(parseInt(v))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="920">920 mm (3 ft)</SelectItem>
                                    <SelectItem value="1070">1070 mm (3.5 ft - Std)</SelectItem>
                                    <SelectItem value="1220">1220 mm (4 ft)</SelectItem>
                                    <SelectItem value="1520">1520 mm (5 ft)</SelectItem>
                                    <SelectItem value="1820">1820 mm (6 ft)</SelectItem>
                                    <SelectItem value="2400">2400 mm (8 ft)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={calculate} className="w-full mt-4" size="default">
                            {t('analyzeLoad')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results Section */}
            <Card className={`rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-opacity duration-300 ${calculated ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-slate-100 border-b pb-2 border-slate-100 dark:border-slate-700">
                        <CalculatorIcon className="h-5 w-5" /> {t('analysisResult')}
                    </h2>

                    <div className={`p-4 rounded-lg text-center mb-6 border-2 ${!calculated ? 'border-slate-300 bg-slate-50' : isSafe ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                         {!calculated ? (
                             <span className="text-xl font-bold text-slate-500">{t('statusWaiting')}</span>
                         ) : isSafe ? (
                            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                                <CheckCircleIcon className="h-6 w-6" />
                                <span className="text-xl font-bold">{t('statusSafe')}</span>
                            </div>
                         ) : (
                            <div className="flex items-center justify-center gap-2 text-red-700 dark:text-red-400">
                                <AlertTriangleIcon className="h-6 w-6" />
                                <span className="text-xl font-bold">{t('statusOverload')}</span>
                            </div>
                         )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 uppercase flex items-center gap-1"><WeightIcon className="h-3 w-3"/> {t('inputLoadWeight')}</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{loadWeight} kg</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 uppercase flex items-center gap-1"><WeightIcon className="h-3 w-3"/> {t('maxSafeCapacity')}</p>
                            <p className={`text-lg font-bold ${isSafe ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{safeCap} kg</p>
                        </div>
                    </div>

                    <div className="mb-4 text-sm">
                        <div className="flex justify-between mb-1">
                            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><RulerIcon className="h-4 w-4"/> {t('loadCenterOffset')}</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{actualLC} mm</span>
                        </div>
                        <div className="text-xs text-slate-400 text-right">
                            ({t('standardForMachine')}: {ratedLC} mm)
                        </div>
                    </div>

                    {forkWarning && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-400 p-3 mb-4 text-sm rounded-r">
                            <p className="font-bold flex items-center gap-2"><AlertTriangleIcon className="h-4 w-4"/> {t('forkWarningTitle')}</p>
                            <p>{forkWarning}</p>
                        </div>
                    )}

                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">{t('heightTableTitle')}</h3>
                    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-3 py-2">{t('liftHeight')}</th>
                                    <th className="px-3 py-2">{t('estCapacity')}</th>
                                    <th className="px-3 py-2">{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                                {heightData.map((row, idx) => (
                                    <tr key={idx} className={row.safe ? '' : 'bg-red-50 dark:bg-red-900/10'}>
                                        <td className="px-3 py-2 text-slate-900 dark:text-slate-100 font-medium">{row.h} mm</td>
                                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.cap} kg</td>
                                        <td className={`px-3 py-2 font-bold ${row.safe ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {row.safe ? 'Pass' : 'Fail'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {recommendation && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2"><LightbulbIcon className="h-4 w-4"/> {recommendation.title}</h4>
                            <p className="text-blue-900 dark:text-blue-200">{recommendation.message}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}