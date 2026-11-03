import React, { useState, useEffect } from 'react';
import { apiFetch, ingestasUrl, todayLocal } from '../api';
import { 
  Users, UserPlus, FileText, Calendar, Plus, 
  ChevronRight, ArrowLeft, Check, HelpCircle 
} from 'lucide-react';
import { Usuario, PlanNutricional, RegistroIngesta } from '../types';
import { getMondayOfDate, formatLocalDate, semaforo, Semaforo, SEMAFORO_LABEL, SEMAFORO_THEME } from '../calendario';

// El nutricionista se identifica en la API por el token de sesion: no hace falta pasarle el usuario.
export default function DashboardNutri() {
  const [patients, setPatients] = useState<Usuario[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Usuario | null>(null);
  
  // Link new patient states
  const [linkEmail, setLinkEmail] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  const [showInvitationOption, setShowInvitationOption] = useState(false);

  // New Plan states
  const [calories, setCalories] = useState<number>(2000);
  const [proteins, setProteins] = useState<number>(130);
  const [carbs, setCarbs] = useState<number>(220);
  const [fats, setFats] = useState<number>(65);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [planSuccess, setPlanSuccess] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [showOverlapWarning, setShowOverlapWarning] = useState(false);

  // Modals for unlink (baja)
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [unlinkStatusMessage, setUnlinkStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Patient detail monitoring states
  const [activePlan, setActivePlan] = useState<PlanNutricional | null>(null);
  const [monitoredDate, setMonitoredDate] = useState<string>(todayLocal());
  const [ingestas, setIngestas] = useState<RegistroIngesta[]>([]);
  const [stats, setStats] = useState({ calories: 0, proteins: 0, carbs: 0, fats: 0 });

  // Compliance calendar tracking for the selected patient
  const [weeklyStatus, setWeeklyStatus] = useState<Record<string, { calories: number; target: number }>>({});
  const [carouselWeekStart, setCarouselWeekStart] = useState<Date>(() => getMondayOfDate(new Date()));

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync carousel week start when monitoredDate shifts
  useEffect(() => {
    if (monitoredDate) {
      const parts = monitoredDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        setCarouselWeekStart(getMondayOfDate(d));
      }
    }
  }, [monitoredDate]);

  // Week Slider handlers for nutritionist (4 days on mobile, 7 days on desktop)
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

  const fetchPatientWeeklyCalendarStats = async () => {
    if (!selectedPatient) return;
    try {
      const datesToFetch: string[] = [];
      const monday = new Date(carouselWeekStart);
      const numDays = isMobile ? 4 : 7;
      for (let i = 0; i < numDays; i++) {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        datesToFetch.push(formatLocalDate(d));
      }

      // Ensure monitored date is in list
      if (monitoredDate && !datesToFetch.includes(monitoredDate)) {
        datesToFetch.push(monitoredDate);
      }

      const currentPatientGoal = activePlan ? activePlan.calorias_objetivo : 0;

      const results = await Promise.all(
        datesToFetch.map(async (dStr) => {
          const response = await apiFetch(ingestasUrl(selectedPatient.id_usuario, dStr));
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
            return { date: dStr, calories: Math.round(cal), target: currentPatientGoal };
          }
          return { date: dStr, calories: 0, target: currentPatientGoal };
        })
      );

      const statusMap: Record<string, { calories: number; target: number }> = {};
      results.forEach(res => {
        statusMap[res.date] = {
          calories: res.calories,
          target: res.target
        };
      });

      setWeeklyStatus(statusMap);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientWeeklyCalendarStats();
    }
  }, [selectedPatient, carouselWeekStart, activePlan, monitoredDate, isMobile]);

  // Patients status mapping for the "Semaforos" (Traffic Light indicators)
  const [patientStatus, setPatientStatus] = useState<Record<string, { color: Semaforo, caloriesCount: number, goal: number | null }>>({});

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await apiFetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients);
        // Calculate semaphores for each patient
        data.patients.forEach((pat: Usuario) => {
          fetchPatientSemaphore(pat.id_usuario);
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPatientSemaphore = async (patId: number) => {
    try {
      // Get plan
      const planRes = await apiFetch(`/api/plans?patientId=${patId}`);
      let goal: number | null = null;
      if (planRes.ok) {
        const planData = await planRes.json();
        if (planData.plan) goal = planData.plan.calorias_objetivo;
      }

      // Get today ingestas
      const todayStr = todayLocal();
      const ingRes = await apiFetch(ingestasUrl(patId, todayStr));
      let totalCal = 0;
      if (ingRes.ok) {
        const ingData = await ingRes.json();
        const items = ingData.ingestas || [];
        totalCal = items.reduce((acc: number, cur: any) => {
          const m = cur.alimento;
          if (m) {
            return acc + (m.calorias * (cur.cantidad / m.medida_cantidad));
          }
          return acc;
        }, 0);
      }

      const color = semaforo(goal ? (totalCal / goal) * 100 : null);

      setPatientStatus(prev => ({
        ...prev,
        [patId]: { color, caloriesCount: Math.round(totalCal), goal }
      }));

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientDetails(selectedPatient.id_usuario);
    }
  }, [selectedPatient, monitoredDate]);

  const fetchPatientDetails = async (patId: string) => {
    try {
      // Load plan
      const planRes = await apiFetch(`/api/plans?patientId=${patId}`);
      if (planRes.ok) {
        const data = await planRes.json();
        setActivePlan(data.plan);
        if (data.plan) {
          setCalories(data.plan.calorias_objetivo);
          setProteins(data.plan.proteinas_objetivo);
          setCarbs(data.plan.carbohidratos_objetivo);
          setFats(data.plan.grasas_objetivo);
        }
      }

      // Load ingestas
      const ingRes = await apiFetch(ingestasUrl(patId, monitoredDate));
      if (ingRes.ok) {
        const data = await ingRes.json();
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

        setStats({
          calories: Math.round(cal),
          proteins: Number(pr.toFixed(1)),
          carbs: Number(cb.toFixed(1)),
          fats: Number(ft.toFixed(1))
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLinkNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    setLinkSuccess(null);
    setShowInvitationOption(false);

    if (!linkEmail) return;

    try {
      const response = await apiFetch('/api/patients/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: linkEmail.trim() })
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error && data.error.includes('no está registrado')) {
          setShowInvitationOption(true);
        }
        throw new Error(data.error || 'Error al vincular');
      }

      setLinkSuccess(`¡Vinculación exitosa con ${data.patient.persona.nombre} ${data.patient.persona.apellido}!`);
      setLinkEmail('');
      fetchPatients();
    } catch (err: any) {
      setLinkError(err.message);
    }
  };

  const handleUnlinkPatient = async (patientId: string) => {
    try {
      const response = await apiFetch('/api/patients/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnlinkStatusMessage({
            type: 'success',
            text: '¡Dada de baja realizada de forma exitosa! Se han revocado los accesos de seguimiento y cancelado el plan nutricional activo de este paciente.'
          });
          setTimeout(() => {
            setUnlinkStatusMessage(null);
            setSelectedPatient(null);
            fetchPatients();
          }, 3500);
        } else {
          setUnlinkStatusMessage({
            type: 'error',
            text: data.error || 'No se pudo procesar la baja del paciente en el servidor.'
          });
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setUnlinkStatusMessage({
          type: 'error',
          text: `No se pudo dar de baja al paciente: ${errData.error || response.statusText}`
        });
      }
    } catch (e: any) {
      console.error(e);
      setUnlinkStatusMessage({
        type: 'error',
          text: `Error de red al intentar dar de baja al paciente: ${e.message || e}`
      });
    } finally {
      setShowUnlinkConfirm(false);
    }
  };

  const handleSavePlan = async (forceOverwrite = false) => {
    if (!selectedPatient) return;
    setPlanSuccess(null);
    setPlanError(null);

    if (Number(calories) <= 0) {
      setPlanError('La cantidad de calorías del plan debe ser mayor a 0 kcal.');
      return;
    }

    if (Number(proteins) <= 0 || Number(carbs) <= 0 || Number(fats) <= 0) {
      setPlanError('Ningún macronutriente (proteínas, carbohidratos, grasas) puede ser 0g.');
      return;
    }

    if (!startDate || !endDate) {
      setPlanError('Debe definir fechas de inicio y fin para el plan');
      return;
    }

    if (activePlan && !forceOverwrite) {
      // Check if dates overlap and alert (alternative path warning)
      setShowOverlapWarning(true);
      return;
    }

    setShowOverlapWarning(false);

    try {
      const response = await apiFetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id_usuario,
          planDetails: {
            calorias_objetivo: Number(calories),
            proteinas_objetivo: Number(proteins),
            carbohidratos_objetivo: Number(carbs),
            grasas_objetivo: Number(fats),
            fecha_inicio: startDate,
            fecha_fin: endDate
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar el plan');
      }

      setPlanSuccess('Plan nutricional guardado. El paciente lo verá en su panel la próxima vez que lo abra.');
      setActivePlan(data.plan);
      fetchPatientSemaphore(selectedPatient.id_usuario);
    } catch (err: any) {
      setPlanError(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="nutri-dashboard">
      {!selectedPatient ? (
        /* ================== ROOT PATIENT OVERVIEW ================== */
        <div className="space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
                <Users className="h-6 w-6 text-emerald-400" />
                <span>Mis Pacientes Vinculados</span>
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                Monitorea el consumo diario y prescribe planes alimenticios personalizados.
              </p>
            </div>

            {/* Quick stats totals */}
            <div className="flex space-x-2">
              <span className="bg-neutral-900 text-neutral-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-neutral-800 flex items-center">
                Total: {patients.length} {patients.length === 1 ? 'Paciente' : 'Pacientes'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Add / Link Patient */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 shadow-lg">
                <div className="flex items-center space-x-2.5 mb-4">
                  <div className="p-2 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-800/20">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Vincular Paciente
                  </h3>
                </div>

                <form onSubmit={handleLinkNewPatient} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                      Buscar por Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={linkEmail}
                      onChange={(e) => setLinkEmail(e.target.value)}
                      placeholder="agustin@nutricount.com"
                      className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all text-white placeholder-neutral-600"
                      id="input-link-email"
                    />
                  </div>

                  {linkError && (
                    <div className="p-3.5 bg-rose-955/30 border border-rose-900/40 text-rose-200 rounded-xl text-xs" id="link-error-alert">
                      <p className="font-semibold">{linkError}</p>
                      {showInvitationOption && (
                        <a
                          href={`mailto:${encodeURIComponent(linkEmail.trim())}?subject=${encodeURIComponent('Invitación a Nutri Count')}&body=${encodeURIComponent(`Hola! Te invito a registrarte en Nutri Count para que pueda hacer el seguimiento de tu plan nutricional. Una vez creada tu cuenta con este correo, avisame y te vinculo a mi cartera de pacientes.\n\n${window.location.origin}`)}`}
                          onClick={() => setShowInvitationOption(false)}
                          className="mt-2 block w-full py-2 bg-emerald-500 hover:bg-emerald-400 font-bold text-neutral-950 text-xs rounded-lg text-center transition-all"
                        >
                          Invitar por correo (abre tu cliente de mail)
                        </a>
                      )}
                    </div>
                  )}

                  {linkSuccess && (
                    <div className="p-3.5 bg-emerald-950/30 border border-emerald-900/40 text-emerald-200 rounded-xl text-xs font-medium">
                      {linkSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 font-bold text-neutral-950 text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-1"
                    id="btn-link-submit"
                  >
                    <span>Agregar a Cartera</span>
                  </button>
                </form>
              </div>

              {/* Informative guidelines card */}
              <div className="bg-neutral-900/20 p-6 rounded-2xl border border-neutral-800">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">Código de Colores de Control</h4>
                <p className="text-xs text-neutral-500 mb-4 font-normal">El sistema utiliza alarmas visuales para informarle si el paciente cumplió su plan calórico diario:</p>
                <div className="space-y-3 text-xs text-neutral-400">
                  {(['verde', 'amarillo', 'rojo', 'gris'] as const).map(s => (
                    <div key={s} className="flex items-center space-x-2">
                      <span className={`h-3 w-3 rounded-full inline-block ${SEMAFORO_THEME[s].dot}`}></span>
                      <span><strong className="capitalize">{s}</strong>: {SEMAFORO_LABEL[s]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Patient list (Semaforos) */}
            <div className="lg:col-span-2 bg-neutral-900/50 rounded-2xl border border-neutral-800 shadow-md p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center space-x-2">
                <span>Directorio Clínico de Seguimiento</span>
              </h3>

              {patients.length === 0 ? (
                <div className="text-center py-16 bg-neutral-950 rounded-2xl border border-dashed border-neutral-800">
                  <Users className="h-10 w-10 text-neutral-600 mx-auto opacity-40 mb-3" />
                  <p className="text-neutral-400 font-semibold text-sm">No tienes pacientes vinculados aún</p>
                  <p className="text-xs text-neutral-600 mt-1">Utiliza el panel lateral para vincular tu primer paciente.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/60">
                  {patients.map((pat) => {
                    const status = patientStatus[pat.id_usuario] || { color: 'gris' as Semaforo, caloriesCount: 0, goal: null };
                    
                    return (
                      <div 
                        key={pat.id_usuario}
                        className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 hover:bg-neutral-950/40 px-4 -mx-4 rounded-xl transition-all cursor-pointer group"
                        onClick={() => setSelectedPatient(pat)}
                        id={`patient-card-${pat.id_usuario}`}
                      >
                        <div className="flex items-center space-x-3.5">
                          {/* Traffic light indicator status */}
                          <div className={`h-4 w-4 rounded-full ring-4 ring-neutral-900/50 ${SEMAFORO_THEME[status.color].dot}`} title={SEMAFORO_LABEL[status.color]} />

                          <div>
                            <p className="font-bold text-neutral-200 text-sm sm:text-base group-hover:text-emerald-400 transition-colors">
                              {pat.persona?.nombre} {pat.persona?.apellido}
                            </p>
                            <span className="text-xs text-neutral-500 font-semibold">{pat.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                          <div className="text-right mr-2">
                            <span className="text-[10px] font-bold text-neutral-500 block uppercase tracking-wider">Metas Hoy</span>
                            <span className="text-xs font-semibold text-neutral-300 block">
                              {status.goal ? `${status.caloriesCount} / ${status.goal} kcal` : 'Sin plan vigente'}
                            </span>
                          </div>
                          
                          <button
                            className="bg-neutral-950 border border-neutral-800 text-neutral-400 p-2 rounded-lg hover:bg-neutral-900 hover:text-emerald-400 transition"
                            title="Gestionar Paciente"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        /* ================== PATIENT MANAGEMENT & PRESCRIBE PLAN ================== */
        <div className="space-y-8">
          
          {/* Top Back Action */}
          <div>
            <button
              onClick={() => { setSelectedPatient(null); setPlanSuccess(null); setPlanError(null); }}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-neutral-450 hover:text-white bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 px-3 py-1.5 rounded-lg transition animate-fade"
              id="btn-back-dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a Pacientes</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-800 pb-5 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-950/30 px-2.5 py-0.5 rounded-full inline-block tracking-wide">Gestionando Tratamiento</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
                Tratamiento Nutricional: {selectedPatient.persona?.nombre} {selectedPatient.persona?.apellido}
              </h1>
              <p className="text-xs text-neutral-500 mt-1">Correo: {selectedPatient.email}</p>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => setShowUnlinkConfirm(true)}
                className="px-4 py-2.5 bg-rose-955/40 text-rose-450 hover:bg-rose-900/40 border border-rose-500/30 rounded-xl text-xs font-bold tracking-tight transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
              >
                <span>⚠️</span>
                <span>Dar de Baja Paciente</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUMN 1 (5/12 widths): Create / Modify plan */}
            <div className="lg:col-span-5 bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 shadow-md h-fit">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <span>Plan Nutricional</span>
              </h3>

              {activePlan ? (
                <div className="mb-6 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-400 mb-1 flex items-center space-x-1">
                    <Check className="h-3 w-3" />
                    <span>Plan Actual Vigente</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                    <div>
                      <p className="text-neutral-500">Calorías:</p>
                      <p className="text-neutral-200 font-bold">{activePlan.calorias_objetivo} kcal</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Proteínas:</p>
                      <p className="text-neutral-200 font-bold">{activePlan.proteinas_objetivo} g</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Carbohidratos:</p>
                      <p className="text-neutral-200 font-bold">{activePlan.carbohidratos_objetivo} g</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Grasas:</p>
                      <p className="text-neutral-200 font-bold">{activePlan.grasas_objetivo} g</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-neutral-800 text-[10px] text-neutral-550 flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-emerald-455" />
                    <span>Vigencia: {activePlan.fecha_inicio} al {activePlan.fecha_fin}</span>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-amber-950/30 border border-amber-900/30 text-amber-200 rounded-xl text-xs text-left">
                  Este paciente no tiene ningún plan activo registrado. Defina uno a continuación.
                </div>
              )}

              {/* Edit Form */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Definir Nuevas Metas</h4>
                
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1">
                    Calorías Totales (kcal)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="block w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition-all text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1">
                      Proteínas (g)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={proteins}
                      onChange={(e) => setProteins(Number(e.target.value))}
                      className="block w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition-all text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={carbs}
                      onChange={(e) => setCarbs(Number(e.target.value))}
                      className="block w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition-all text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1">
                      Grasas (g)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={fats}
                      onChange={(e) => setFats(Number(e.target.value))}
                      className="block w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition-all text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs transition-all text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1">
                      Fecha de Fin
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs transition-all text-white"
                    />
                  </div>
                </div>

                {planError && (
                  <div className="p-3 bg-rose-955/30 border border-rose-900/40 rounded-xl text-xs text-rose-200">
                    {planError}
                  </div>
                )}

                {planSuccess && (
                  <div className="p-3 bg-emerald-955/30 border border-emerald-900/40 rounded-xl text-xs text-emerald-200 font-medium">
                    {planSuccess}
                  </div>
                )}

                {showOverlapWarning && (
                  <div className="p-4 bg-amber-955/30 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-200 space-y-2">
                    <p className="font-bold">¿Desea dar de baja el plan anterior y reemplazarlo por este?</p>
                    <p className="text-neutral-400">Se detectó un plan nutricional ya activo para el paciente durante este intervalo de fechas de vigencia.</p>
                    <div className="flex space-x-2 pt-1">
                      <button
                        onClick={() => handleSavePlan(true)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 font-bold text-white text-[10px] rounded"
                      >
                        Sí, Reemplazar plan
                      </button>
                      <button
                        onClick={() => setShowOverlapWarning(false)}
                        className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 font-bold text-neutral-350 text-[10px] rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {!showOverlapWarning && (
                  <button
                    onClick={() => handleSavePlan(false)}
                    className="w-full mt-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 font-bold text-neutral-950 text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Asignar Plan Nutricional</span>
                  </button>
                )}
              </div>
            </div>

            {/* COLUMN 2 (7/12 widths): Monitoring logs details */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Date controller */}
              <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historial de Ingestas</h3>
                  <p className="text-xs text-neutral-500 mt-1">Navega para auditar la ingesta diaria del paciente.</p>
                </div>
                <div className="relative rounded-xl shadow-sm w-full sm:w-auto">
                  <input
                    type="date"
                    value={monitoredDate}
                    onChange={(e) => setMonitoredDate(e.target.value)}
                    className="block w-full sm:w-auto px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition text-white"
                  />
                </div>
              </div>

              {/* Interactive Compliance Weekly Calendar Tracker */}
              <div className="bg-neutral-900/40 p-5 rounded-2xl border border-neutral-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 space-y-2 sm:space-y-0 text-center sm:text-left animate-fadeIn">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider font-mono block">
                      Seguimiento de Cumplimiento Semanal ({getFormattedWeekRange()})
                    </span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Audita el consumo calórico diario. Haz clic en un día para ver su desglose.
                    </p>
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

                  <div className="flex-grow grid grid-cols-4 sm:grid-cols-7 gap-1 sm:gap-2.5">
                    {(() => {
                      const daysToRender: Date[] = [];
                      const startStr = new Date(carouselWeekStart.getFullYear(), carouselWeekStart.getMonth(), carouselWeekStart.getDate());
                      const numDays = isMobile ? 4 : 7;
                      for (let i = 0; i < numDays; i++) {
                        const d = new Date(startStr.getFullYear(), startStr.getMonth(), startStr.getDate() + i);
                        daysToRender.push(d);
                      }

                      const patientGoal = activePlan ? activePlan.calorias_objetivo : 0;

                      return daysToRender.map((dObj) => {
                        const dStr = formatLocalDate(dObj);
                        const statsData = weeklyStatus[dStr] || { calories: 0, target: patientGoal };
                        const isSelected = dStr === monitoredDate;

                        const dayCalories = statsData.calories;
                        const pct = patientGoal > 0 ? Math.round((dayCalories / patientGoal) * 100) : 0;

                        const calTheme = SEMAFORO_THEME[semaforo(patientGoal > 0 ? pct : null)];
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
                            onClick={() => setMonitoredDate(dStr)}
                            className={`flex flex-col items-center py-2 rounded-xl border transition-all cursor-pointer relative ${bgClasses} ${
                              isSelected ? 'ring-2 ring-emerald-500 scale-[1.04] shadow-md z-10 font-bold bg-neutral-900/70 border-emerald-500/80 text-white' : ''
                            }`}
                            title={`${dStr}: ${dayCalories} kcal${patientGoal > 0 ? ` (${pct}%)` : ''}`}
                          >
                            <span className="text-[9px] uppercase font-bold tracking-wide opacity-75 mb-0.5">{label}</span>
                            <span className="text-xs font-black tracking-tight">{dayNum}</span>
                            {dayCalories > 0 ? (
                              <span className="text-[8px] font-mono font-black mt-1">
                                {patientGoal > 0 ? `${pct}%` : `${dayCalories} kcal`}
                              </span>
                            ) : (
                              <span className="text-[8px] text-neutral-655 mt-1 font-bold">-</span>
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

              {/* Progress Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-neutral-900/30 p-4 rounded-xl border border-neutral-850 text-center">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase">Calorías</p>
                  <p className="text-lg font-bold text-white mt-1">{stats.calories} kcal</p>
                  <p className="text-[9px] text-neutral-500 mt-0.5">{activePlan ? `Meta: ${activePlan.calorias_objetivo} kcal` : 'Sin plan vigente'}</p>
                </div>
                <div className="bg-neutral-900/30 p-4 rounded-xl border border-neutral-850 text-center">
                  <p className="text-[10px] font-bold text-emerald-450 uppercase">Proteínas</p>
                  <p className="text-lg font-bold text-white mt-1">{stats.proteins} g</p>
                  <p className="text-[9px] text-neutral-500 mt-0.5">{activePlan ? `Meta: ${activePlan.proteinas_objetivo} g` : 'Sin plan vigente'}</p>
                </div>
                <div className="bg-neutral-900/30 p-4 rounded-xl border border-neutral-850 text-center">
                  <p className="text-[10px] font-bold text-sky-400 uppercase">Carbohidratos</p>
                  <p className="text-lg font-bold text-white mt-1">{stats.carbs} g</p>
                  <p className="text-[9px] text-neutral-500 mt-0.5">{activePlan ? `Meta: ${activePlan.carbohidratos_objetivo} g` : 'Sin plan vigente'}</p>
                </div>
                <div className="bg-neutral-900/30 p-4 rounded-xl border border-neutral-850 text-center">
                  <p className="text-[10px] font-bold text-amber-400 uppercase">Grasas</p>
                  <p className="text-lg font-bold text-white mt-1">{stats.fats} g</p>
                  <p className="text-[9px] text-neutral-500 mt-0.5">{activePlan ? `Meta: ${activePlan.grasas_objetivo} g` : 'Sin plan vigente'}</p>
                </div>
              </div>

              {/* Ingesta records list */}
              <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 shadow-md">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-neutral-800">
                  Desglose de Alimentación del Día
                </h3>

                {ingestas.length === 0 ? (
                  <div className="text-center py-12 bg-neutral-950 rounded-2xl border border-neutral-800/60">
                    <HelpCircle className="h-8 w-8 text-neutral-650 mx-auto opacity-30 mb-2" />
                    <p className="text-xs text-neutral-500 font-semibold">El paciente no registró comidas para esta fecha</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ingestas.map((ing) => {
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
                          className="flex items-center justify-between p-3.5 bg-neutral-950 rounded-xl hover:bg-neutral-900/60 transition border border-neutral-800"
                        >
                          <div>
                            <span className="text-[10px] font-bold uppercase bg-neutral-900 text-neutral-450 border border-neutral-800/80 px-2.5 py-0.5 rounded-full inline-block">
                              {ing.tipo_comida}
                            </span>
                            <p className="font-bold text-neutral-200 text-xs sm:text-sm mt-1">
                              {al.nombre_alimento}
                            </p>
                            <p className="text-[10.5px] text-neutral-500">
                              Cantidad ingerida: {ing.cantidad} {al.medida_unidad || 'g'}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-400 block">{calG} kcal</span>
                            <span className="text-[9.5px] text-neutral-500 font-bold block">
                              P: {prG}g | C: {cbG}g | G: {ftG}g
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ⚠️ MODAL DE CONFIRMACIÓN DE BAJA */}
      {showUnlinkConfirm && selectedPatient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-fade">
            <div className="text-center">
              <span className="text-4xl block mb-4">⚠️</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Confirmar Baja de Paciente</h2>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                ¿Está seguro de que desea dar de baja a <strong className="text-rose-450">{selectedPatient.persona?.nombre} {selectedPatient.persona?.apellido}</strong>?
                <br />
                Esta acción revocará de inmediato los accesos de seguimiento y dará por cancelado su plan nutricional activo.
              </p>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleUnlinkPatient(selectedPatient.id_usuario)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Sí, Dar de Baja Paciente
              </button>
              <button
                onClick={() => setShowUnlinkConfirm(false)}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Conservar Paciente
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
