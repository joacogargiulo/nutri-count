import React, { useState, useEffect } from 'react';
import { apiFetch, ingestasUrl, consumoISO, todayLocal } from '../api';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Calendar, Search, Camera, Plus, Trash2,
  AlertCircle, ArrowRight,
  Coffee, Sun, Moon, Apple, HelpCircle as CupInfo, X
} from 'lucide-react';
import { Usuario, PlanNutricional, RegistroIngesta, Alimento, TipoComida } from '../types';
import { getMondayOfDate, formatLocalDate, semaforo, SEMAFORO_LABEL, SEMAFORO_THEME } from '../calendario';

interface DashboardPacienteProps {
  user: Usuario;
}

const MEALS_LIST: TipoComida[] = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena'];

const guessUnitWeight = (name: string): number => {
  const lowercase = name.toLowerCase();
  
  if (lowercase.includes('banana') || lowercase.includes('platano') || lowercase.includes('plátano')) return 120;
  if (lowercase.includes('manzana')) return 150;
  if (lowercase.includes('clara')) return 35; // clara de huevo
  if (lowercase.includes('huevo')) return 60; // 1 huevo entero
  if (lowercase.includes('rebanada') || lowercase.includes('pan')) return 30; // 1 rebanada
  if (lowercase.includes('miel')) return 10; // cucharada
  if (lowercase.includes('aceite')) return 5; // cucharadita de oliva/te
  if (lowercase.includes('yogur') || lowercase.includes('yogurt')) return 125;
  if (lowercase.includes('almendra')) return 1.2;
  if (lowercase.includes('queso') && lowercase.includes('feto')) return 20;
  if (lowercase.includes('galleta') || lowercase.includes('galletita')) return 8;
  
  return 100; // default standard
};

export default function DashboardPaciente({ user }: DashboardPacienteProps) {
  const [activePlan, setActivePlan] = useState<PlanNutricional | null>(null);

  // Modals for unlink (baja de nutricionista)
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [unlinkStatusMessage, setUnlinkStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayLocal());
  const [ingestas, setIngestas] = useState<RegistroIngesta[]>([]);
  
  // Totals for today
  const [totals, setTotals] = useState({ calories: 0, proteins: 0, carbs: 0, fats: 0 });

  // Catalog & Entry states
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlimento, setSelectedAlimento] = useState<Alimento | null>(null);
  const [mealType, setMealType] = useState<TipoComida>('Desayuno');

  // Input states (Grams vs Units)
  const [unitMode, setUnitMode] = useState<'g' | 'u'>('g');
  const [cantidadGramos, setCantidadGramos] = useState<number>(100);
  const [unitQty, setUnitQty] = useState<number>(1);
  const [unitWeight, setUnitWeight] = useState<number>(60);

  // Estado del escáner de códigos de barras
  const [showScanner, setShowScanner] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannedAlimento, setScannedAlimento] = useState<Alimento | null>(null);

  // Custom Alimento creation states
  const [showCustomFoodForm, setShowCustomFoodForm] = useState(false);
  const [customNombre, setCustomNombre] = useState('');
  const [customCalorias, setCustomCalorias] = useState<number>(120);
  const [customProteinas, setCustomProteinas] = useState<number>(8);
  const [customCarbos, setCustomCarbos] = useState<number>(15);
  const [customGrasas, setCustomGrasas] = useState<number>(4);

  const [actionError, setActionError] = useState<string | null>(null);

  // Las metas salen solo del plan vigente del nutricionista; sin plan se muestran solo los consumos (metas en 0).
  const isPlanValid = !!activePlan && activePlan.fecha_fin >= todayLocal();
  const targetCalories = isPlanValid ? activePlan!.calorias_objetivo : 0;
  const targetProteins = isPlanValid ? activePlan!.proteinas_objetivo : 0;
  const targetCarbs = isPlanValid ? activePlan!.carbohidratos_objetivo : 0;
  const targetFats = isPlanValid ? activePlan!.grasas_objetivo : 0;

  // Weekly status track for calendar compliance
  const [weeklyStatus, setWeeklyStatus] = useState<Record<string, { calories: number; target: number }>>({});

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Active week starting Monday for the compliance carousel
  const [carouselWeekStart, setCarouselWeekStart] = useState<Date>(() => {
    return getMondayOfDate(new Date());
  });

  // Sync carousel week start when selectedDate shifts
  useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        setCarouselWeekStart(getMondayOfDate(d));
      }
    }
  }, [selectedDate]);

  // Week Slider handlers (4 days on mobile, 7 days on desktop)
  const handlePrevWeek = () => {
    const shift = isMobile ? 4 : 7;
    const nextStart = new Date(carouselWeekStart);
    nextStart.setDate(nextStart.getDate() - shift);
    setCarouselWeekStart(nextStart);
  };

  const handleNextWeek = () => {
    const shift = isMobile ? 4 : 7;
    const nextStart = new Date(carouselWeekStart);
    nextStart.setDate(nextStart.getDate() + shift);
    setCarouselWeekStart(nextStart);
  };

  const getFormattedWeekRange = (): string => {
    const numDays = isMobile ? 3 : 6;
    const start = new Date(carouselWeekStart);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + numDays);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const localeStrStart = start.toLocaleDateString('es-ES', options);
    const localeStrEnd = end.toLocaleDateString('es-ES', options);
    return `${localeStrStart} - ${localeStrEnd}`;
  };

  // Fetch helper to gather stats for surrounding days
  const fetchWeeklyCalendarStats = async () => {
    try {
      const datesToFetch: string[] = [];
      const monday = new Date(carouselWeekStart);
      const numDays = isMobile ? 4 : 7;
      for (let i = 0; i < numDays; i++) {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        datesToFetch.push(formatLocalDate(d));
      }

      // Ensure active date is counted
      if (selectedDate && !datesToFetch.includes(selectedDate)) {
        datesToFetch.push(selectedDate);
      }

      const results = await Promise.all(
        datesToFetch.map(async (dStr) => {
          const response = await apiFetch(ingestasUrl(user.id_usuario, dStr));
          if (response.ok) {
            const data = await response.json();
            const records: RegistroIngesta[] = data.ingestas || [];
            let cal = 0;
            records.forEach(r => {
              const al = r.alimento;
              if (al) {
                const mult = r.cantidad / al.medida_cantidad;
                cal += al.calorias * mult;
              }
            });
            return { date: dStr, calories: Math.round(cal) };
          }
          return { date: dStr, calories: 0 };
        })
      );

      const statusMap: Record<string, { calories: number; target: number }> = {};
      results.forEach(res => {
        statusMap[res.date] = {
          calories: res.calories,
          target: targetCalories
        };
      });

      setWeeklyStatus(statusMap);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchActivePlan();
    fetchAlimentos();
  }, []);

  useEffect(() => {
    fetchDailyIngestas();
  }, [selectedDate]);

  // Trigger weekly calendar reload on essential state change
  useEffect(() => {
    fetchWeeklyCalendarStats();
  }, [selectedDate, carouselWeekStart, user.id_usuario, activePlan, isMobile]);

  // Active Camera Barcode Decoding Effect
  useEffect(() => {
    if (!showScanner) return;

    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;
    let isScanning = false;

    // Timeout delay to ensure native DOM element is fully rendered before binding hook
    const timer = setTimeout(() => {
      if (!isMounted) return;

      try {
        html5QrCode = new Html5Qrcode("native-barcode-scanner");
        isScanning = true;

        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              return {
                width: Math.min(width, 280),
                height: Math.min(height, 150)
              };
            },
            aspectRatio: 1.777778
          },
          (decodedText) => {
            if (isMounted) {
              handleBarcodeSubmit(decodedText);
              setManualBarcode(decodedText);
              setShowScanner(false);
            }
          },
          () => {
            // Keep scan cycles clean and quiet
          }
        ).catch((err) => {
          console.error("Camera start failed callback:", err);
          if (isMounted) {
            setScannerError("No se pudo iniciar la cámara de forma nativa. Revisa tus permisos o ingresa el código manualmente.");
          }
        });
      } catch (err) {
        console.error("Failed to initialize Html5Qrcode element ID:", err);
        if (isMounted) {
          setScannerError("Error al iniciar el módulo de Cámara.");
        }
      }
    }, 450);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCode && isScanning) {
        html5QrCode.stop()
          .catch((err) => {
            console.warn("Could not stop camera stream gracefully:", err);
          });
      }
    };
  }, [showScanner]);

  // Adjust unit defaults automatically when food is picked
  useEffect(() => {
    const active = selectedAlimento || scannedAlimento;
    if (active) {
      const gW = guessUnitWeight(active.nombre_alimento);
      setUnitWeight(gW);
      if (active.medida_unidad.toLowerCase().includes('unidad') || active.medida_unidad.toLowerCase().includes('porci')) {
        setUnitWeight(active.medida_cantidad);
      }
    }
  }, [selectedAlimento, scannedAlimento]);

  const fetchActivePlan = async () => {
    try {
      const response = await apiFetch(`/api/plans?patientId=${user.id_usuario}`);
      if (response.ok) {
        const data = await response.json();
        setActivePlan(data.plan);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAlimentos = async () => {
    try {
      const response = await apiFetch('/api/alimentos');
      if (response.ok) {
        const data = await response.json();
        setAlimentos(data.alimentos || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDailyIngestas = async () => {
    try {
      const response = await apiFetch(ingestasUrl(user.id_usuario, selectedDate));
      if (response.ok) {
        const data = await response.json();
        const records: RegistroIngesta[] = data.ingestas || [];
        setIngestas(records);

        // Sum values
        let cal = 0, pr = 0, cb = 0, ft = 0;
        records.forEach(r => {
          const al = r.alimento;
          if (al) {
            const mult = r.cantidad / al.medida_cantidad;
            cal += al.calorias * mult;
            pr += al.proteinas * mult;
            cb += al.carbohidratos * mult;
            ft += al.grasas * mult;
          }
        });

        setTotals({
          calories: Math.round(cal),
          proteins: Number(pr.toFixed(1)),
          carbs: Number(cb.toFixed(1)),
          fats: Number(ft.toFixed(1))
        });
      }
      fetchWeeklyCalendarStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const alimentoToAdd = selectedAlimento || scannedAlimento;
    if (!alimentoToAdd) return;

    // Calculate final actual grams to log
    const finalGrams = unitMode === 'g' ? Number(cantidadGramos) : Math.round(unitQty * unitWeight);

    setActionError(null);
    try {
      const response = await apiFetch('/api/ingestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_alimento: alimentoToAdd.id_alimento,
          cantidad: finalGrams,
          tipo_comida: mealType,
          fecha_hora_consumo: consumoISO(selectedDate)
        })
      });

      if (response.ok) {
        setSelectedAlimento(null);
        setScannedAlimento(null);
        setShowScanner(false);
        setSearchQuery('');
        fetchDailyIngestas();
      } else {
        const errData = await response.json().catch(() => ({}));
        setActionError(errData.error || 'No se pudo registrar la comida');
      }
    } catch (err) {
      console.error(err);
      setActionError('No se pudo conectar con el servidor');
    }
  };

  const handleDeleteIngesta = async (id: number) => {
    try {
      const response = await apiFetch(`/api/ingestas/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchDailyIngestas();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // El servidor identifica al paciente por el token y da de baja su vinculo activo
  const handleUnlinkNutricionista = async () => {
    try {
      const response = await apiFetch('/api/patients/unlink', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setActivePlan(null);
          setUnlinkStatusMessage({
            type: 'success',
            text: 'Baja realizada. Se desvinculó tu nutricionista y se canceló el plan asignado.'
          });
          setTimeout(() => {
            setUnlinkStatusMessage(null);
          }, 3500);
        } else {
          setUnlinkStatusMessage({
            type: 'error',
            text: data.error || 'No se pudo procesar la baja con el nutricionista en el servidor.'
          });
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setUnlinkStatusMessage({
          type: 'error',
          text: `No se pudo procesar la baja con el nutricionista: ${errData.error || response.statusText}`
        });
      }
    } catch (e: any) {
      console.error(e);
      setUnlinkStatusMessage({
        type: 'error',
        text: `Error de red al intentar procesar la baja: ${e.message || e}`
      });
    } finally {
      setShowUnlinkConfirm(false);
    }
  };

  // Trigger barcode lookup using Open Food Facts endpoint proxies
  const handleBarcodeSubmit = async (codeStr: string) => {
    const cleanBar = codeStr.trim();
    if (!cleanBar) return;

    setScannerLoading(true);
    setScannerError(null);
    setScannedAlimento(null);

    try {
      const response = await apiFetch(`/api/barcode/${cleanBar}`);
      if (response.status === 404) {
        throw new Error('Producto no identificado en Open Food Facts.');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al buscar el producto');
      }

      const data = await response.json();
      setScannedAlimento(data.alimento);
      setUnitMode('g');
      setCantidadGramos(100); // default
    } catch (err: any) {
      setScannerError(err.message || 'Código de barras no encontrado');
    } finally {
      setScannerLoading(false);
    }
  };

  const handleCreateCustomFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNombre) return;

    // Valores cada 100 g; el alimento entra al catalogo compartido y queda seleccionado para registrarlo
    setActionError(null);
    try {
      const response = await apiFetch('/api/alimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_alimento: customNombre.trim(),
          calorias: Number(customCalorias),
          proteinas: Number(customProteinas),
          carbohidratos: Number(customCarbos),
          grasas: Number(customGrasas),
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setActionError(data.error || 'No se pudo guardar el alimento');
        return;
      }

      setAlimentos(prev => [...prev, data.alimento]);
      setSelectedAlimento(data.alimento);
      setUnitMode('g');
      setCantidadGramos(100);
      setCustomNombre('');
      setShowCustomFoodForm(false);
    } catch (err) {
      console.error(err);
      setActionError('No se pudo conectar con el servidor');
    }
  };

  // Pre-configured test barcodes for ease of presentation
  const TEST_BARCODES = [
    { name: 'Oreo (7622300489434)', code: '7622300489434' },
    { name: 'Coca Cola Lata (5449000000996)', code: '5449000000996' },
    { name: 'Nutella 400g (3017620422003)', code: '3017620422003' },
  ];

  const pctOf = (value: number, target: number) => (target > 0 ? Math.round((value / target) * 100) : 0);

  const calPercentageRaw = pctOf(totals.calories, targetCalories);
  const calBarWidth = Math.min(calPercentageRaw, 100);
  const calSemaforo = semaforo(isPlanValid ? calPercentageRaw : null);

  const protPercentage = Math.min(pctOf(totals.proteins, targetProteins), 100);
  const carbPercentage = Math.min(pctOf(totals.carbs, targetCarbs), 100);
  const fatPercentage = Math.min(pctOf(totals.fats, targetFats), 100);

  // Filter catalog
  const filteredCatalog = alimentos.filter(a => 
    a.nombre_alimento.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper properties to render meal boxes with style
  const getMealMeta = (meal: TipoComida) => {
    switch(meal) {
      case 'Desayuno':
        return { icon: Coffee, title: 'Desayuno', color: 'text-amber-400 bg-amber-950/30 border-amber-900/40', hr: '🍳' };
      case 'Colación':
        return { icon: Apple, title: 'Colación', color: 'text-rose-400 bg-rose-955/30 border-rose-900/40', hr: '🍎' };
      case 'Almuerzo':
        return { icon: Sun, title: 'Almuerzo', color: 'text-emerald-400 bg-emerald-950/30 border-emerald-950/40', hr: '☀️' };
      case 'Merienda':
        return { icon: CupInfo, title: 'Merienda', color: 'text-orange-400 bg-orange-950/30 border-orange-900/40', hr: '☕' };
      case 'Cena':
        return { icon: Moon, title: 'Cena', color: 'text-sky-400 bg-sky-950/30 border-sky-900/40', hr: '🌙' };
    }
  };

  // Group logged items by meal type for the structured boxes
  const groupedMeals = MEALS_LIST.reduce((acc, meal) => {
    acc[meal] = ingestas.filter(i => i.tipo_comida === meal);
    return acc;
  }, {} as Record<TipoComida, RegistroIngesta[]>);

  // Calculate totals per meal box
  const getMealSubtotals = (mealItems: RegistroIngesta[]) => {
    let cal = 0, pr = 0, cb = 0, ft = 0;
    mealItems.forEach(i => {
      const al = i.alimento;
      if (al) {
        const mult = i.cantidad / al.medida_cantidad;
        cal += al.calorias * mult;
        pr += al.proteinas * mult;
        cb += al.carbohidratos * mult;
        ft += al.grasas * mult;
      }
    });
    return {
      cal: Math.round(cal),
      pr: Math.round(pr),
      cb: Math.round(cb),
      ft: Math.round(ft)
    };
  };

  // Fast action to trigger manual select in a specific meal
  const triggerQuickAddForMeal = (meal: TipoComida) => {
    setMealType(meal);
    // Smooth scroll to catalog entry
    document.getElementById('right-activity-scroller')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="paciente-dashboard">
      {actionError && (
        <div role="alert" className="mb-4 p-3.5 bg-red-950/40 border border-red-900/50 text-red-200 rounded-xl text-sm font-medium flex items-start justify-between gap-3">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="text-red-300 hover:text-white" aria-label="Cerrar aviso">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 border-b border-neutral-900 pb-5 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Hola, {user.persona?.nombre || 'Paciente'} 👋</span>
          </h1>
          <p className="text-xs text-neutral-550 mt-1 flex items-center flex-wrap gap-2">
            {isPlanValid 
              ? `Plan nutricional activo: ${targetCalories} kcal diarias prescritas para ti.`
              : 'Sin plan vigente: tu nutricionista todavía no te asignó metas.'
            }
            <button
              onClick={() => setShowUnlinkConfirm(true)}
              className="text-[11px] font-bold text-rose-450 hover:text-rose-400 underline inline-flex items-center space-x-1 cursor-pointer ml-2"
              title="Dar de baja el tratamiento con mi nutricionista"
            >
              <span>⚠️ Dar de Baja de Nutricionista</span>
            </button>
          </p>
        </div>

        {/* Selected date selector wrapper */}
        <div className="flex items-center space-x-2 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800 shadow-sm w-fit transition">
          <Calendar className="h-4 w-4 text-emerald-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-semibold text-neutral-300 focus:outline-none bg-transparent cursor-pointer"
            id="input-selected-date"
          />
        </div>
      </div>

      {/* Interactive Compliance Weekly Calendar Tracker */}
      <div className="bg-neutral-900/40 p-5 rounded-2xl border border-neutral-800 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 space-y-2 sm:space-y-0 text-center sm:text-left">
          <div>
            <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider font-mono block">
              Calendario de Cumplimiento Semanal ({getFormattedWeekRange()})
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Los colores muestran tu nivel de acierto en calorías diarias. Haz clic en cualquiera para abrir su registro.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[9px] font-bold text-neutral-400 justify-center font-mono animate-fadeIn">
            {(['verde', 'amarillo', 'rojo', 'gris'] as const).map(s => (
              <span key={s} className="flex items-center space-x-1">
                <span className={`h-1.5 w-1.5 rounded-full ${SEMAFORO_THEME[s].dot}`} />
                <span>{SEMAFORO_LABEL[s]}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 mb-6">
          <button 
            type="button"
            onClick={handlePrevWeek}
            className="flex-shrink-0 p-2 sm:p-3 bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl text-neutral-400 hover:text-white transition cursor-pointer flex items-center justify-center font-mono text-base sm:text-lg w-9 h-16 sm:w-11 sm:h-20"
            title="Ver semana anterior"
          >
            ‹
          </button>

          <div className="flex-grow grid grid-cols-4 sm:grid-cols-7 gap-1 sm:gap-3">
            {(() => {
              const daysToRender: Date[] = [];
              const startStr = new Date(carouselWeekStart.getFullYear(), carouselWeekStart.getMonth(), carouselWeekStart.getDate());
              const numDays = isMobile ? 4 : 7;
              for (let i = 0; i < numDays; i++) {
                const d = new Date(startStr.getFullYear(), startStr.getMonth(), startStr.getDate() + i);
                daysToRender.push(d);
              }

              return daysToRender.map((dObj) => {
                const dStr = formatLocalDate(dObj);
                const stats = weeklyStatus[dStr] || { calories: 0, target: targetCalories };
                const isSelected = dStr === selectedDate;
                
                const dayCalories = stats.calories;
                const pct = pctOf(dayCalories, targetCalories);

                const calTheme = SEMAFORO_THEME[semaforo(isPlanValid ? pct : null)];
                const bgClasses = calTheme.cell;
                const statusDot = calTheme.dot;

                // Spanish labels
                const daysSpanishList = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                const label = daysSpanishList[dObj.getDay()];
                const dayNum = dObj.getDate();

                return (
                  <button
                    key={dStr}
                    type="button"
                    onClick={() => setSelectedDate(dStr)}
                    className={`flex flex-col items-center py-2.5 rounded-xl border transition-all cursor-pointer relative ${bgClasses} ${
                      isSelected ? 'ring-2 ring-emerald-500 scale-[1.04] shadow-md z-10 font-bold bg-neutral-900/70 border-emerald-500/80 text-white' : ''
                    }`}
                    title={`${dStr}: ${dayCalories} kcal${isPlanValid ? ` (${pct}%)` : ''}`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wide opacity-75 mb-0.5">{label}</span>
                    <span className="text-sm font-black tracking-tight">{dayNum}</span>
                    {dayCalories > 0 ? (
                      <span className="text-[8.5px] font-mono font-black mt-1">
                        {isPlanValid ? `${pct}%` : `${dayCalories} kcal`}
                      </span>
                    ) : (
                      <span className="text-[8.5px] text-neutral-600 mt-1 font-bold">-</span>
                    )}
                    <span className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ${statusDot}`} />
                  </button>
                );
              });
            })()}
          </div>

          <button 
            type="button"
            onClick={handleNextWeek}
            className="flex-shrink-0 p-2 sm:p-3 bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl text-neutral-400 hover:text-white transition cursor-pointer flex items-center justify-center font-mono text-base sm:text-lg w-9 h-16 sm:w-11 sm:h-20"
            title="Ver semana siguiente"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* =============== LEFT PORTION (7/12 width): Target indicators & meal grouped boxes =============== */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Progress Summary Cards & Bars */}
          <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 shadow-md">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6 flex justify-between items-center">
              <span>Balance Nutricional de Hoy</span>
              <span className="text-[10px] font-mono text-neutral-500">{selectedDate}</span>
            </h3>

            {totals.calories === 0 && (
              <div className="mb-6 p-4 bg-neutral-950 border border-neutral-850 text-neutral-450 rounded-xl text-xs flex items-start space-x-2.5">
                <AlertCircle className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
                <span>Aún no has registrado ingestas hoy. ¡Empieza ahora cargando tus comidas en los casilleros de abajo!</span>
              </div>
            )}

            {/* Calories macro meter */}
            <div className="space-y-2 mb-8">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-mono">Consumo Calórico</span>
                  <span className="text-2xl font-black text-white mt-1">
                    {totals.calories} <span className="text-xs text-neutral-500 font-semibold">{isPlanValid ? `/ ${targetCalories} kcal` : 'kcal'}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all border ${SEMAFORO_THEME[calSemaforo].cell}`}>
                    {isPlanValid ? `${calPercentageRaw}% de tu meta` : 'Sin plan vigente'}
                  </span>
                </div>
              </div>
              <div className="w-full bg-neutral-950 h-3.5 rounded-full overflow-hidden border border-neutral-900">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${SEMAFORO_THEME[calSemaforo].bar}`}
                  style={{ width: `${calBarWidth}%` }}
                />
              </div>
            </div>

            {/* Split macro metrics */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {/* Protein indicator */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-400">Proteína</span>
                  <span className="text-neutral-400">{totals.proteins}g{isPlanValid ? ` / ${targetProteins}g` : ''}</span>
                </div>
                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-900">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${protPercentage}%` }}
                  />
                </div>
              </div>

              {/* Carbohydrates indicator */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-sky-400">Carbos</span>
                  <span className="text-neutral-400">{totals.carbs}g{isPlanValid ? ` / ${targetCarbs}g` : ''}</span>
                </div>
                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-900">
                  <div 
                    className="bg-sky-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${carbPercentage}%` }}
                  />
                </div>
              </div>

              {/* Fats indicator */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-amber-400">Grasas</span>
                  <span className="text-neutral-400">{totals.fats}g{isPlanValid ? ` / ${targetFats}g` : ''}</span>
                </div>
                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-900">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${fatPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MEAL CONTAINERS / BOXES (Grouped list view) */}
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Distribución por Tiempos de Comida
              </h2>
              <span className="text-[11px] text-neutral-500 select-none">Presione + para incorporar directo</span>
            </div>

            {MEALS_LIST.map((meal) => {
              const mealMeta = getMealMeta(meal)!;
              const items = groupedMeals[meal] || [];
              const sub = getMealSubtotals(items);

              return (
                <div 
                  key={meal}
                  className="bg-neutral-900/40 rounded-2xl border border-neutral-800 overflow-hidden shadow-sm transition hover:border-neutral-750"
                  id={`meal-box-${meal}`}
                >
                  {/* Meal box header */}
                  <div className="bg-neutral-955/65 px-5 py-4 border-b border-neutral-800 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{mealMeta.hr}</span>
                      <div>
                        <h3 className="font-bold text-sm text-white">{mealMeta.title}</h3>
                        <p className="text-[10.5px] text-neutral-550 leading-none">Carga programada para {meal}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Macro sub-totals for this box */}
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-neutral-200">{sub.cal} kcal</span>
                        <div className="text-[9.5px] text-neutral-500 font-semibold block mt-0.5 space-x-1">
                          <span>P: {sub.pr}g</span>
                          <span>|</span>
                          <span>C: {sub.cb}g</span>
                          <span>|</span>
                          <span>G: {sub.ft}g</span>
                        </div>
                      </div>

                      {/* Fast Action Add button */}
                      <button
                        onClick={() => triggerQuickAddForMeal(meal)}
                        className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-emerald-450 hover:text-emerald-400 rounded-xl transition cursor-pointer"
                        title={`Agregar alimento a ${meal}`}
                      >
                        <Plus className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Meal list for this specific box */}
                  <div className="p-4 bg-neutral-950/40">
                    {items.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-xs text-neutral-600 font-medium italic">Sin registros en {mealMeta.title} para hoy</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {items.map((ing) => {
                          const al = ing.alimento;
                          if (!al) return null;
                          const mult = ing.cantidad / al.medida_cantidad;
                          const calG = Math.round(al.calorias * mult);
                          const prG = Math.round(al.proteinas * mult);
                          const cbG = Math.round(al.carbohidratos * mult);
                          const ftG = Math.round(al.grasas * mult);

                          return (
                            <div 
                              key={ing.id_registro}
                              className="flex items-center justify-between p-3 bg-neutral-950/90 hover:bg-neutral-900/60 rounded-xl border border-neutral-850 transition"
                              id={`ingesta-record-${ing.id_registro}`}
                            >
                              <div>
                                <h4 className="font-bold text-xs text-neutral-200">
                                  {al.nombre_alimento}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-[10px] text-neutral-500 font-medium">
                                    Porción: {ing.cantidad} {al.medida_unidad || 'g'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3.5">
                                <div className="text-right">
                                  <span className="text-xs font-bold text-emerald-400 block">{calG} kcal</span>
                                  <span className="text-[9px] font-medium text-neutral-500 font-mono">
                                    P:{prG} C:{cbG} G:{ftG}
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleDeleteIngesta(ing.id_registro)}
                                  className="p-1.5 text-neutral-600 hover:text-rose-400 hover:bg-rose-955/20 rounded-lg transition"
                                  title="Retirar del registro"
                                  id={`btn-delete-${ing.id_registro}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* =============== RIGHT PORTION (5/12 width): Buscador, escáner y carga de cantidad =============== */}
        <div className="lg:col-span-5 space-y-6" id="right-activity-scroller">
          
          <div className="space-y-6">
            
            {/* Barcode scanner controller container */}
            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 shadow-md">
              <button
                onClick={() => { setShowScanner(!showScanner); setSelectedAlimento(null); setScannedAlimento(null); }}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer ${
                  showScanner 
                    ? 'bg-rose-955/30 text-rose-300 border border-rose-900/40' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold'
                }`}
                id="btn-trigger-scanner"
              >
                <Camera className="h-4 w-4" />
                <span>{showScanner ? 'Cancelar Escaneo' : 'Escanear Código de Barras'}</span>
              </button>

              {showScanner && (
                <div className="mt-5 space-y-4 pt-4 border-t border-neutral-800" id="scanner-panel-expanded">
                  
                  {/* Native Camera Barcode Scanner Container */}
                  <div className="relative bg-black rounded-xl overflow-hidden border border-neutral-800 shadow-inner p-1">
                    <div id="native-barcode-scanner" className="w-full min-h-[200px] bg-neutral-950 rounded-lg"></div>
                    
                    {/* Indicador de cámara activa */}
                    <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none z-10">
                      <span className="bg-neutral-950/80 border border-emerald-500/40 text-emerald-400 font-mono text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                        Cámara Escáner Activa
                      </span>
                    </div>
                    
                    {/* Línea guía del escáner */}
                    <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-lg shadow-rose-500/90 pointer-events-none opacity-60 animate-[bounce_2s_infinite]"></div>
                  </div>

                  {/* Códigos de prueba para la demo */}
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80">
                    <h4 className="text-[10px] font-bold text-neutral-400 uppercase mb-2 font-mono tracking-wider">Códigos de Prueba Rápida</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      {TEST_BARCODES.map((tb) => (
                        <button
                          key={tb.code}
                          type="button"
                          onClick={() => { setManualBarcode(tb.code); handleBarcodeSubmit(tb.code); }}
                          className="bg-neutral-900 hover:bg-neutral-850 hover:text-emerald-400 border border-neutral-800 p-2 rounded-lg text-[10px] font-semibold text-neutral-300 transition flex items-center justify-between"
                        >
                          <span className="truncate">{tb.name.split(' ')[0]}</span>
                          <ArrowRight className="h-3 w-3 opacity-60 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input barcode manual fallback */}
                  <div>
                    <label className="block text-[10.5px] font-bold text-neutral-400 uppercase mb-2">
                      Ingresar Código de Barra a mano (Open Food Facts Real)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={manualBarcode}
                        onChange={(e) => setManualBarcode(e.target.value)}
                        placeholder="Código de barra (e.g. 7622300489434)"
                        className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs text-white"
                      />
                      <button
                        type="button"
                        disabled={scannerLoading || !manualBarcode}
                        onClick={() => handleBarcodeSubmit(manualBarcode)}
                        className="px-3 py-2 bg-emerald-500 text-neutral-955 font-bold text-xs rounded-xl hover:bg-emerald-400 transition disabled:opacity-50"
                      >
                        Buscar
                      </button>
                    </div>
                  </div>

                  {scannerLoading && (
                    <p className="text-xs text-neutral-500 text-center animate-pulse">Consultando API de Open Food Facts...</p>
                  )}

                  {scannerError && (
                    <div className="p-3 bg-rose-955/20 border border-rose-900/40 text-rose-200 text-xs rounded-xl">
                      <p className="font-bold">{scannerError}</p>
                      <button
                        type="button"
                        onClick={() => { setShowCustomFoodForm(true); setShowScanner(false); }}
                        className="mt-2 block w-full py-1.5 bg-rose-600 hover:bg-rose-500 font-bold text-white text-[10px] rounded text-center transition"
                      >
                        Cargar alimento manualmente
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Manual search view panel */}
            {!showScanner && (
              <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 shadow-md space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Búsqueda Manual
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Catálogo</span>
                </div>

                {showCustomFoodForm ? (
                  <form onSubmit={handleCreateCustomFood} className="space-y-3.5 bg-neutral-955/60 p-4 rounded-xl border border-neutral-800">
                    <h4 className="text-xs font-bold text-neutral-300">Agregar nuevo Alimento</h4>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-450 mb-1 font-mono">Nombre Alimento</label>
                      <input
                        type="text"
                        required
                        placeholder="Harina de Avena"
                        value={customNombre}
                        onChange={(e) => setCustomNombre(e.target.value)}
                        className="block w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-450 mb-1">Calorías</label>
                        <input
                          type="number"
                          required
                          value={customCalorias}
                          onChange={(e) => setCustomCalorias(Number(e.target.value))}
                          className="block w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-450 mb-1">Prots (g)</label>
                        <input
                          type="number"
                          required
                          value={customProteinas}
                          onChange={(e) => setCustomProteinas(Number(e.target.value))}
                          className="block w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-450 mb-1">Carbos (g)</label>
                        <input
                          type="number"
                          required
                          value={customCarbos}
                          onChange={(e) => setCustomCarbos(Number(e.target.value))}
                          className="block w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-450 mb-1">Grasas (g)</label>
                        <input
                          type="number"
                          required
                          value={customGrasas}
                          onChange={(e) => setCustomGrasas(Number(e.target.value))}
                          className="block w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-400 font-bold text-neutral-955 text-[10px] rounded transition cursor-pointer"
                      >
                        Guardar Alimento
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomFoodForm(false)}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 font-bold text-neutral-300 text-[10px] rounded transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-neutral-500" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar banana, huevo, avena, Clara, etc..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-805 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs transition text-white"
                        id="input-catalog-search"
                      />
                    </div>

                    {searchQuery && (
                      <div className="max-h-48 overflow-y-auto divide-y divide-neutral-800 border border-neutral-800 rounded-xl px-2 py-1 bg-neutral-950">
                        {filteredCatalog.length === 0 ? (
                          <div className="py-4 text-center">
                            <p className="text-[11px] text-neutral-500">¿No encontraste lo que buscabas?</p>
                            <button
                              type="button"
                              onClick={() => setShowCustomFoodForm(true)}
                              className="mt-1.5 text-[10.5px] font-bold text-emerald-400 hover:underline cursor-pointer"
                            >
                              + Sugerir/Cargar nuevo alimento
                            </button>
                          </div>
                        ) : (
                          filteredCatalog.map(al => (
                            <button
                              key={al.id_alimento}
                              type="button"
                              onClick={() => setSelectedAlimento(al)}
                              className={`w-full text-left py-2 px-2 hover:bg-neutral-900 rounded-lg text-xs font-semibold flex justify-between items-center transition cursor-pointer ${
                                selectedAlimento?.id_alimento === al.id_alimento 
                                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/35' 
                                  : 'text-neutral-300 border border-transparent'
                              }`}
                            >
                              <span>{al.nombre_alimento}</span>
                              <span className="text-[10px] text-neutral-500 font-normal">{al.calorias} kcal / {al.medida_cantidad}{al.medida_unidad}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Configuration Form wrapper for Grams vs. Units Choice */}
          {(selectedAlimento || scannedAlimento) && (
            <div className="bg-emerald-955/15 p-6 rounded-2xl border border-emerald-900/40 space-y-4 shadow-sm" id="food-mass-confirm-form">
              <div className="flex items-center justify-between border-b border-emerald-900/30 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Paso 2: Modo de Medida</span>
                <button 
                  onClick={() => { setSelectedAlimento(null); setScannedAlimento(null); }}
                  className="text-xs font-semibold text-neutral-450 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <p className="text-[11px] text-neutral-500 leading-none">Alimento configurado:</p>
                <p className="font-extrabold text-white text-base mt-1">
                  {(selectedAlimento || scannedAlimento)?.nombre_alimento}
                </p>
                <p className="text-[11px] text-neutral-450 mt-1">
                  Ref base: {(selectedAlimento || scannedAlimento)?.calorias} kcal por {(selectedAlimento || scannedAlimento)?.medida_cantidad}{(selectedAlimento || scannedAlimento)?.medida_unidad}
                </p>
              </div>

              {/* UNIT SELECTION CHOOSER (dynamic override) */}
              <div className="space-y-3 pt-1">
                <label className="block text-[10px] font-bold text-neutral-450 uppercase font-mono tracking-wider">
                  ¿Cómo desea cargar el alimento?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUnitMode('g')}
                    className={`py-1.5 px-3 rounded-lg font-bold text-[11px] transition border ${
                      unitMode === 'g'
                        ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-800'
                    }`}
                  >
                    Gramos (g)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitMode('u')}
                    className={`py-1.5 px-3 rounded-lg font-bold text-[11px] transition border ${
                      unitMode === 'u'
                        ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-800'
                    }`}
                  >
                    Unidades (Ej. Huevo)
                  </button>
                </div>

                {unitMode === 'g' ? (
                  <div>
                    <label className="block text-[10.5px] font-bold text-neutral-450 mb-1">Cantidad en Gramos (g)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={cantidadGramos}
                      onChange={(e) => setCantidadGramos(Number(e.target.value))}
                      className="block w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white font-semibold"
                      id="input-consume-amount"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] font-bold text-neutral-450 mb-1">Unidades</label>
                      <input
                        type="number"
                        required
                        min={0.1}
                        step="any"
                        value={unitQty}
                        onChange={(e) => setUnitQty(Number(e.target.value))}
                        className="block w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold text-neutral-450 mb-1">Peso Un. Esperado (g)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={unitWeight}
                        onChange={(e) => setUnitWeight(Number(e.target.value))}
                        className="block w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white font-semibold"
                      />
                    </div>
                  </div>
                )}

                {unitMode === 'u' && (
                  <p className="text-[10px] text-emerald-400 font-medium">
                    🔍 {unitQty} {unitQty === 1 ? 'unidad' : 'unidades'} de {unitWeight}g equivale a <span className="underline font-bold font-mono">{Math.round(unitQty * unitWeight)}g</span>.
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-emerald-900/40">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <form onSubmit={handleAddMeal}>
                      <div className="flex space-x-1.5">
                        <select
                          value={mealType}
                          onChange={(e) => setMealType(e.target.value as TipoComida)}
                          className="px-2 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-[11px] font-semibold text-neutral-200"
                        >
                          {MEALS_LIST.map(meal => (
                            <option key={meal} value={meal}>{meal}</option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs rounded-xl transition"
                        >
                          Registrar comida
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ⚠️ MODAL DE CONFIRMACIÓN DE BAJA DE NUTRICIONISTA */}
      {showUnlinkConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-fade">
            <div className="text-center">
              <span className="text-4xl block mb-4">⚠️</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Confirmar Baja de Nutricionista</h2>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                ¿Está seguro de que desea dar de baja el seguimiento de su nutricionista?
                <br />
                Se cancelará el plan alimentario asignado por el profesional.
              </p>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUnlinkNutricionista}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Sí, Dar de Baja
              </button>
              <button
                onClick={() => setShowUnlinkConfirm(false)}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Conservar Relación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 MODAL DE ESTADO/ÉXITO DE BAJA */}
      {unlinkStatusMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center relative animate-fade">
            <span className="text-4xl block mb-3">
              {unlinkStatusMessage.type === 'success' ? '✅' : '❌'}
            </span>
            <h3 className={`text-base font-bold ${unlinkStatusMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {unlinkStatusMessage.type === 'success' ? 'Operación Exitosa' : 'Ocurrió un Error'}
            </h3>
            <p className="text-xs text-neutral-300 mt-2 leading-relaxed opacity-90">
              {unlinkStatusMessage.text}
            </p>
            {unlinkStatusMessage.type === 'error' && (
              <button
                onClick={() => setUnlinkStatusMessage(null)}
                className="mt-5 w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
