
import { CheckCircle, Layers, Milestone, Bot, Search, BrainCircuit } from 'lucide-react';
import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Hoja de Ruta: Refactorización IA | Mi Red Colombia',
  description: 'Plan de acción y arquitectura para la reconstrucción del sistema de agentes de IA "Valeria".',
  robots: {
    index: false,
    follow: false,
  },
}

type Step = {
  text: string;
};

type Phase = {
  title: string;
  objective: string;
  steps: Step[];
};

async function parseRoadmap(): Promise<{ objective: string; phases: Phase[] }> {
  const filePath = path.join(process.cwd(), 'ai/local-develop/ia-refactor-roadmap.md');
  const content = await fs.readFile(filePath, 'utf-8');
  
  const phases: Phase[] = [];
  const sections = content.split('---');
  
  const generalObjectiveMatch = sections[0].match(/## Objetivo General\n\n(.*?)(?=\n\n##|$)/s);
  const generalObjective = generalObjectiveMatch ? generalObjectiveMatch[1].trim().replace(/\*/g, '') : "Definir y ejecutar la refactorización del sistema de IA.";

  const phaseContent = sections.length > 2 ? sections.slice(2).join('---') : '';
  const phaseBlocks = phaseContent.split(/\n(?=### Paso \d+:)/).filter(block => block.trim() !== '');

  for (const block of phaseBlocks) {
    const lines = block.trim().split('\n');
    const titleMatch = lines[0].match(/^### (Paso \d+:.+)/);
    if (!titleMatch) continue;

    const phase: Phase = {
      title: titleMatch[1].trim(),
      objective: '',
      steps: [],
    };
    
    let isReadingObjective = false;
    let isReadingActions = false;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('*   **Objetivo:**')) {
            phase.objective = line.replace('*   **Objetivo:**', '').trim();
            isReadingObjective = true;
            isReadingActions = false;
            continue;
        }
        if (line.startsWith('*   **Acciones:**')) {
            isReadingActions = true;
            isReadingObjective = false;
            continue;
        }

        if (isReadingActions && line.startsWith('    ' || '1.')) { // list items
             phase.steps.push({ text: line.replace(/^\s*(\d\.)?\s*/, '') });
        } else if(isReadingObjective) {
             phase.objective += ' ' + line;
        }
    }
    phases.push(phase);
  }
  return { objective: generalObjective, phases };
}

const getIconForPhase = (title: string): React.ReactNode => {
    if (title.toLowerCase().includes('flujo')) return <Bot className="w-5 h-5"/>;
    if (title.toLowerCase().includes('adaptador')) return <Layers className="w-5 h-5"/>;
    if (title.toLowerCase().includes('búsqueda')) return <Search className="w-5 h-5"/>;
    if (title.toLowerCase().includes('análisis')) return <BrainCircuit className="w-5 h-5"/>;
    return <span className="font-bold">{title.match(/\d+/)?.[0]}</span>;
}

const PhaseCard = ({ phase, index }: { phase: Phase, index: number }) => (
  <div className="relative pl-10 sm:pl-12">
    <div className="absolute left-0 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
      {getIconForPhase(phase.title)}
    </div>
    
    <Card className="ml-4 overflow-hidden">
        <CardHeader>
            <CardTitle className="text-xl font-bold font-headline">{phase.title}</CardTitle>
            <CardDescription>{phase.objective}</CardDescription>
        </CardHeader>
        <CardContent>
            <h4 className="font-semibold mb-2 text-sm">Acciones Clave:</h4>
            <ul className="space-y-3 pl-4">
                {phase.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground/50" />
                        <span className="text-sm text-muted-foreground">{step.text}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
  </div>
);

export default async function IARefactorRoadmapPage() {
  const { objective, phases } = await parseRoadmap();

  return (
    <div className="bg-secondary dark:bg-card">
        <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-20 lg:py-24">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline">Refactorización del Agente IA</h1>
            <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
              {objective}
            </p>
        </div>

        <div className="relative space-y-12">
            <div className="absolute left-4 top-4 h-full w-0.5 bg-border -translate-x-1/2"></div>
            {phases.map((phase, index) => (
                <PhaseCard key={index} phase={phase} index={index} />
            ))}
        </div>
        </div>
    </div>
  );
}
