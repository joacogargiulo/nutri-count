/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { apiFetch, ingestasUrl, consumoISO, todayLocal } from '../api';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Calendar, Search, Camera, Plus, Trash2, 
  Sparkles, AlertCircle, ArrowRight,
  Coffee, Sun, Moon, Apple, HelpCircle as CupInfo, Save, X, List
} from 'lucide-react';
import { Usuario, PlanNutricional, RegistroIngesta, Alimento, TipoComida } from '../types';

// Helper functions for week carousel and compliance coloring
export const getMondayOfDate = (d: Date): Date => {
  const day = d.getDay();
  // If Sunday (0), we go back 6 days. Otherwise subtraction is (day - 1).
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
};

export const formatLocalDate = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getCalorieStatusTheme = (pct: number, hasCalories: boolean) => {
  if (!hasCalories || pct === 0) {
    return {
      bg: "bg-neutral-950",
      text: "text-neutral-400",
      border: "border-neutral-850/60",
      dot: "bg-neutral-800",
      bgHover: "hover:bg-neutral-900 hover:border-neutral-700",
      plainBg: "bg-neutral-850",
      textColor: "text-neutral-400"
    };
  }

  // Under target: 0% is Red -> 100% is Green
  if (pct < 100) {
    if (pct < 25) {
      return {
        bg: "bg-red-950/45",
        text: "text-red-400",
        border: "border-red-500/40",
        dot: "bg-red-500",
        bgHover: "hover:bg-red-900/35",
        plainBg: "bg-red-500",
        textColor: "text-red-400"
      };
    } else if (pct < 55) {
      return {
        bg: "bg-orange-950/45",
        text: "text-orange-400",
        border: "border-orange-500/45",
        dot: "bg-orange-500",
        bgHover: "hover:bg-orange-900/35",
        plainBg: "bg-orange-500",
        textColor: "text-orange-450"
      };
    } else if (pct < 85) {
      return {
        bg: "bg-amber-955/45",
        text: "text-amber-400",
        border: "border-amber-500/45",
        dot: "bg-amber-400",
        bgHover: "hover:bg-amber-900/35",
        plainBg: "bg-amber-400",
        textColor: "text-amber-400"
      };
    } else {
      return {
        bg: "bg-emerald-950/45",
        text: "text-emerald-400",
        border: "border-emerald-500/45",
        dot: "bg-emerald-500",
        bgHover: "hover:bg-emerald-900/35",
        plainBg: "bg-emerald-500",
        textColor: "text-emerald-400"
      };
    }
  } 
  // Over target: back down to Red
  else {
    if (pct <= 108) {
      return {
        bg: "bg-lime-955/45",
        text: "text-lime-400",
        border: "border-lime-500/45",
        dot: "bg-lime-500",
        bgHover: "hover:bg-lime-900/35",
        plainBg: "bg-lime-500",
        textColor: "text-lime-450"
      };
    } else if (pct <= 120) {
      return {
        bg: "bg-orange-955/45",
        text: "text-orange-400",
        border: "border-orange-500/45",
        dot: "bg-orange-550",
        bgHover: "hover:bg-orange-900/35",
        plainBg: "bg-orange-550",
        textColor: "text-orange-450"
      };
    } else {
      return {
        bg: "bg-rose-955/45",
        text: "text-rose-400",
        border: "border-rose-500/45",
        dot: "bg-rose-500",
        bgHover: "hover:bg-rose-900/35",
        plainBg: "bg-rose-550",
        textColor: "text-rose-450"
      };
    }
  }
};

interface DashboardPacienteProps {
  user: Usuario;
}

interface DraftIngredient {
  id_draft: string;
  alimento: Alimento;
  unitMode: 'g' | 'u';
  unitQty: number;
  unitWeight: number;
  finalGrams: number;
}

interface SavedRecipe {
  id: string;
  name: string;
  ingredients: {
    id_alimento: number | string; // string = todavia no persistido en Alimentos (placeholder local)
    nombre_alimento: string;
    cantidad: number;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    medida_cantidad: number;
    medida_unidad: string;
    unitMode: 'g' | 'u';
    unitQty: number;
    unitWeight: number;
  }[];
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

  // Staged / Draft Combo plate states (Multiple ingredients)
  const [draftIngredients, setDraftIngredients] = useState<DraftIngredient[]>([]);
  const [recipeName, setRecipeName] = useState<string>('');

  // Reusable custom presets from local storage
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'recipes'>('catalog');

  // Scanner Simulator states
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

  // Sequential loading state
  const [isLoggingMultiple, setIsLoggingMultiple] = useState(false);

  // Patient Automanagement of targets (Calorias & Macros)
  const [userCalories, setUserCalories] = useState<number>(2000);
  const [userProteins, setUserProteins] = useState<number>(130);
  const [userCarbs, setUserCarbs] = useState<number>(220);
  const [userFats, setUserFats] = useState<number>(65);
  const [hasCustomTargets, setHasCustomTargets] = useState<boolean>(false);
  const [showAdjustTargetsModal, setShowAdjustTargetsModal] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isPlanExpired = activePlan ? activePlan.fecha_fin < todayLocal() : true;
  const isPlanValid = activePlan && !isPlanExpired;

  const manualTargetsActive = hasCustomTargets && !isPlanValid;
  const currentCaloriesTarget = manualTargetsActive ? userCalories : (isPlanValid && activePlan ? activePlan.calorias_objetivo : userCalories);
  const currentProteinsTarget = manualTargetsActive ? userProteins : (isPlanValid && activePlan ? activePlan.proteinas_objetivo : userProteins);
  const currentCarbsTarget = manualTargetsActive ? userCarbs : (isPlanValid && activePlan ? activePlan.carbohidratos_objetivo : userCarbs);
  const currentFatsTarget = manualTargetsActive ? userFats : (isPlanValid && activePlan ? activePlan.grasas_objetivo : userFats);

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
          target: currentCaloriesTarget
        };
      });

      setWeeklyStatus(statusMap);
    } catch (e) {
      console.error(e);
    }
  };

  // Load custom targets from localStorage if they exist
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`nutricount_targets_${user.id_usuario}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserCalories(parsed.calories || 2000);
        setUserProteins(parsed.proteins || 130);
        setUserCarbs(parsed.carbs || 220);
        setUserFats(parsed.fats || 65);
        setHasCustomTargets(true);
      } else {
        setHasCustomTargets(false);
      }
    } catch (e) {
      console.error(e);
    }
  }, [user.id_usuario]);

  // Sync custom target values with activePlan values if patient resets/no custom target is saved
  useEffect(() => {
    if (!hasCustomTargets && activePlan) {
      setUserCalories(activePlan.calorias_objetivo);
      setUserProteins(activePlan.proteinas_objetivo);
      setUserCarbs(activePlan.carbohidratos_objetivo);
      setUserFats(activePlan.grasas_objetivo);
    }
  }, [activePlan, hasCustomTargets]);

  useEffect(() => {
    fetchActivePlan();
    fetchAlimentos();
    loadSavedRecipes();
  }, []);

  useEffect(() => {
    fetchDailyIngestas();
  }, [selectedDate]);

  // Trigger weekly calendar reload on essential state change
  useEffect(() => {
    fetchWeeklyCalendarStats();
  }, [selectedDate, carouselWeekStart, user.id_usuario, hasCustomTargets, userCalories, activePlan, isMobile]);

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
              console.log("Barcode scanned successfully:", decodedText);
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
          .then(() => {
            console.log("Camera stream stopped.");
          })
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

  const loadSavedRecipes = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(`nutricount_recipes_${user.id_usuario}`) || '[]');
      setRecipes(saved);
    } catch (e) {
      console.error(e);
    }
  };

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

  const handleUnlinkNutricionista = async () => {
    if (!activePlan) return;
    try {
      const response = await apiFetch('/api/patients/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutricionistaId: activePlan.id_nutricionista,
          patientId: user.id_usuario
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          localStorage.removeItem(`nutricount_targets_${user.id_usuario}`);
          setHasCustomTargets(false);
          setActivePlan(null);
          setUserCalories(2000);
          setUserProteins(130);
          setUserCarbs(220);
          setUserFats(65);
          setUnlinkStatusMessage({
            type: 'success',
            text: 'Dada de baja realizada de forma exitosa. Se ha desvinculado el nutricionista y se han restablecido las metas a los valores predeterminados.'
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

    try {
      const customFoodId = 'custom_' + Math.random().toString(36).substring(2, 9);
      const newRecipe: SavedRecipe = {
        id: 'rec-' + Math.random().toString(36).substring(2, 9),
        name: customNombre,
        ingredients: [{
          id_alimento: customFoodId,
          nombre_alimento: customNombre,
          cantidad: 100, // base 100g
          calorias: Number(customCalorias) || 0,
          proteinas: Number(customProteinas) || 0,
          carbohidratos: Number(customCarbos) || 0,
          grasas: Number(customGrasas) || 0,
          medida_cantidad: 100,
          medida_unidad: 'g',
          unitMode: 'g',
          unitQty: 1,
          unitWeight: 100
        }]
      };

      const recipeKey = `nutricount_recipes_${user.id_usuario}`;
      const savedRecipes = JSON.parse(localStorage.getItem(recipeKey) || '[]');
      savedRecipes.push(newRecipe);
      localStorage.setItem(recipeKey, JSON.stringify(savedRecipes));
      setRecipes(savedRecipes);

      // Clear variables and form fields
      setCustomNombre('');
      setCustomCalorias(0);
      setCustomProteinas(0);
      setCustomCarbos(0);
      setCustomGrasas(0);

      // Close custom food form and switch to Mis Platos tab to see the saved dish
      setShowCustomFoodForm(false);
      setActiveTab('recipes');
    } catch (err) {
      console.error(err);
    }
  };

  // Stage a single customized food into the preparation list
  const handleAddIngredientToDraft = () => {
    const al = selectedAlimento || scannedAlimento;
    if (!al) return;

    const finalGrams = unitMode === 'g' ? Number(cantidadGramos) : Math.round(unitQty * unitWeight);
    
    const newDraftItem: DraftIngredient = {
      id_draft: 'draft-' + Math.random().toString(36).substring(2, 9),
      alimento: al,
      unitMode,
      unitQty: unitMode === 'u' ? unitQty : 0,
      unitWeight: unitMode === 'u' ? unitWeight : 0,
      finalGrams
    };

    setDraftIngredients([...draftIngredients, newDraftItem]);
    setSelectedAlimento(null);
    setScannedAlimento(null);
    setCantidadGramos(100);
    setUnitQty(1);
    setSearchQuery('');
  };

  // Submit and log multiple staged items to the patient history, optionally saving the recipe
  const handleLogDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draftIngredients.length === 0) return;

    setIsLoggingMultiple(true);
    try {
      // 1. Save reusable Combo (Recipe) if a name is input
      const trimmedName = recipeName.trim();
      if (trimmedName) {
        const recipeKey = `nutricount_recipes_${user.id_usuario}`;
        const savedRecipes = JSON.parse(localStorage.getItem(recipeKey) || '[]');
        const newRecipe: SavedRecipe = {
          id: 'rec-' + Math.random().toString(36).substring(2, 9),
          name: trimmedName,
          ingredients: draftIngredients.map(item => ({
            id_alimento: item.alimento.id_alimento,
            nombre_alimento: item.alimento.nombre_alimento,
            cantidad: item.finalGrams,
            calorias: item.alimento.calorias,
            proteinas: item.alimento.proteinas,
            carbohidratos: item.alimento.carbohidratos,
            grasas: item.alimento.grasas,
            medida_cantidad: item.alimento.medida_cantidad,
            medida_unidad: item.alimento.medida_unidad,
            unitMode: item.unitMode,
            unitQty: item.unitQty,
            unitWeight: item.unitWeight
          }))
        };

        savedRecipes.push(newRecipe);
        localStorage.setItem(recipeKey, JSON.stringify(savedRecipes));
        setRecipes(savedRecipes);
      }

      // 2. Post all staged ingredients sequentially
      for (const item of draftIngredients) {
        const logRes = await apiFetch('/api/ingestas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_alimento: item.alimento.id_alimento,
            cantidad: item.finalGrams,
            tipo_comida: mealType,
            fecha_hora_consumo: consumoISO(selectedDate)
          })
        });
        if (!logRes.ok) {
          const errData = await logRes.json().catch(() => ({}));
          throw new Error(errData.error || 'No se pudo registrar un ingrediente');
        }
      }

      // 3. Reset draft state and refresh charts
      setDraftIngredients([]);
      setRecipeName('');
      fetchDailyIngestas();
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || 'No se pudo registrar la comida');
      fetchDailyIngestas();
    } finally {
      setIsLoggingMultiple(false);
    }
  };

  // Load and log a pre-saved custom recipe directly with 1 click
  const handleLogRecipe = async (recipe: SavedRecipe, targetMeal: TipoComida) => {
    setIsLoggingMultiple(true);
    try {
      let persistedAnyNewFood = false;

      for (const ingred of recipe.ingredients) {
        if (ingred && typeof ingred.id_alimento === 'string') {
          // Todavia no existe en Alimentos (placeholder local) - crearlo ahora y quedarse con el id real.
          // No se muestra en el catalogo compartido (origen: 'Personalizado').
          const res = await apiFetch('/api/alimentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre_alimento: ingred.nombre_alimento,
              calorias: ingred.calorias,
              proteinas: ingred.proteinas,
              carbohidratos: ingred.carbohidratos,
              grasas: ingred.grasas,
              medida_cantidad: ingred.medida_cantidad || 100,
              medida_unidad: ingred.medida_unidad || 'g',
              origen: 'Personalizado'
            })
          });
          const data = await res.json();
          if (res.ok && data.alimento) {
            ingred.id_alimento = data.alimento.id_alimento;
            persistedAnyNewFood = true;
          }
        }

        const logRes = await apiFetch('/api/ingestas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_alimento: ingred.id_alimento,
            cantidad: ingred.cantidad,
            tipo_comida: targetMeal,
            fecha_hora_consumo: consumoISO(selectedDate)
          })
        });
        if (!logRes.ok) {
          const errData = await logRes.json().catch(() => ({}));
          throw new Error(`${ingred.nombre_alimento}: ${errData.error || 'no se pudo registrar'}`);
        }
      }

      // Si se persistio algun alimento nuevo, guardar el id real para no volver a crearlo la proxima vez
      if (persistedAnyNewFood) {
        const recipeKey = `nutricount_recipes_${user.id_usuario}`;
        const savedRecipes: SavedRecipe[] = JSON.parse(localStorage.getItem(recipeKey) || '[]');
        const idx = savedRecipes.findIndex(r => r.id === recipe.id);
        if (idx !== -1) {
          savedRecipes[idx] = recipe;
          localStorage.setItem(recipeKey, JSON.stringify(savedRecipes));
          setRecipes(savedRecipes);
        }
      }

      fetchDailyIngestas();
    } catch (e: any) {
      console.error(e);
      setActionError(e.message || 'No se pudo registrar el plato');
      fetchDailyIngestas();
    } finally {
      setIsLoggingMultiple(false);
    }
  };

  const handleDeleteRecipe = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const recipeKey = `nutricount_recipes_${user.id_usuario}`;
      const saved = JSON.parse(localStorage.getItem(recipeKey) || '[]');
      const filtered = saved.filter((r: any) => r.id !== id);
      localStorage.setItem(recipeKey, JSON.stringify(filtered));
      setRecipes(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  // Pre-configured test barcodes for ease of presentation
  const TEST_BARCODES = [
    { name: 'Oreo original (7622210873130)', code: '7622210873130' },
    { name: 'Coca Cola Lata (5449000000996)', code: '5449000000996' },
    { name: 'Nutella 400g (3017620422003)', code: '3017620422003' },
  ];

  // Helper macro targets (fallback if nutricionista hasn't assigned goals yet)
  const targetCalories = currentCaloriesTarget;
  const targetProteins = currentProteinsTarget;
  const targetCarbs = currentCarbsTarget;
  const targetFats = currentFatsTarget;

  const calPercentageRaw = Math.round((totals.calories / targetCalories) * 100);
  const calBarWidth = Math.min(calPercentageRaw, 100);

  const protPercentage = Math.min(Math.round((totals.proteins / targetProteins) * 100), 100);
  const carbPercentage = Math.min(Math.round((totals.carbs / targetCarbs) * 100), 100);
  const fatPercentage = Math.min(Math.round((totals.fats / targetFats) * 100), 100);

  const getCalorieColorClass = (pct: number): string => {
    if (pct === 0) return 'bg-neutral-850';
    if (pct < 80) return 'bg-emerald-500';
    if (pct <= 100) return 'bg-amber-400';
    if (pct <= 108) return 'bg-orange-500';
    return 'bg-rose-500';
  };

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
            <span className="text-xs bg-emerald-950 text-emerald-450 border border-emerald-900/50 py-0.5 px-2 rounded-lg font-normal">Paciente Ejecutivo</span>
          </h1>
          <p className="text-xs text-neutral-550 mt-1 flex items-center flex-wrap gap-2">
            {isPlanValid 
              ? `Plan nutricional activo: ${targetCalories} kcal diarias prescritas para ti.`
              : 'Tratamiento actual: Sin metas de nutricionista asignadas.'
            }
            {!isPlanValid && (
            <button 
              onClick={() => setShowAdjustTargetsModal(true)}
              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-350 underline inline-flex items-center space-x-1 cursor-pointer ml-1"
            >
              <span>⚙️ {hasCustomTargets ? 'Modificar mis objetivos manuales' : 'Autogestionar mis objetivos'}</span>
            </button>
            )}
            {!isPlanValid && hasCustomTargets && (
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem(`nutricount_targets_${user.id_usuario}`);
                    setHasCustomTargets(false);
                    if (activePlan) {
                      setUserCalories(activePlan.calorias_objetivo);
                      setUserProteins(activePlan.proteinas_objetivo);
                      setUserCarbs(activePlan.carbohidratos_objetivo);
                      setUserFats(activePlan.grasas_objetivo);
                    } else {
                      setUserCalories(2000);
                      setUserProteins(130);
                      setUserCarbs(220);
                      setUserFats(65);
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="text-[10px] text-neutral-500 hover:text-neutral-400 underline cursor-pointer ml-1"
                title="Volver a los valores predeterminados del plan"
              >
                (Restablecer a plan)
              </button>
            )}
            {activePlan && (
              <button
                onClick={() => setShowUnlinkConfirm(true)}
                className="text-[11px] font-bold text-rose-450 hover:text-rose-400 underline inline-flex items-center space-x-1 cursor-pointer ml-2"
                title="Dar de baja el tratamiento con mi nutricionista"
              >
                <span>⚠️ Dar de Baja de Nutricionista</span>
              </button>
            )}
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
            <span className="flex items-center space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span>&lt;25% (Rojo/Insuficiente)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <span>25-55% (Naranja)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>55-85% (Amarillo)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>85-100% (Verde/Adecuado)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
              <span>100-108% (Límite)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>&gt;108% (Exceso/Rojo)</span>
            </span>
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
                const pct = dayCalories > 0 ? Math.round((dayCalories / targetCalories) * 100) : 0;
                
                const calTheme = getCalorieStatusTheme(pct, dayCalories > 0);
                const bgClasses = `${calTheme.bg} ${calTheme.text} ${calTheme.border} ${calTheme.bgHover}`;
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
                    title={`${dStr}: ${dayCalories} kcal (${pct}%)`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wide opacity-75 mb-0.5">{label}</span>
                    <span className="text-sm font-black tracking-tight">{dayNum}</span>
                    {dayCalories > 0 ? (
                      <span className="text-[8.5px] font-mono font-black mt-1">
                        {pct}%
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
                    {totals.calories} <span className="text-xs text-neutral-500 font-semibold">/ {targetCalories} kcal</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all border ${
                    calPercentageRaw < 80 
                      ? 'text-emerald-400 bg-emerald-950/45 border-emerald-900/40' 
                      : calPercentageRaw <= 100 
                        ? 'text-amber-400 bg-amber-955/45 border-amber-900/40' 
                        : calPercentageRaw <= 108 
                          ? 'text-orange-400 bg-orange-955/45 border-orange-900/40'
                          : 'text-rose-450 bg-rose-955/45 border-rose-900/40'
                  }`}>
                    {calPercentageRaw}% de tu meta
                  </span>
                </div>
              </div>
              <div className="w-full bg-neutral-950 h-3.5 rounded-full overflow-hidden border border-neutral-900">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getCalorieColorClass(calPercentageRaw)}`}
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
                  <span className="text-neutral-400">{totals.proteins}g / {targetProteins}g</span>
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
                  <span className="text-neutral-400">{totals.carbs}g / {targetCarbs}g</span>
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
                  <span className="text-neutral-400">{totals.fats}g / {targetFats}g</span>
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

        {/* =============== RIGHT PORTION (5/12 width): Interactive selector, Custom Recipes, Draft Panel =============== */}
        <div className="lg:col-span-5 space-y-6" id="right-activity-scroller">
          
          {/* Loader Overlay when saving multiple ingredients */}
          {isLoggingMultiple && (
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center space-y-2 animate-pulse">
              <Sparkles className="h-5 w-5 text-emerald-400 mx-auto" />
              <p className="text-xs text-white font-bold">Procesando y registrando ingredientes en base de datos...</p>
              <p className="text-[10px] text-neutral-500">Un momento por favor...</p>
            </div>
          )}

          {/* Navigation tabs for catalogs vs saved recipes */}
          <div className="bg-neutral-900/60 p-1.5 rounded-xl border border-neutral-800 flex">
            <button
              onClick={() => { setActiveTab('catalog'); setSelectedAlimento(null); }}
              className={`flex-1 py-1.5 pl-2.5 pr-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'catalog' 
                  ? 'bg-neutral-950 text-emerald-400 border border-neutral-850 shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Buscador y Scanner</span>
            </button>
            <button
              onClick={() => { setActiveTab('recipes'); setSelectedAlimento(null); }}
              className={`flex-1 py-1.5 pl-2.5 pr-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'recipes' 
                  ? 'bg-neutral-950 text-emerald-400 border border-neutral-850 shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Save className="h-3.5 w-3.5" />
              <span>Mis Platos Guardados ({recipes.length})</span>
            </button>
          </div>

          {activeTab === 'recipes' ? (
            /* ==================================================== */
            /* ================ MIS PLATOS / RECETAS ============= */
            /* ==================================================== */
            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="text-emerald-450">🍱</span>
                  <span>Platos Compuestos Guardados</span>
                </h3>
                <span className="text-[10px] text-neutral-500 font-mono font-bold">Reusable</span>
              </div>

              {recipes.length === 0 ? (
                <div className="text-center py-10 bg-neutral-950 rounded-xl border border-dashed border-neutral-800/85">
                  <List className="h-7 w-7 text-neutral-600 mx-auto opacity-35 mb-2" />
                  <p className="text-xs text-neutral-400 font-bold">No tienes platos guardados aún</p>
                  <p className="text-[10px] text-neutral-600 mt-1 max-w-xs mx-auto">
                    Carga múltiples ingredientes en el "Borrador de Plato" de la pestaña buscador y asígnale un nombre para guardarlo aquí.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recipes.map(recipe => {
                    // compute totals
                    let totC = 0, totP = 0, totCh = 0, totF = 0;
                    recipe.ingredients.forEach(i => {
                      const mult = i.cantidad / i.medida_cantidad;
                      totC += i.calorias * mult;
                      totP += i.proteinas * mult;
                      totCh += i.carbohidratos * mult;
                      totF += i.grasas * mult;
                    });

                    return (
                      <div 
                        key={recipe.id}
                        className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-3.5 relative"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-black text-white">{recipe.name}</h4>
                            <p className="text-[9.5px] text-neutral-500 font-semibold uppercase mt-0.5 block">
                              {recipe.ingredients.length} {recipe.ingredients.length === 1 ? 'Ingrediente' : 'Ingredientes'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-400">{Math.round(totC)} kcal</span>
                            <span className="text-[9px] text-neutral-500 font-semibold block">P:{Math.round(totP)}g C:{Math.round(totCh)}g G:{Math.round(totF)}g</span>
                          </div>
                        </div>

                        {/* Ingredients list mini overview */}
                        <div className="p-2 bg-neutral-900/60 rounded-lg text-[10.5px] space-y-1 text-neutral-400 border border-neutral-850/60 max-h-28 overflow-y-auto">
                          {recipe.ingredients.map((ing, idx) => (
                            <div key={idx} className="flex justify-between font-medium">
                              <span>• {ing.nombre_alimento}</span>
                              <span className="text-neutral-500">{ing.cantidad}g</span>
                            </div>
                          ))}
                        </div>

                        {/* Logging action selector bar */}
                        <div className="border-t border-neutral-850 pt-3">
                          <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1.5 text-center">Registrar este plato completo en:</p>
                          <div className="grid grid-cols-5 gap-1">
                            {MEALS_LIST.map(meal => (
                              <button
                                key={meal}
                                onClick={() => handleLogRecipe(recipe, meal)}
                                className="py-1 px-1 rounded bg-neutral-900 hover:bg-emerald-950 border border-neutral-800 text-[9.5px] font-bold text-neutral-300 hover:text-emerald-300 transition text-center"
                              >
                                {meal === 'Desayuno' ? 'DES' : meal === 'Colación' ? 'COL' : meal === 'Almuerzo' ? 'ALM' : meal === 'Merienda' ? 'MER' : 'CEN'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Delete recipe button */}
                        <button
                          onClick={(e) => handleDeleteRecipe(recipe.id, e)}
                          className="absolute top-2.5 right-20 p-1 text-neutral-600 hover:text-rose-400 rounded transition"
                          title="Eliminar plato guardado"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ==================================================== */
            /* ================ BUSCADOR / BARCODE ================ */
            /* ==================================================== */
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
                      
                      {/* Floating scanner design guide laser & overlay info */}
                      <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none z-10">
                        <span className="bg-neutral-950/80 border border-emerald-500/40 text-emerald-400 font-mono text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                          Cámara Escáner Activa
                        </span>
                      </div>
                      
                      {/* Holographic scanning laser overlay */}
                      <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-lg shadow-rose-500/90 pointer-events-none opacity-60 animate-[bounce_2s_infinite]"></div>
                    </div>

                    {/* Quick Access Mock Barcodes for Easy Testing */}
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
                          placeholder="Código de barra (e.g. 7622210873130)"
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
          )}

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

              {/* Action branch: single instant log OR insert staging draft list */}
              <div className="space-y-2 pt-2 border-t border-emerald-900/40">
                <div className="flex gap-2">
                  {/* Option 1: Log instant */}
                  <div className="flex-1">
                    <label className="block text-[9.5px] font-bold text-neutral-500 mb-1 uppercase">Instantáneo</label>
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
                          Log Directo
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Option 2: Add into customized dish list draft */}
                  <div className="w-1/2">
                    <label className="block text-[9.5px] font-bold text-neutral-500 mb-1 uppercase">Compuesto</label>
                    <button
                      type="button"
                      onClick={handleAddIngredientToDraft}
                      className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-emerald-400 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <span>+ Ir sumando</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DRAFT MEAL BUILDER WIDGET (Requirement 6 - Panqueque de avena recipe compiler) */}
          {draftIngredients.length > 0 && (
            <div className="bg-sky-955/20 border border-sky-900/40 p-6 rounded-2xl space-y-4 shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between border-b border-sky-900/30 pb-2">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm">🥣</span>
                  <h4 className="text-xs font-black text-sky-300 uppercase tracking-wider">Creador de Comida Compuesta (Recipe)</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setDraftIngredients([])}
                  className="text-xs text-sky-400 hover:text-sky-300"
                  title="Vaciar borrador"
                >
                  Vaciar
                </button>
              </div>

              <p className="text-[10.5px] text-neutral-400">
                Sumaste los siguientes ingredientes en la preparación de esta comida:
              </p>

              {/* List of stacked items */}
              <div className="space-y-1.5">
                {draftIngredients.map((item) => {
                  const mult = item.finalGrams / item.alimento.medida_cantidad;
                  const itemCals = Math.round(item.alimento.calorias * mult);

                  return (
                    <div 
                      key={item.id_draft}
                      className="flex items-center justify-between p-2.5 bg-neutral-950 rounded-xl border border-neutral-900 text-xs font-semibold"
                    >
                      <div>
                        <p className="text-white">{item.alimento.nombre_alimento}</p>
                        <p className="text-[10px] text-neutral-500 font-semibold font-mono mt-0.5">
                          {item.unitMode === 'u' 
                            ? `${item.unitQty} u (${item.finalGrams}g)` 
                            : `${item.finalGrams}g`
                          }
                        </p>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <span className="text-sky-400 text-xs font-bold">{itemCals} kcal</span>
                        <button
                          type="button"
                          onClick={() => setDraftIngredients(draftIngredients.filter(i => i.id_draft !== item.id_draft))}
                          className="p-1 text-neutral-600 hover:text-rose-400 hover:bg-rose-955/20 rounded"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sum of macros */}
              {(() => {
                let dCal = 0, dPr = 0, dCb = 0, dFt = 0;
                draftIngredients.forEach(i => {
                  const mult = i.finalGrams / i.alimento.medida_cantidad;
                  dCal += i.alimento.calorias * mult;
                  dPr += i.alimento.proteinas * mult;
                  dCb += i.alimento.carbohidratos * mult;
                  dFt += i.alimento.grasas * mult;
                });

                return (
                  <div className="bg-neutral-950/80 p-3 rounded-xl border border-sky-950 flex justify-between text-[11px] text-sky-300 font-black">
                    <span>Nutrición Total:</span>
                    <span>
                      {Math.round(dCal)} kcal | P:{Math.round(dPr)}g | C:{Math.round(dCb)}g | G:{Math.round(dFt)}g
                    </span>
                  </div>
                );
              })()}

              {/* Recipe Form to record and save */}
              <form onSubmit={handleLogDraft} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-sky-400 mb-1 uppercase font-mono">
                    Nombre del Plato (Opcional - p/ volver a cargar después)
                  </label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="Ej. Panqueque de avena familiar"
                    className="block w-full px-3 py-1.5 bg-neutral-950 border border-neutral-850 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                  />
                  {recipeName.trim() && (
                    <p className="text-[10px] text-sky-400 italic mt-1 font-medium">✓ Se guardará en la pestaña "Mis Platos Guardados" para re-usarlo con 1-click.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-sky-400 mb-1 uppercase font-mono">Asignar a Comida</label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value as TipoComida)}
                      className="block w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-850 rounded-lg text-xs font-semibold text-neutral-300"
                    >
                      {MEALS_LIST.map(meal => (
                        <option key={meal} value={meal}>{meal}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isLoggingMultiple}
                      className="w-full py-1.5 bg-sky-500 hover:bg-sky-450 text-neutral-955 font-extrabold text-xs rounded-xl transition cursor-pointer"
                    >
                      {recipeName.trim() ? 'Guardar y Cerrar' : 'Cerrar Comida'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* Target Automanagement Modal Overlay */}
      {showAdjustTargetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-fadeIn" id="modal-autogestion-targets">
            <button
              onClick={() => setShowAdjustTargetsModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 cursor-pointer"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4">
              <span className="text-xl">⚙️</span>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Autogestor de Objetivos</h3>
                <p className="text-[11px] text-neutral-500">Configura tus propios objetivos calóricos y de macronutrientes.</p>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              try {
                const updated = {
                  calories: userCalories,
                  proteins: userProteins,
                  carbs: userCarbs,
                  fats: userFats
                };
                localStorage.setItem(`nutricount_targets_${user.id_usuario}`, JSON.stringify(updated));
                setHasCustomTargets(true);
                setShowAdjustTargetsModal(false);
              } catch (err) {
                console.error(err);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-450 mb-1">Calorías Diarias Objetivo (kcal)</label>
                <input
                  type="number"
                  required
                  min={500}
                  max={10000}
                  value={userCalories}
                  onChange={(e) => setUserCalories(Number(e.target.value))}
                  className="block w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-xl text-xs text-white font-semibold focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-450 mb-1">Proteína (g)</label>
                  <input
                    type="number"
                    required
                    min={20}
                    max={500}
                    value={userProteins}
                    onChange={(e) => setUserProteins(Number(e.target.value))}
                    className="block w-full px-2 py-2 bg-neutral-950 border border-neutral-850 rounded-xl text-xs text-white font-semibold focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-450 mb-1">Carbos (g)</label>
                  <input
                    type="number"
                    required
                    min={20}
                    max={1000}
                    value={userCarbs}
                    onChange={(e) => setUserCarbs(Number(e.target.value))}
                    className="block w-full px-2 py-2 bg-neutral-950 border border-neutral-850 rounded-xl text-xs text-white font-semibold focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-450 mb-1">Grasas (g)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={300}
                    value={userFats}
                    onChange={(e) => setUserFats(Number(e.target.value))}
                    className="block w-full px-2 py-2 bg-neutral-950 border border-neutral-850 rounded-xl text-xs text-white font-semibold focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 space-y-1">
                <span className="text-[10px] font-bold text-neutral-500 uppercase font-mono block">Distribución de Energía Estimada</span>
                <p className="text-[11.5px] text-neutral-300 font-bold">
                  {Math.round((userProteins * 4) + (userCarbs * 4) + (userFats * 9))} kcal calculadas basadas en macros.
                </p>
                <p className="text-[9.5px] text-neutral-550 italic">
                  * 1g Proteína = 4 kcal | 1g Carbos = 4 kcal | 1g Grasa = 9 kcal
                </p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustTargetsModal(false)}
                  className="flex-1 py-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 text-neutral-400 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs rounded-xl transition cursor-pointer"
                >
                  Guardar Objetivos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                Perderá el plan alimentario asignado por el profesional y sus metas de calorías y macronutrientes se restablecerán a los valores por defecto.
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
