
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, Code } from "lucide-react";
import { useState } from "react";

type DebugInfoCardProps = {
    title: string;
    description: string;
    data: any;
};

export default function DebugInfoCard({ title, description, data }: DebugInfoCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Safely render tool invocations
    const renderToolInvocations = () => {
        if (!data || !Array.isArray(data.toolInvocations) || data.toolInvocations.length === 0) {
            return <p className="text-xs text-muted-foreground italic">No se invocó ninguna herramienta en este turno.</p>;
        }
        return data.toolInvocations.map((invocation: any, index: number) => (
            <div key={index} className="mt-2 p-2 border rounded-md bg-background/50">
                <p className="font-semibold text-sm">Herramienta: <code className="text-primary">{invocation.tool}</code></p>
                <pre className="text-xs whitespace-pre-wrap break-all mt-1">
                    {JSON.stringify(invocation.result, null, 2)}
                </pre>
            </div>
        ));
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card>
                <CollapsibleTrigger asChild>
                     <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Code className="w-5 h-5"/>{title}</CardTitle>
                            <CardDescription className="mt-1 text-left">{description}</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                            <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                        </Button>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent>
                        {data?.toolInvocations ? (
                           renderToolInvocations()
                        ) : (
                             <pre className="mt-2 w-full max-h-80 overflow-auto rounded-md bg-muted p-4 text-sm">
                                {data ? JSON.stringify(data, null, 2) : 'No hay datos disponibles.'}
                            </pre>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}
