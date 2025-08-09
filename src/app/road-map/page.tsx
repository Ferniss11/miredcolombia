
import { CheckCircle, Clock, Loader, PauseCircle, Rocket, Layers, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardHeader } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Hoja de Ruta del Proyecto | Mi Red Colombia',
  description: 'Sigue el progreso y la evolución de nuestra plataforma, desde la refactorización del backend hasta las nuevas funcionalidades.',
}

// --- Data Fetching and Parsing ---
type Step = {
  text: string;
  isCompleted: boolean;
};

type PhaseStatus = 'Completada' | 'En Pausa' | 'En Progreso' | 'Próximos Pasos';

type Phase = {
  title: string;
  status: PhaseStatus;
  description: string;
  steps: Step[];
  estimatedHours: number;
};

async function parseRoadmap(): Promise<Phase[]> {
  const filePath = path.join(process.cwd(), 'ai/local-develop/backend-refactor-roadmap.md');
  const content = await fs.readFile(filePath, 'utf-8');
  
  const phases: Phase[] = [];
  const lines = content.split('\n');

  let currentPhase: Phase | null = null;

  const hoursMap: { [key: string]: number } = {
      'Fase 0': 12,
      'Fase 1': 20,
      'Fase 2': 18,
      'Fase 3': 16,
      'Fase 4': 14,
      'Fase 5': 24,
      'Fase 6': 10,
      'Fase 7': 8,  // Refactor Platform
      'Fase 8': 30, // Vectorization
      'Fase 9': 40, // Real Estate Portal
  };

  for (const line of lines) {
    const phaseMatch = line.match(/^## \*\*(Fase \d+): (.*?)\s?\((.*?)\)\*\*/);
    if (phaseMatch) {
      if (currentPhase) {
        phases.push(currentPhase);
      }
      const phaseKey = `Fase ${phaseMatch[1].match(/\d+/)?.[0]}`;
      const titleText = phaseMatch[2].trim();
      const statusText = phaseMatch[3].trim();
      
      let status: PhaseStatus = 'En Progreso';
      if (statusText === '✓ Completada') status = 'Completada';
      else if (statusText === 'Pausado') status = 'En Pausa';
      else if (statusText === 'En Progreso') status = 'En Progreso';
      else if (statusText === 'Próximos Pasos') status = 'Próximos Pasos';

      currentPhase = {
        title: `${phaseKey}: ${titleText}`,
        status,
        description: '',
        steps: [],
        estimatedHours: hoursMap[phaseKey] || 8,
      };
      continue;
    }

    if (currentPhase) {
        const stepMatch = line.match(/^\s*\*   \*\*(.*?):\*\* (.*?)(\(✓ Completado\))?$/);
        if (stepMatch) {
            currentPhase.steps.push({
                text: `${stepMatch[1]}: ${stepMatch[2]}`,
                isCompleted: !!stepMatch[3],
            });
        } else if (line.startsWith('*   **Objetivo:**')) {
            currentPhase.description = line.replace('*   **Objetivo:**', '').trim();
        }
    }
  }

  if (currentPhase) {
    phases.push(currentPhase);
  }

  return phases;
}


// --- Components ---
const StatusBadge = ({ status }: { status: Phase['status'] }) => {
  if (status === 'Completada') {
    return <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100"><CheckCircle className="h-4 w-4 mr-2"/> {status}</Badge>;
  }
  if (status === 'En Pausa') {
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100"><PauseCircle className="h-4 w-4 mr-2"/> {status}</Badge>;
  }
  if (status === 'En Progreso') {
    return <Badge variant="outline" className="text-blue-600 border-blue-400"><Loader className="h-4 w-4 mr-2 animate-spin"/> {status}</Badge>;
  }
  return <Badge variant="secondary"><Rocket className="h-4 w-4 mr-2"/> {status}</Badge>;
};

const getIconForPhase = (title: string): React.ReactNode => {
    if (title.toLowerCase().includes('plataforma')) return <Layers className="w-5 h-5"/>;
    if (title.toLowerCase().includes('vectorización')) return <Rocket className="w-5 h-5"/>;
    if (title.toLowerCase().includes('inmobiliario')) return <Home className="w-5 h-5"/>;
    return <span className="font-bold">{title.match(/\d+/)?.[0]}</span>;
}

const PhaseCard = ({ phase, index }: { phase: Phase, index: number }) => (
  <div className="relative pl-8 sm:pl-12">
    {/* Timeline Dot */}
    <div className="absolute left-0 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
      {getIconForPhase(phase.title)}
    </div>
    
    <Collapsible>
      <Card className="ml-4 overflow-hidden">
        <CollapsibleTrigger className="w-full">
            <div className="p-6 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-xl font-bold font-headline">{phase.title}</h3>
                    <StatusBadge status={phase.status} />
                </div>
                <p className="mt-2 text-muted-foreground">{phase.description}</p>
                 <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Estimación: {phase.estimatedHours} horas</span>
                </div>
            </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
            <div className="border-t bg-secondary/30 dark:bg-card/50">
                <ul className="divide-y">
                    {phase.steps.map((step, i) => (
                        <li key={i} className="px-6 py-3 flex items-start gap-4">
                            <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${step.isCompleted ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                            <span className={`text-sm ${step.isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {step.text}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  </div>
);


// --- Page Component ---
export default async function RoadmapPage() {
  const roadmapPhases = await parseRoadmap();

  return (
    <div className="bg-secondary dark:bg-card">
        <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-20 lg:py-24">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline">Hoja de Ruta del Proyecto</h1>
            <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
            Un vistazo transparente a nuestro proceso de desarrollo, desde la arquitectura hasta la implementación de funcionalidades.
            </p>
        </div>

        <div className="relative space-y-12">
            {/* Timeline Line */}
            <div className="absolute left-4 top-4 h-full w-0.5 bg-border -translate-x-1/2"></div>
            
            {roadmapPhases.map((phase, index) => (
                <PhaseCard key={index} phase={phase} index={index} />
            ))}
        </div>
        </div>
    </div>
  );
}
