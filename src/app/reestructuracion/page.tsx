
import { CheckCircle, Clock, Layers, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Hoja de Ruta (Reestructuración) | Mi Red Colombia',
  description: 'Sigue el progreso y la evolución de la reestructuración actual de la plataforma.',
  robots: {
    index: false, // No indexar esta página de desarrollo intermedio
    follow: false,
  },
};

// --- Data Fetching and Parsing ---
type Step = {
  text: string;
};

type Phase = {
  title: string;
  objective: string;
  steps: Step[];
};

async function parseRestructuringRoadmap(): Promise<Phase[]> {
    const filePath = path.join(process.cwd(), 'ai/local-develop/backend-reestructuracion-roadmap.md');
    const content = await fs.readFile(filePath, 'utf-8');
    
    const phases: Phase[] = [];
    // Split content by "---" which separates the preamble from the phases
    const sections = content.split('---');
    const phaseContent = sections.length > 1 ? sections.slice(1).join('---') : content;
    
    // Split into phases using "## Fase" as a delimiter
    const phaseBlocks = phaseContent.split(/\n(?=## Fase \d+:)/).filter(block => block.trim() !== '');

    for (const block of phaseBlocks) {
        const lines = block.trim().split('\n');
        const titleMatch = lines[0].match(/^## (Fase \d+:.+)/);
        if (!titleMatch) continue;

        const phase: Phase = {
            title: titleMatch[1].trim(),
            objective: '',
            steps: [],
        };

        let isReadingSteps = false;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('**Objetivo:**')) {
                phase.objective = line.replace('**Objetivo:**', '').trim();
                isReadingSteps = false; // Stop reading steps if objective is found
            } else if (line.startsWith('*   **')) {
                 // Main step
                 phase.steps.push({ text: line.replace('*   **', '').replace('**', '').trim() });
            } else if (line.startsWith('*   ')) {
                 // Sub-step, intended to be part of the last main step but for simplicity we add it as its own
                 phase.steps.push({ text: line.replace('*   ','').trim() });
            }
        }
        phases.push(phase);
    }
    return phases;
}


// --- Components ---
const PhaseCard = ({ phase, index }: { phase: Phase; index: number }) => (
  <div className="relative pl-8 sm:pl-12">
    <div className="absolute left-0 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <span className="font-bold">{index + 1}</span>
    </div>
    
    <Card className="ml-4 overflow-hidden">
        <CardHeader>
            <CardTitle className="text-xl font-bold font-headline">{phase.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           {phase.objective && (
                <div className="flex items-start gap-4 p-4 rounded-md bg-muted/50 border border-border">
                    <Rocket className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary/80" />
                    <div>
                        <h4 className="font-semibold">Objetivo</h4>
                        <p className="text-sm text-muted-foreground">{phase.objective}</p>
                    </div>
                </div>
            )}
             {phase.steps.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2">Tareas Principales:</h4>
                    <ul className="space-y-3 pl-4">
                        {phase.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <Layers className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground/80" />
                                <span className="text-sm text-foreground">{step.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </CardContent>
    </Card>
  </div>
);

// --- Page Component ---
export default async function RestructuringRoadmapPage() {
  const roadmapPhases = await parseRestructuringRoadmap();

  return (
    <div className="bg-secondary dark:bg-card">
      <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-20 lg:py-24">
        <div className="text-center mb-12">
            <Badge>En Desarrollo</Badge>
            <h1 className="text-4xl md:text-5xl font-bold font-headline mt-4">Hoja de Ruta: Reestructuración Estratégica</h1>
            <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
                Un plan de acción técnico para alinear la plataforma con la nueva visión estratégica, centrada en IA y portales de valor.
            </p>
        </div>

        <div className="relative space-y-12">
            <div className="absolute left-4 top-4 h-full w-0.5 bg-border -translate-x-1/2"></div>
            
            {roadmapPhases.map((phase, index) => (
                <PhaseCard key={index} phase={phase} index={index} />
            ))}
        </div>
      </div>
    </div>
  );
}
