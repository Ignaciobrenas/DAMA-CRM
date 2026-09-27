import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Globe,
  Palette,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Upload,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Check,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';
import { soundService } from '../services/sound';

export const Onboarding: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const toast = useToast();
  const [step, setStep] = useState<number>(1);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [tokenError, setTokenError] = useState('');
  const [invitationData, setInvitationData] = useState<any>(null);

  // Step 1: Tenant Slug
  const [slug, setSlug] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugMessage, setSlugMessage] = useState('');

  // Step 2: Company Info
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [industry, setIndustry] = useState('Tecnología y Software');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('España');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Step 3: Branding
  const [primaryColor, setPrimaryColor] = useState('#072053');
  const [secondaryColor, setSecondaryColor] = useState('#2563EB');
  const [logoUrl, setLogoUrl] = useState('');

  // Step 4: Admin & Team
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitedMembers, setInvitedMembers] = useState<Array<{ name: string; email: string; role: string }>>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('USER');

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse token from URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setTokenError('No se ha proporcionado un token de invitación válido.');
      setIsLoadingToken(false);
      return;
    }

    async function verifyToken() {
      try {
        const res = await apiRequest(`/onboarding/verify-token?token=${token}`);
        if (res.success && res.data) {
          setInvitationData(res.data);
          setEmail(res.data.email || '');
          if (res.data.tenantSlug) setSlug(res.data.tenantSlug);
          if (res.data.companyName) setCompanyName(res.data.companyName);
        } else {
          setTokenError(res.message || 'El enlace de invitación no es válido o ha expirado.');
        }
      } catch (err: any) {
        setTokenError(err.message || 'Error de conexión con el servidor');
      } finally {
        setIsLoadingToken(false);
      }
    }

    verifyToken();
  }, []);

  // Check slug availability with debounce
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      setSlugMessage('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const res = await apiRequest(`/onboarding/check-slug?slug=${encodeURIComponent(slug)}`);
        if (res.success) {
          setSlugAvailable(res.available);
          setSlugMessage(res.message || '');
        }
      } catch {
        setSlugAvailable(null);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleAddMember = () => {
    if (!newMemberEmail || !newMemberEmail.includes('@')) {
      toast.error('Email inválido', 'Introduce un correo electrónico válido para invitar');
      return;
    }
    setInvitedMembers((prev) => [
      ...prev,
      { name: newMemberName || 'Colaborador', email: newMemberEmail.trim(), role: newMemberRole },
    ]);
    setNewMemberName('');
    setNewMemberEmail('');
    soundService.play('action');
  };

  const handleRemoveMember = (index: number) => {
    setInvitedMembers((prev) => prev.filter((_, i) => i !== index));
    soundService.play('action');
  };

  const handleCompleteSetup = async () => {
    if (password !== confirmPassword) {
      toast.error('Contraseñas no coinciden', 'Por favor verifica la contraseña');
      return;
    }

    if (!password || password.length < 6) {
      toast.error('Contraseña débil', 'La contraseña debe tener un mínimo de 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    soundService.play('action');

    try {
      const res = await apiRequest('/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({
          token: invitationData?.token,
          slug,
          company: {
            name: companyName,
            taxId,
            industry,
            address,
            city,
            country,
            phone,
            email,
            website,
          },
          branding: {
            companyName,
            logoUrl,
            primaryColor,
            secondaryColor,
          },
          adminUser: {
            name: adminName || 'Administrador',
            password,
          },
          invitedMembers,
        }),
      });

      if (res.success && res.token) {
        soundService.play('success');
        localStorage.setItem('dama_token', res.token);
        localStorage.setItem('dama_user', JSON.stringify(res.user));
        toast.success('¡Entorno Creado!', `Bienvenido a DAMA CRM, ${companyName}`);
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          } else {
            window.location.href = '/';
          }
        }, 1200);
      } else {
        soundService.play('alert');
        toast.error('Error al configurar', res.message || 'No se pudo completar la configuración');
      }
    } catch (err: any) {
      toast.error('Error de servidor', err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingToken) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Validando enlace de invitación y credenciales...
          </p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Enlace de Activación No Válido</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">{tokenError}</p>
          <button
            onClick={() => (window.location.href = '/login')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
          >
            Ir al Inicio de Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Configuración Inicial de Empresa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Bienvenido a DAMA CRM
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Configura en pocos pasos el espacio de trabajo exclusivo para tu organización y equipo.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { n: 1, label: 'Identificador' },
            { n: 2, label: 'Empresa' },
            { n: 3, label: 'Branding' },
            { n: 4, label: 'Equipo' },
            { n: 5, label: 'Activación' },
          ].map((st) => (
            <div key={st.n} className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                  step === st.n
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : step > st.n
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {step > st.n ? <Check className="w-4 h-4" /> : st.n}
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
                {st.label}
              </span>
            </div>
          ))}
        </div>

        {/* Main Card Wizard */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
          {/* STEP 1: SLUG */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>1. Identificador de Tenant y Subdominio</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Elige un nombre único y corto para identificar tu espacio de trabajo en la nube.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Identificador / Slug de la Empresa
                </label>
                <div className="flex rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:border-blue-600 shadow-2xs">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="mi-empresa"
                    className="flex-1 px-4 py-2.5 bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  />
                  <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-500 border-l border-slate-300 dark:border-slate-700 flex items-center">
                    .damacrm.com
                  </span>
                </div>

                {isCheckingSlug && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Comprobando disponibilidad...
                  </p>
                )}

                {!isCheckingSlug && slugAvailable !== null && (
                  <p
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      slugAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {slugAvailable ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {slugMessage}
                  </p>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!slug || !slugAvailable}
                  onClick={() => {
                    soundService.play('action');
                    setStep(2);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COMPANY DETAILS */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>2. Información General de la Empresa</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Introduce los datos fiscales y de contacto de tu organización.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Razón Social / Nombre *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. Acme Soluciones S.L."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">NIF / CIF / Tax ID</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="B12345678"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sector de Actividad</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="Tecnología y Software">Tecnología y Software</option>
                    <option value="Consultoría y Servicios">Consultoría y Servicios</option>
                    <option value="Comercio y Distribución">Comercio y Distribución</option>
                    <option value="Manufactura e Industria">Manufactura e Industria</option>
                    <option value="Construcción e Inmobiliaria">Construcción e Inmobiliaria</option>
                    <option value="Salud y Bienestar">Salud y Bienestar</option>
                    <option value="Hostelería y Turismo">Hostelería y Turismo</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Teléfono Corporativo</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 912 345 678"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Dirección</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle Principal 123"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ciudad y País</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Madrid"
                      className="w-1/2 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="España"
                      className="w-1/2 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
                <button
                  type="button"
                  disabled={!companyName}
                  onClick={() => {
                    soundService.play('action');
                    setStep(3);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span>Siguiente: Branding</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: BRANDING */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-600" />
                  <span>3. Identidad Visual y Colores de Marca</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Personaliza los colores primarios y el logotipo que se mostrarán en la interfaz y en los PDFs oficiales.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Color Primario Corporativo</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-32 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Color Secundario / Acento</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-32 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">URL del Logotipo (PNG/SVG)</label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://miempresa.com/logo.png"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Vista Previa de Marca
                  </span>
                  <div
                    className="p-4 rounded-xl text-white shadow-md flex items-center justify-between"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="flex items-center gap-2.5">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-md bg-white/20 p-1" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
                          {companyName ? companyName[0].toUpperCase() : 'D'}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-xs">{companyName || 'Nombre de Empresa'}</div>
                        <div className="text-[10px] opacity-80 font-mono">{slug}.damacrm.com</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-xs"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      Botón
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundService.play('action');
                    setStep(4);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
                >
                  <span>Siguiente: Usuario y Equipo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ADMIN & TEAM */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>4. Cuenta de Administrador e Invitación de Equipo</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Define tu clave de acceso como administrador y añade opcionalmente a tus primeros colaboradores.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tu Nombre Completo *</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Ej. Ignacio Brena"
                        className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Administrador (Fijo)</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contraseña *</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Repetir Contraseña *</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                        className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Invite initial team members */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Invitar Colaboradores (Opcional)
                    </span>
                    <span className="text-[11px] text-slate-400">{invitedMembers.length} añadidos</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Nombre del compañero"
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                    />
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="email@empresa.com"
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                    />
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="USER">Comercial / Ventas</option>
                      <option value="USER">Técnico / Scrum</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </button>
                  </div>

                  {invitedMembers.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                      {invitedMembers.map((m, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{m.name}</span>
                            <span className="text-slate-400 font-mono text-[11px] truncate">({m.email})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
                <button
                  type="button"
                  disabled={!adminName || !password || password !== confirmPassword}
                  onClick={() => {
                    soundService.play('action');
                    setStep(5);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span>Revisar y Activar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & COMPLETE */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>5. Resumen de Activación del Espacio de Trabajo</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verifica los detalles antes de inicializar la base de datos y tu panel de control.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Identificador Tenant:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{slug}.damacrm.com</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Empresa:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{companyName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Administrador:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {adminName} ({email})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Sector:</span>
                  <span className="text-slate-700 dark:text-slate-300">{industry}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Módulos Inicializados:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    CRM, Ventas, Facturación, Inventario, Scrum, Empleados, BI
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep(4)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCompleteSetup}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creando tu Entorno...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Finalizar e Iniciar DAMA CRM</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
