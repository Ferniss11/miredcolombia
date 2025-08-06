
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
                            <ChevronDown className="h-4 w-4 transition-transform duration-200" data-state={isOpen ? 'open' : 'closed'} />
                        </Button>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent>
                        <pre className="mt-2 w-full max-h-80 overflow-auto rounded-md bg-muted p-4 text-sm">
                            {data ? JSON.stringify(data, null, 2) : 'No hay datos disponibles.'}
                        </pre>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}
