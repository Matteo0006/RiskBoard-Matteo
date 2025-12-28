import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, Shield, TrendingUp, Bell } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password minimo 6 caratteri'),
  fullName: z.string().min(2, 'Nome richiesto').optional(),
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = (isSignUp: boolean) => {
    try {
      authSchema.parse({
        email,
        password,
        fullName: isSignUp ? fullName : undefined,
      });
      setErrors({});
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        e.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({
        variant: "destructive",
        title: "Errore di accesso",
        description: error.message === 'Invalid login credentials' 
          ? 'Credenziali non valide' 
          : error.message,
      });
    } else {
      toast({
        title: "Benvenuto!",
        description: "Accesso effettuato con successo.",
      });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          variant: "destructive",
          title: "Utente esistente",
          description: "Questa email è già registrata. Prova ad accedere.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Errore di registrazione",
          description: error.message,
        });
      }
    } else {
      toast({
        title: "Registrazione completata!",
        description: "Il tuo account è stato creato con successo.",
      });
    }
    setLoading(false);
  };

  const features = [
    { icon: ClipboardCheck, title: "Gestione Obblighi", desc: "Traccia tutte le scadenze" },
    { icon: Shield, title: "Analisi Rischi", desc: "AI-powered insights" },
    { icon: TrendingUp, title: "Dashboard", desc: "Visione d'insieme" },
    { icon: Bell, title: "Promemoria", desc: "Mai più scadenze perse" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary rounded-xl">
              <ClipboardCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">ComplianceTrack</h1>
              <p className="text-slate-400">Enterprise Compliance Platform</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-4">
            La piattaforma di compliance<br />
            <span className="text-primary">intelligente</span> per il tuo business
          </h2>
          
          <p className="text-slate-300 text-lg mb-12 max-w-md">
            Gestisci obblighi, scadenze e rischi con un sistema enterprise-grade 
            potenziato dall'intelligenza artificiale.
          </p>

          <div className="grid grid-cols-2 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 p-4 rounded-lg bg-white/5 backdrop-blur">
                <feature.icon className="h-6 w-6 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-700">
            <p className="text-sm text-slate-500">
              © 2025 Matteo Chiarinotti - RiskBoard. Piattaforma Enterprise.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="p-2 bg-primary rounded-lg">
                <ClipboardCheck className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ComplianceTrack</span>
            </div>
            <CardTitle className="text-2xl text-white">Accedi al tuo account</CardTitle>
            <CardDescription className="text-slate-400">
              Gestisci la compliance della tua azienda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Accedi</TabsTrigger>
                <TabsTrigger value="signup">Registrati</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-slate-200">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="nome@azienda.it"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                    {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-slate-200">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                    {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Accesso in corso...' : 'Accedi'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-slate-200">Nome completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Mario Rossi"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                    {errors.fullName && <p className="text-xs text-red-400">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-slate-200">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="nome@azienda.it"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                    {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-200">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Minimo 6 caratteri"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                    {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Registrazione in corso...' : 'Crea account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-xs text-center text-slate-500">
                Continuando accetti i termini di servizio e la privacy policy.
                <br />Questo è un prototipo dimostrativo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
