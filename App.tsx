import React, { useEffect, useMemo, useState } from "react";

import { Card, CardContent } from "./components/ui/Card";
import { Button } from "./components/ui/Button";
import { Input } from "./components/ui/Input";
import { Label } from "./components/ui/Label";
import { Switch } from "./components/ui/Switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./components/ui/Select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/Tabs";
import { Separator } from "./components/ui/Separator";
import { InfoIcon, CalculatorIcon, RefreshCwIcon, LeafIcon, MoonIcon, SunIcon, FileDownIcon, Trash2Icon, MenuIcon, XIcon, DollarSignIcon, CheckIcon, SaveIcon, TruckIcon, WeightIcon, TrendingUpIcon } from "./components/icons";
import { useLanguage } from "./contexts/LanguageContext";
import { useTheme } from "./contexts/ThemeContext";
import LoadCalculator from "./components/LoadCalculator";
import GradeabilityCalculator from "./components/GradeabilityCalculator";

// --- Helper Components ---

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="md:col-span-3">
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-2">{title}</h3>
    </div>
  );
}

interface LabeledNumberProps {
  label: string;
  value: number;
  setValue: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

function LabeledNumber({ label, value, setValue, step = 1, min = -Infinity, max = Infinity }: LabeledNumberProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Input
        type="number"
        step={step}
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => {
          const num = e.target.value === '' ? 0 : Number(e.target.value);
          setValue(num);
        }}
        className="rounded-lg"
      />
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Card className="rounded-xl border border-slate-200 dark:border-slate-700">
      <CardContent className="p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">{title}</h3>
        <div className="space-y-1.5 text-sm">{children}</div>
      </CardContent>
    </Card>
  );
}

function KV({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`${bold ? "font-semibold text-slate-900 dark:text-slate-50" : "text-slate-700 dark:text-slate-300"}`}>{value}</span>
    </div>
  );
}

function InfoBlock({ label, value, suffix = "" }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 shadow-sm">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{value}{suffix}</div>
    </div>
  );
}

// --- Main App Component ---

interface Preset {
  name: string;
  common: {
    capacity_ton: number;
    hours_per_day: number;
    days_per_month: number;
    utilization_pct: number;
    diesel_capex: number;
    electric_capex: number;
  };
  diesel: {
    fuel_L_per_hour: number;
    diesel_price_rm_per_L: number;
    maint_rm_per_hour: number;
  };
  electric: {
    kWh_per_hour: number;
    tariff_rm_per_kWh: number;
    maint_rm_per_hour: number;
  };
}

const DIESEL_EMISSIONS = { CO2_kg_per_L: 2.68, NOx_g_per_L: 30.0, SOx_g_per_L: 0.02, PM_g_per_L: 2.5 };

type Scenario = { name: string } & Record<string, any>;

const CURRENCIES: Record<string, { symbol: string, label: string }> = {
    MYR: { symbol: 'RM', label: 'MYR' },
    USD: { symbol: '$', label: 'USD' },
    AUD: { symbol: 'A$', label: 'AUD' },
    CNY: { symbol: '¥', label: 'CNY' },
};

const REGIONAL_PRICES = [
    { region: 'Malaysia', currency: 'MYR', diesel: '3.02', electric: '0.55' },
    { region: 'United States', currency: 'USD', diesel: '1.11', electric: '0.15' },
    { region: 'Australia', currency: 'AUD', diesel: '2.00', electric: '0.30' },
    { region: 'China', currency: 'CNY', diesel: '7.60', electric: '0.65' },
];

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  
  const [scenarios, setScenarios] = useState<Record<string, Scenario>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currency, setCurrency] = useState('MYR');
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'tco' | 'load' | 'grade'>('tco');

  const currencySymbol = CURRENCIES[currency].symbol;

  const PRESETS: Record<string, Preset> = {
    "1t-warehouse": {
      name: "preset_1t_warehouse",
      common: { capacity_ton: 1, hours_per_day: 8, days_per_month: 26, utilization_pct: 70, diesel_capex: 50000, electric_capex: 75000 },
      diesel: { fuel_L_per_hour: 1.8, diesel_price_rm_per_L: 3.02, maint_rm_per_hour: 6 },
      electric: { kWh_per_hour: 4, tariff_rm_per_kWh: 0.55, maint_rm_per_hour: 3 }
    },
    "2t-warehouse": {
      name: "preset_2t_warehouse",
      common: { capacity_ton: 2, hours_per_day: 8, days_per_month: 26, utilization_pct: 70, diesel_capex: 70000, electric_capex: 105000 },
      diesel: { fuel_L_per_hour: 2.5, diesel_price_rm_per_L: 3.02, maint_rm_per_hour: 9 },
      electric: { kWh_per_hour: 6.5, tariff_rm_per_kWh: 0.55, maint_rm_per_hour: 4.5 }
    },
    "3t-warehouse": {
      name: "preset_3t_warehouse",
      common: { capacity_ton: 3, hours_per_day: 8, days_per_month: 26, utilization_pct: 70, diesel_capex: 90000, electric_capex: 130000 },
      diesel: { fuel_L_per_hour: 3.2, diesel_price_rm_per_L: 3.02, maint_rm_per_hour: 12 },
      electric: { kWh_per_hour: 9, tariff_rm_per_kWh: 0.55, maint_rm_per_hour: 6 }
    },
     "4t-yard": {
      name: "preset_4t_yard",
      common: { capacity_ton: 4, hours_per_day: 9, days_per_month: 26, utilization_pct: 75, diesel_capex: 120000, electric_capex: 175000 },
      diesel: { fuel_L_per_hour: 4.2, diesel_price_rm_per_L: 3.02, maint_rm_per_hour: 16 },
      electric: { kWh_per_hour: 12, tariff_rm_per_kWh: 0.60, maint_rm_per_hour: 8 }
    },
    "5t-yard": {
      name: "preset_5t_yard",
      common: { capacity_ton: 5, hours_per_day: 10, days_per_month: 26, utilization_pct: 75, diesel_capex: 150000, electric_capex: 220000 },
      diesel: { fuel_L_per_hour: 5.3, diesel_price_rm_per_L: 3.02, maint_rm_per_hour: 20 },
      electric: { kWh_per_hour: 15, tariff_rm_per_kWh: 0.60, maint_rm_per_hour: 10 }
    },
    "6t-yard": {
      name: "preset_6t_yard",
      common: { capacity_ton: 6, hours_per_day: 10, days_per_month: 26, utilization_pct: 80, diesel_capex: 180000, electric_capex: 270000 },
      diesel: { fuel_L_per_hour: 6.5, diesel_price_rm_per_L: 3.02, maint_rm_per_hour: 25 },
      electric: { kWh_per_hour: 18, tariff_rm_per_kWh: 0.60, maint_rm_per_hour: 13 }
    },
    "7t-yard": {
      name: "preset_7t_yard",
      common: { capacity_ton: 7, hours_per_day: 10, days_per_month: 26, utilization_pct: 80, diesel_capex: 210000, electric_capex: 320000 },
      diesel: { fuel_L_per_hour: 7.5, diesel_price_rm_per_L: 3.02, maint_rm_per_hour: 30 },
      electric: { kWh_per_hour: 21, tariff_rm_per_kWh: 0.60, maint_rm_per_hour: 16 }
    },
    "8t-yard": {
      name: "preset_8t_yard",
      common: { capacity_ton: 8, hours_per_day: 12, days_per_month: 26, utilization_pct: 85, diesel_capex: 250000, electric_capex: 380000 },
      diesel: { fuel_L_per_hour: 9, diesel_price_rm_per_L: 3.02, maint_rm_per_hour: 35 },
      electric: { kWh_per_hour: 25, tariff_rm_per_kWh: 0.60, maint_rm_per_hour: 19 }
    },
    "10t-yard": {
      name: "preset_10t_yard",
      common: { capacity_ton: 10, hours_per_day: 12, days_per_month: 26, utilization_pct: 85, diesel_capex: 320000, electric_capex: 450000 },
      diesel: { fuel_L_per_hour: 11, diesel_price_rm_per_L: 3.02, maint_rm_per_hour: 45 },
      electric: { kWh_per_hour: 30, tariff_rm_per_kWh: 0.60, maint_rm_per_hour: 25 }
    }
  };

  const initialPresetKey = "3t-warehouse";
  const p = PRESETS[initialPresetKey];

  // --- State Variables ---
  const [presetKey, setPresetKey] = useState<string>(initialPresetKey);
  // Common
  const [numberOfForklifts, setNumberOfForklifts] = useState<number>(1);
  const [capacityTon, setCapacityTon] = useState<number>(p.common.capacity_ton);
  const [hoursPerDay, setHoursPerDay] = useState<number>(p.common.hours_per_day);
  const [daysPerMonth, setDaysPerMonth] = useState<number>(p.common.days_per_month);
  const [utilizationPct, setUtilizationPct] = useState<number>(p.common.utilization_pct);
  // Diesel
  const [dieselCapex, setDieselCapex] = useState<number>(p.common.diesel_capex);
  const [dieselLPerHour, setDieselLPerHour] = useState<number>(p.diesel.fuel_L_per_hour);
  const [dieselPrice, setDieselPrice] = useState<number>(p.diesel.diesel_price_rm_per_L);
  const [dieselMaintRmPerHour, setDieselMaintRmPerHour] = useState<number>(p.diesel.maint_rm_per_hour);
  // Electric
  const [electricCapex, setElectricCapex] = useState<number>(p.common.electric_capex);
  const [elecKWhPerHour, setElecKWhPerHour] = useState<number>(p.electric.kWh_per_hour);
  const [tariffRmPerKWh, setTariffRmPerKWh] = useState<number>(p.electric.tariff_rm_per_kWh);
  const [elecMaintRmPerHour, setElecMaintRmPerHour] = useState<number>(p.electric.maint_rm_per_hour);
  const [batteryVolt, setBatteryVolt] = useState<number>(48);
  const [batteryAh, setBatteryAh] = useState<number>(500);
  const [usableDoDPct, setUsableDoDPct] = useState<number>(80);
  const [cyclesTo80, setCyclesTo80] = useState<number>(3000);
  const [batteryReplacementCost, setBatteryReplacementCost] = useState<number>(25000);
  const [gridCO2Intensity, setGridCO2Intensity] = useState<number>(0.6);
  // Financial
  const [downpaymentPct, setDownpaymentPct] = useState<number>(20);
  const [loanTenureMonths, setLoanTenureMonths] = useState<number>(60);
  const [annualInterestRatePct, setAnnualInterestRatePct] = useState<number>(5);
  const [annualInsuranceRM, setAnnualInsuranceRM] = useState<number>(1500);


  const stateGetters = { presetKey, numberOfForklifts, capacityTon, hoursPerDay, daysPerMonth, utilizationPct, dieselCapex, dieselLPerHour, dieselPrice, dieselMaintRmPerHour, electricCapex, elecKWhPerHour, tariffRmPerKWh, elecMaintRmPerHour, batteryVolt, batteryAh, usableDoDPct, cyclesTo80, batteryReplacementCost, gridCO2Intensity, downpaymentPct, loanTenureMonths, annualInterestRatePct, annualInsuranceRM };
  const stateSetters = { setPresetKey, setNumberOfForklifts, setCapacityTon, setHoursPerDay, setDaysPerMonth, setUtilizationPct, setDieselCapex, setDieselLPerHour, setDieselPrice, setDieselMaintRmPerHour, setElectricCapex, setElecKWhPerHour, setTariffRmPerKWh, setElecMaintRmPerHour, setBatteryVolt, setBatteryAh, setUsableDoDPct, setCyclesTo80, setBatteryReplacementCost, setGridCO2Intensity, setDownpaymentPct, setLoanTenureMonths, setAnnualInterestRatePct, setAnnualInsuranceRM };
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('forklift_scenarios');
      if (saved) setScenarios(JSON.parse(saved));
    } catch (e) { console.error("Failed to load scenarios:", e); }
  }, []);

  const saveCurrentScenario = () => {
    const name = prompt(t('enterScenarioName'));
    if (name && name.trim() !== '') {
      const newScenarios = { ...scenarios, [name]: { ...stateGetters, name } };
      setScenarios(newScenarios);
      localStorage.setItem('forklift_scenarios', JSON.stringify(newScenarios));
    }
  };

  const loadScenario = (name: string) => {
    const scenario = scenarios[name];
    if (scenario) {
      for (const key in scenario) {
        if (stateSetters[`set${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof stateSetters]) {
          const setter = stateSetters[`set${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof stateSetters] as (val: any) => void;
          setter(scenario[key]);
        }
      }
      setIsSidebarOpen(false);
      // Ensure we switch back to TCO view when loading a TCO scenario
      setCurrentView('tco');
    }
  };

  const deleteScenario = (name: string) => {
    if (confirm(`${t('confirmDeleteScenario')} "${name}"?`)) {
      const newScenarios = { ...scenarios };
      delete newScenarios[name];
      setScenarios(newScenarios);
      localStorage.setItem('forklift_scenarios', JSON.stringify(newScenarios));
    }
  };

  const applyPreset = (key: string) => {
    const p = PRESETS[key];
    if (!p) return;
    setPresetKey(key);
    setCapacityTon(p.common.capacity_ton);
    setHoursPerDay(p.common.hours_per_day);
    setDaysPerMonth(p.common.days_per_month);
    setUtilizationPct(p.common.utilization_pct);
    setDieselCapex(p.common.diesel_capex);
    setElectricCapex(p.common.electric_capex);
    setDieselLPerHour(p.diesel.fuel_L_per_hour);
    setDieselPrice(p.diesel.diesel_price_rm_per_L);
    setDieselMaintRmPerHour(p.diesel.maint_rm_per_hour);
    setElecKWhPerHour(p.electric.kWh_per_hour);
    setTariffRmPerKWh(p.electric.tariff_rm_per_kWh);
    setElecMaintRmPerHour(p.electric.maint_rm_per_hour);
  };
  
  const resetAll = () => applyPreset(presetKey);

  const results = useMemo(() => {
    const fmtCurrency = (n: number) => n.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', { style: "currency", currency: currency, maximumFractionDigits: 2 });
    const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
    
    const utilization = clamp(utilizationPct, 0, 100) / 100;
    const activeHoursMonth = hoursPerDay * daysPerMonth * utilization;
    const diesel_L_month_unit = dieselLPerHour * activeHoursMonth;
    const diesel_energy_cost_month_unit = diesel_L_month_unit * dieselPrice;
    const diesel_maint_cost_month_unit = dieselMaintRmPerHour * activeHoursMonth;
    const diesel_total_month_unit = diesel_energy_cost_month_unit + diesel_maint_cost_month_unit;
    const kWh_month_unit = elecKWhPerHour * activeHoursMonth;
    const elec_energy_cost_month_unit = kWh_month_unit * tariffRmPerKWh;
    const elec_maint_cost_month_unit = elecMaintRmPerHour * activeHoursMonth;
    const pack_kWh = Math.max(0.1, (batteryVolt * batteryAh) / 1000);
    const usable_kWh = Math.max(0.1, pack_kWh * clamp(usableDoDPct, 1, 100) / 100);
    const cycles_per_month = usable_kWh > 0 ? (kWh_month_unit / usable_kWh) : 0;
    const months_to_80 = cycles_per_month > 0 ? (Math.max(1, cyclesTo80) / cycles_per_month) : Infinity;
    const amortized_battery_cost_month_unit = isFinite(months_to_80) && months_to_80 > 0 ? (batteryReplacementCost / months_to_80) : 0;
    const elec_total_month_unit = elec_energy_cost_month_unit + elec_maint_cost_month_unit + amortized_battery_cost_month_unit;
    const TCO_PERIOD_MONTHS = 120;
    const num_replacements_10_years = (isFinite(months_to_80) && months_to_80 > 0) ? Math.floor(TCO_PERIOD_MONTHS / months_to_80) : 0;
    const monthly_savings_unit = diesel_total_month_unit - elec_total_month_unit;
    
    const capex_diff_unit = electricCapex - dieselCapex;
    const payback_period_months = (monthly_savings_unit > 0 && capex_diff_unit > 0) ? capex_diff_unit / monthly_savings_unit : 0;

    const fleetSize = Math.max(1, Math.floor(numberOfForklifts));
    
    // ESG Calculations
    const diesel_co2_kg_month = diesel_L_month_unit * DIESEL_EMISSIONS.CO2_kg_per_L * fleetSize;
    const diesel_nox_g_month = diesel_L_month_unit * DIESEL_EMISSIONS.NOx_g_per_L * fleetSize;
    const diesel_sox_g_month = diesel_L_month_unit * DIESEL_EMISSIONS.SOx_g_per_L * fleetSize;
    const diesel_pm_g_month = diesel_L_month_unit * DIESEL_EMISSIONS.PM_g_per_L * fleetSize;
    const electric_co2_kg_month = kWh_month_unit * gridCO2Intensity * fleetSize;
    const co2_reduction_kg_month = diesel_co2_kg_month - electric_co2_kg_month;
    
    // Financial Calculations
    const calculateMonthlyInstallment = (principal: number, annualRate: number, tenureMonths: number): number => {
        if (principal <= 0 || tenureMonths <= 0) return 0;
        const monthlyRate = (annualRate / 100) / 12;
        if (monthlyRate === 0) return principal / tenureMonths;
        const n = tenureMonths;
        const r = monthlyRate;
        const installment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        return installment;
    };
    
    const loanPrincipalDiesel = dieselCapex * (1 - clamp(downpaymentPct, 0, 100) / 100);
    const loanPrincipalElectric = electricCapex * (1 - clamp(downpaymentPct, 0, 100) / 100);

    const monthlyInstallmentDiesel = calculateMonthlyInstallment(loanPrincipalDiesel, annualInterestRatePct, loanTenureMonths) * fleetSize;
    const monthlyInstallmentElectric = calculateMonthlyInstallment(loanPrincipalElectric, annualInterestRatePct, loanTenureMonths) * fleetSize;

    const monthlyInsurance = (annualInsuranceRM / 12) * fleetSize;

    const totalMonthlyFinancialDiesel = monthlyInstallmentDiesel + monthlyInsurance;
    const totalMonthlyFinancialElectric = monthlyInstallmentElectric + monthlyInsurance;

    return {
      fmtCurrency,
      activeHoursMonth,
      diesel: {
        total_month: diesel_total_month_unit * fleetSize,
        total_year: diesel_total_month_unit * fleetSize * 12,
        tco_10_year: (diesel_total_month_unit * TCO_PERIOD_MONTHS + dieselCapex) * fleetSize,
        diesel_L_month: diesel_L_month_unit * fleetSize,
        energy_cost_month: diesel_energy_cost_month_unit * fleetSize,
        maint_cost_month: diesel_maint_cost_month_unit * fleetSize,
      },
      electric: {
        total_month: elec_total_month_unit * fleetSize,
        total_year: elec_total_month_unit * fleetSize * 12,
        tco_10_year: (elec_total_month_unit * TCO_PERIOD_MONTHS + electricCapex + (num_replacements_10_years * batteryReplacementCost)) * fleetSize,
        kWh_month: kWh_month_unit * fleetSize,
        energy_cost_month: elec_energy_cost_month_unit * fleetSize,
        maint_cost_month: elec_maint_cost_month_unit * fleetSize,
        cycles_per_month,
        months_to_80,
        amortized_battery_cost_month: amortized_battery_cost_month_unit * fleetSize,
        num_replacements_10_years,
      },
      savings: {
        monthly_savings: monthly_savings_unit * fleetSize,
        yearly_savings: monthly_savings_unit * fleetSize * 12,
        payback_period_months,
      },
      esg: {
        diesel_co2_kg_month,
        diesel_nox_g_month,
        diesel_sox_g_month,
        diesel_pm_g_month,
        electric_co2_kg_month,
        co2_reduction_kg_month,
      },
      financial: {
        diesel: {
            monthlyInstallment: monthlyInstallmentDiesel,
            monthlyInsurance: monthlyInsurance,
            totalMonthly: totalMonthlyFinancialDiesel,
        },
        electric: {
            monthlyInstallment: monthlyInstallmentElectric,
            monthlyInsurance: monthlyInsurance,
            totalMonthly: totalMonthlyFinancialElectric,
        }
      }
    };
  }, [Object.values(stateGetters), currency, language]);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-800 shadow-lg transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}>
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('savedScenarios')}</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}><XIcon className="h-5 w-5"/></Button>
                </div>
                <Button onClick={saveCurrentScenario} className="w-full mb-4 gap-2"><SaveIcon className="h-4 w-4"/> {t('saveScenario')}</Button>
                <div className="space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
                    {Object.keys(scenarios).length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('noSavedScenarios')}</p>
                    ) : Object.values(scenarios).filter(s => s && (s as Scenario).name).map((s: Scenario) => (
                        <div key={s.name} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                            <p className="font-medium text-slate-800 dark:text-slate-200">{s.name}</p>
                            <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="secondary" onClick={() => loadScenario(s.name)} className="flex-1">{t('load')}</Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteScenario(s.name)}><Trash2Icon className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
        <main className="flex-1 transition-all duration-300 ease-in-out">
          <div className="mx-auto max-w-6xl p-4 md:p-8">
            <header className="mb-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="lg:hidden"><MenuIcon className="h-6 w-6"/></Button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-medium tracking-tight text-slate-900 dark:text-slate-100">{t('title')}</h1>
                        {/* View Switcher Mobile/Tablet */}
                         <div className="flex gap-4 mt-1 md:hidden text-xs">
                             <button onClick={() => setCurrentView('tco')} className={`${currentView === 'tco' ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500'}`}>{t('tcoCalc')}</button>
                             <button onClick={() => setCurrentView('load')} className={`${currentView === 'load' ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500'}`}>{t('loadCalc')}</button>
                             <button onClick={() => setCurrentView('grade')} className={`${currentView === 'grade' ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500'}`}>{t('gradeCalc')}</button>
                         </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                    {/* View Switcher Desktop */}
                    <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mr-4">
                         <button onClick={() => setCurrentView('tco')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${currentView === 'tco' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                            <CalculatorIcon className="h-4 w-4"/>
                            {t('tcoCalc')}
                         </button>
                         <button onClick={() => setCurrentView('load')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${currentView === 'load' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                             <WeightIcon className="h-4 w-4"/>
                            {t('loadCalc')}
                         </button>
                         <button onClick={() => setCurrentView('grade')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${currentView === 'grade' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                             <TrendingUpIcon className="h-4 w-4"/>
                            {t('gradeCalc')}
                         </button>
                    </div>

                    {/* Currency Selector */}
                    {currentView === 'tco' && (
                        <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="w-[85px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(CURRENCIES).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    )}

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
              
              {currentView === 'tco' && (
                  <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
                    <Select value={presetKey} onValueChange={(v) => applyPreset(v)}>
                    <SelectTrigger className="w-full md:w-[260px]">
                        <SelectValue placeholder={t('choosePreset')} />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(PRESETS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                            {t(v.name)}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <div className="flex-1 flex gap-2">
                        <Button variant="secondary" onClick={resetAll} className="gap-2 w-full md:w-auto"><RefreshCwIcon className="h-4 w-4"/>{t('reset')}</Button>
                        <Button onClick={() => window.print()} className="gap-2 w-full md:w-auto"><FileDownIcon className="h-4 w-4"/>{t('downloadReport')}</Button>
                    </div>
                  </div>
              )}
            </header>
            
            {/* TCO Calculator View */}
            {currentView === 'tco' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6">
                    <Card className="rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 no-print">
                    <CardContent className="p-6">
                        <Tabs defaultValue="basic">
                        <TabsList className="mb-4">
                            <TabsTrigger value="basic">{t('basic')}</TabsTrigger>
                            <TabsTrigger value="reference">{t('reference')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="basic">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SectionTitle title={t('common')} />
                            <LabeledNumber label={t('numForklifts')} value={numberOfForklifts} setValue={setNumberOfForklifts} step={1} min={1} />
                            <LabeledNumber label={`${t('capacity')} (t)`} value={capacityTon} setValue={setCapacityTon} step={0.1} min={1} max={20} />
                            <LabeledNumber label={t('hoursPerDay')} value={hoursPerDay} setValue={setHoursPerDay} step={0.5} min={0} max={24} />
                            <LabeledNumber label={t('daysPerMonth')} value={daysPerMonth} setValue={setDaysPerMonth} step={1} min={0} max={31} />
                            <LabeledNumber label={`${t('utilization')} (%)`} value={utilizationPct} setValue={setUtilizationPct} step={1} min={0} max={100} />
                            
                            <SectionTitle title={t('diesel')} />
                            <LabeledNumber label={`${t('dieselCapex')} (${currencySymbol})`} value={dieselCapex} setValue={setDieselCapex} step={1000} min={0} />
                            <LabeledNumber label={`${t('fuelUse')} (L/hr)`} value={dieselLPerHour} setValue={setDieselLPerHour} step={0.1} min={0} />
                            <LabeledNumber label={`${t('dieselPrice')} (${currencySymbol}/L)`} value={dieselPrice} setValue={setDieselPrice} step={0.01} min={0} />

                            <SectionTitle title={t('batteryElectric')} />
                            <LabeledNumber label={`${t('electricCapex')} (${currencySymbol})`} value={electricCapex} setValue={setElectricCapex} step={1000} min={0} />
                            <LabeledNumber label={`${t('energyUse')} (kWh/hr)`} value={elecKWhPerHour} setValue={setElecKWhPerHour} step={0.1} min={0} />
                            <LabeledNumber label={`${t('tariff')} (${currencySymbol}/kWh)`} value={tariffRmPerKWh} setValue={setTariffRmPerKWh} step={0.01} min={0} />
                            </div>
                        </TabsContent>
                        <TabsContent value="reference">
                            <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 max-h-[600px] overflow-y-auto pr-2">
                                <h4 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{t('ref_title')}</h4>
                                
                                <div className="space-y-1">
                                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">{t('ref_tco_q')}</h5>
                                    <p>{t('ref_tco_a')}</p>
                                </div>

                                <div className="space-y-1">
                                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">{t('ref_capex_q')}</h5>
                                    <p>{t('ref_capex_a')}</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>{t('diesel')}:</strong> {t('ref_capex_diesel')}</li>
                                        <li><strong>{t('batteryElectric')}:</strong> {t('ref_capex_electric')}</li>
                                    </ul>
                                </div>
                                
                                <div className="space-y-1">
                                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">{t('ref_opex_q')}</h5>
                                    <p>{t('ref_opex_a')}</p>
                                    <div className="pl-4 space-y-2 mt-2">
                                        <p className="font-medium">{t('ref_opex_fuel_title')}</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li><strong>{t('diesel')}:</strong> {t('ref_opex_fuel_diesel')}</li>
                                            <li><strong>{t('batteryElectric')}:</strong> {t('ref_opex_fuel_electric')}</li>
                                        </ul>
                                        <p className="font-medium">{t('ref_opex_maint_title')}</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li><strong>{t('diesel')}:</strong> {t('ref_opex_maint_diesel')}</li>
                                            <li><strong>{t('batteryElectric')}:</strong> {t('ref_opex_maint_electric')}</li>
                                        </ul>
                                        <p className="font-medium">{t('ref_opex_battery_title')}</p>
                                        <p className="pl-5">{t('ref_opex_battery_a')}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">{t('ref_esg_q')}</h5>
                                    <p>{t('ref_esg_a')}</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>{t('diesel')}:</strong> {t('ref_esg_diesel')}</li>
                                        <li><strong>{t('batteryElectric')}:</strong> {t('ref_esg_electric')}</li>
                                    </ul>
                                </div>

                                <div className="space-y-1">
                                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">{t('ref_financial_q')}</h5>
                                    <p>{t('ref_financial_a')}</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>{t('monthlyLoanInstallment')}:</strong> {t('ref_financial_loan')}</li>
                                        <li><strong>{t('monthlyInsurance')}:</strong> {t('ref_financial_insurance')}</li>
                                        <li><strong>{t('totalMonthlyFinancial')}:</strong> {t('ref_financial_total')}</li>
                                    </ul>
                                </div>
                                
                                <Separator className="my-4" />
                                
                                <div className="space-y-6">
                                <h4 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{t('ref_consumption_title')}</h4>
                                
                                {/* Diesel Table */}
                                <div className="space-y-2">
                                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">{t('ref_diesel_table_title')}</h5>
                                    <div className="overflow-x-auto rounded-lg border dark:border-slate-700">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                                <tr className="border-b dark:border-slate-700">
                                                    <th className="p-2 font-medium">{t('ref_table_capacity')}</th>
                                                    <th className="p-2 font-medium">{t('ref_table_application')}</th>
                                                    <th className="p-2 font-medium">{t('ref_table_diesel_consumption')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                <tr>
                                                    <td rowSpan={3} className="p-2 align-top border-r dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">1.5 - 2.0</td>
                                                    <td className="p-2">{t('ref_app_light')}</td>
                                                    <td className="p-2">2.0 - 2.5</td>
                                                </tr>
                                                <tr><td className="p-2">{t('ref_app_medium')}</td><td className="p-2">2.5 - 3.0</td></tr>
                                                <tr><td className="p-2">{t('ref_app_heavy')}</td><td className="p-2">3.0 - 3.5</td></tr>
                                                
                                                <tr>
                                                    <td rowSpan={3} className="p-2 align-top border-r dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">2.5 - 3.5</td>
                                                    <td className="p-2">{t('ref_app_light')}</td>
                                                    <td className="p-2">2.8 - 3.5</td>
                                                </tr>
                                                <tr><td className="p-2">{t('ref_app_medium')}</td><td className="p-2">3.5 - 4.5</td></tr>
                                                <tr><td className="p-2">{t('ref_app_heavy')}</td><td className="p-2">4.5 - 5.5</td></tr>

                                                <tr>
                                                    <td rowSpan={3} className="p-2 align-top border-r dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">4.0 - 5.0</td>
                                                    <td className="p-2">{t('ref_app_light')}</td>
                                                    <td className="p-2">4.0 - 5.0</td>
                                                </tr>
                                                <tr><td className="p-2">{t('ref_app_medium')}</td><td className="p-2">5.0 - 6.0</td></tr>
                                                <tr><td className="p-2">{t('ref_app_heavy')}</td><td className="p-2">6.0 - 7.0</td></tr>

                                                <tr>
                                                    <td className="p-2 border-r dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">6.0 - 7.0</td>
                                                    <td className="p-2">{t('ref_app_medium_heavy')}</td>
                                                    <td className="p-2">7.0 - 9.0</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2 border-r dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">8.0 - 10.0</td>
                                                    <td className="p-2">{t('ref_app_heavy')}</td>
                                                    <td className="p-2">9.0 - 12.0</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                
                                {/* Electric Table */}
                                <div className="space-y-2">
                                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">{t('ref_electric_table_title')}</h5>
                                    <div className="overflow-x-auto rounded-lg border dark:border-slate-700">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                                <tr className="border-b dark:border-slate-700">
                                                    <th className="p-2 font-medium">{t('ref_table_capacity')}</th>
                                                    <th className="p-2 font-medium">{t('ref_table_application')}</th>
                                                    <th className="p-2 font-medium">{t('ref_table_electric_consumption')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                <tr>
                                                    <td rowSpan={3} className="p-2 align-top border-r dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">1.5 - 2.0</td>
                                                    <td className="p-2">{t('ref_app_light')}</td>
                                                    <td className="p-2">3.0 - 5.0</td>
                                                </tr>
                                                <tr><td className="p-2">{t('ref_app_medium')}</td><td className="p-2">5.0 - 7.0</td></tr>
                                                <tr><td className="p-2">{t('ref_app_heavy')}</td><td className="p-2">7.0 - 9.0</td></tr>
                                                
                                                <tr>
                                                    <td rowSpan={3} className="p-2 align-top border-r dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">2.5 - 3.5</td>
                                                    <td className="p-2">{t('ref_app_light')}</td>
                                                    <td className="p-2">6.0 - 8.0</td>
                                                </tr>
                                                <tr><td className="p-2">{t('ref_app_medium')}</td><td className="p-2">8.0 - 11.0</td></tr>
                                                <tr><td className="p-2">{t('ref_app_heavy')}</td><td className="p-2">11.0 - 14.0</td></tr>

                                                <tr>
                                                    <td rowSpan={3} className="p-2 align-top border-r dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">4.0 - 5.0</td>
                                                    <td className="p-2">{t('ref_app_light')}</td>
                                                    <td className="p-2">9.0 - 12.0</td>
                                                </tr>
                                                <tr><td className="p-2">{t('ref_app_medium')}</td><td className="p-2">12.0 - 15.0</td></tr>
                                                <tr><td className="p-2">{t('ref_app_heavy')}</td><td className="p-2">15.0 - 18.0</td></tr>

                                                <tr>
                                                    <td className="p-2 border-r dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">6.0 - 7.0</td>
                                                    <td className="p-2">{t('ref_app_medium_heavy')}</td>
                                                    <td className="p-2">18.0 - 22.0</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2 border-r dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">8.0 - 10.0</td>
                                                    <td className="p-2">{t('ref_app_heavy')}</td>
                                                    <td className="p-2">22.0 - 27.0</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Regional Price Guide Table */}
                                <div className="space-y-2">
                                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">{t('ref_regional_title')}</h5>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{t('ref_regional_subtitle')}</p>
                                    <div className="overflow-x-auto rounded-lg border dark:border-slate-700">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                                <tr className="border-b dark:border-slate-700">
                                                    <th className="p-2 font-medium">{t('ref_table_region')}</th>
                                                    <th className="p-2 font-medium">{t('ref_table_currency')}</th>
                                                    <th className="p-2 font-medium">{t('ref_table_diesel_price')}</th>
                                                    <th className="p-2 font-medium">{t('ref_table_elec_price')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                {REGIONAL_PRICES.map((item) => (
                                                    <tr key={item.region}>
                                                        <td className="p-2 font-medium">{item.region}</td>
                                                        <td className="p-2">{item.currency}</td>
                                                        <td className="p-2">{item.diesel}</td>
                                                        <td className="p-2">{item.electric}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                </div>

                            </div>
                        </TabsContent>
                        </Tabs>
                    </CardContent>
                    </Card>

                    <Card className="rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 no-print">
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100"><InfoIcon className="h-5 w-5"/> {t('advanced')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SectionTitle title={t('dieselAdvanced')} />
                        <LabeledNumber label={`${t('dieselMaint')} (${currencySymbol}/hr)`} value={dieselMaintRmPerHour} setValue={setDieselMaintRmPerHour} step={0.5} min={0} />
                        
                        <SectionTitle title={t('electricAdvanced')} />
                        <LabeledNumber label={`${t('electricMaint')} (${currencySymbol}/hr)`} value={elecMaintRmPerHour} setValue={setElecMaintRmPerHour} step={0.5} min={0} />
                        <LabeledNumber label={`${t('gridIntensity')} (kg/kWh)`} value={gridCO2Intensity} setValue={setGridCO2Intensity} step={0.01} min={0} />
                        <LabeledNumber label={`${t('batteryVolt')} (V)`} value={batteryVolt} setValue={setBatteryVolt} step={1} min={12} />
                        <LabeledNumber label={`${t('batteryAh')} (Ah)`} value={batteryAh} setValue={setBatteryAh} step={10} min={50} />
                        <LabeledNumber label={`${t('usableDod')} (%)`} value={usableDoDPct} setValue={setUsableDoDPct} step={1} min={10} max={100} />
                        <LabeledNumber label={t('cyclesTo80')} value={cyclesTo80} setValue={setCyclesTo80} step={100} min={100} />
                        <LabeledNumber label={`${t('batteryCost')} (${currencySymbol})`} value={batteryReplacementCost} setValue={setBatteryReplacementCost} step={1000} min={0} />

                        <SectionTitle title={t('financialCalculations')} />
                        <LabeledNumber label={`${t('downpaymentPct')} (%)`} value={downpaymentPct} setValue={setDownpaymentPct} step={1} min={0} max={100} />
                        <LabeledNumber label={`${t('loanTenureMonths')} (${t('months')})`} value={loanTenureMonths} setValue={setLoanTenureMonths} step={1} min={1} />
                        <LabeledNumber label={`${t('annualInterestRatePct')} (%)`} value={annualInterestRatePct} setValue={setAnnualInterestRatePct} step={0.1} min={0} />
                        <LabeledNumber label={`${t('annualInsuranceRM')} (${currencySymbol}/yr)`} value={annualInsuranceRM} setValue={setAnnualInsuranceRM} step={100} min={0} />
                        </div>
                    </CardContent>
                    </Card>
                </div>

                <div id="print-area" className="space-y-6">
                    <Card className="rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100"><CalculatorIcon className="h-5 w-5"/> {t('fleetResults')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <SummaryCard title={t('diesel')}>
                            <KV label={t('tcoMonth')} value={results.fmtCurrency(results.diesel.total_month)} />
                            <KV label={t('tcoYear')} value={results.fmtCurrency(results.diesel.total_year)} />
                            <Separator className="my-2" />
                            <KV label={t('fuelUsedMonth')} value={`${results.diesel.diesel_L_month.toFixed(0)} L`} />
                            <KV label={t('fuelCostMonth')} value={results.fmtCurrency(results.diesel.energy_cost_month)} />
                            <KV label={t('maintCostMonth')} value={results.fmtCurrency(results.diesel.maint_cost_month)} />
                            <Separator className="my-2" />
                            <KV bold label={t('tco10Year')} value={results.fmtCurrency(results.diesel.tco_10_year)} />
                        </SummaryCard>
                        <SummaryCard title={t('batteryElectric')}>
                            <KV label={t('tcoMonth')} value={results.fmtCurrency(results.electric.total_month)} />
                            <KV label={t('tcoYear')} value={results.fmtCurrency(results.electric.total_year)} />
                            <Separator className="my-2" />
                            <KV label={t('energyUsedMonth')} value={`${results.electric.kWh_month.toFixed(0)} kWh`} />
                            <KV label={t('energyCostMonth')} value={results.fmtCurrency(results.electric.energy_cost_month)} />
                            <KV label={t('maintCostMonth')} value={results.fmtCurrency(results.electric.maint_cost_month)} />
                            <KV label={t('batteryAmortMonth')} value={results.fmtCurrency(results.electric.amortized_battery_cost_month)} />
                            <Separator className="my-2" />
                            <KV label={t('cyclesPerMonth')} value={results.electric.cycles_per_month.toFixed(1)} />
                            <KV label={t('estBatteryLife')} value={isFinite(results.electric.months_to_80) ? `${results.electric.months_to_80.toFixed(1)} ${t('months')}` : 'N/A'} />
                            <KV label={t('estReplacements10Yr')} value={results.electric.num_replacements_10_years.toFixed(0)} />
                            <Separator className="my-2" />
                            <KV bold label={t('tco10Year')} value={results.fmtCurrency(results.electric.tco_10_year)} />
                        </SummaryCard>
                        </div>
                        <Card className="mt-4 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                        <CardContent className="p-4 md:p-6">
                            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">{t('fleetSavingsTitle')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InfoBlock label={t('monthlySavings')} value={results.fmtCurrency(results.savings.monthly_savings)} />
                            <InfoBlock label={t('yearlySavings')} value={results.fmtCurrency(results.savings.yearly_savings)} />
                            <InfoBlock label={t('paybackPeriod')} value={results.savings.payback_period_months > 0 ? `${results.savings.payback_period_months.toFixed(1)} ${t('months')}` : 'N/A'} />
                            </div>
                        </CardContent>
                        </Card>
                    </CardContent>
                    </Card>

                    <Card className="rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100"><LeafIcon className="h-5 w-5"/> {t('esgTitle')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <SummaryCard title={`${t('diesel')} — ${t('emissionsMonth')}`}>
                            <KV label={t('co2_kg')} value={results.esg.diesel_co2_kg_month.toFixed(1)} />
                            <KV label={t('nox_g')} value={results.esg.diesel_nox_g_month.toFixed(1)} />
                            <KV label={t('sox_g')} value={results.esg.diesel_sox_g_month.toFixed(1)} />
                            <KV label={t('pm_g')} value={results.esg.diesel_pm_g_month.toFixed(1)} />
                        </SummaryCard>
                        <SummaryCard title={`${t('batteryElectric')} — ${t('emissionsMonth')}`}>
                            <KV label={t('co2_kg')} value={results.esg.electric_co2_kg_month.toFixed(1)} />
                            <KV label={t('nox_g')} value="0.0" />
                            <KV label={t('sox_g')} value="0.0" />
                            <KV label={t('pm_g')} value="0.0" />
                        </SummaryCard>
                        </div>
                        <Card className="mt-4 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                        <CardContent className="p-4 md:p-6">
                            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">{t('envSavingsTitle')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoBlock label={t('co2Reduction')} value={`${results.esg.co2_reduction_kg_month.toFixed(1)} kg`} />
                            <InfoBlock label={t('otherPollutants')} value={`${(results.esg.diesel_nox_g_month + results.esg.diesel_sox_g_month + results.esg.diesel_pm_g_month).toFixed(1)} g`} />
                            </div>
                        </CardContent>
                        </Card>
                    </CardContent>
                    </Card>

                    <Card className="rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100"><DollarSignIcon className="h-5 w-5"/> {t('financialResults')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <SummaryCard title={t('diesel')}>
                            <KV label={t('monthlyLoanInstallment')} value={results.fmtCurrency(results.financial.diesel.monthlyInstallment)} />
                            <KV label={t('monthlyInsurance')} value={results.fmtCurrency(results.financial.diesel.monthlyInsurance)} />
                            <Separator className="my-2" />
                            <KV bold label={t('totalMonthlyFinancial')} value={results.fmtCurrency(results.financial.diesel.totalMonthly)} />
                        </SummaryCard>
                        <SummaryCard title={t('batteryElectric')}>
                            <KV label={t('monthlyLoanInstallment')} value={results.fmtCurrency(results.financial.electric.monthlyInstallment)} />
                            <KV label={t('monthlyInsurance')} value={results.fmtCurrency(results.financial.electric.monthlyInsurance)} />
                            <Separator className="my-2" />
                            <KV bold label={t('totalMonthlyFinancial')} value={results.fmtCurrency(results.financial.electric.totalMonthly)} />
                        </SummaryCard>
                        </div>
                    </CardContent>
                    </Card>

                </div>
                </div>
            )}

            {/* Load Calculator View */}
            {currentView === 'load' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <LoadCalculator />
                </div>
            )}

            {/* Gradeability Calculator View */}
            {currentView === 'grade' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GradeabilityCalculator />
                </div>
            )}

            <footer className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
              <p>Version 1.5.0</p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}