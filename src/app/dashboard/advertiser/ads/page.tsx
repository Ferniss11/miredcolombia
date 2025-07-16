import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { mockAds } from "@/lib/placeholder-data";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";


export default function AdvertiserAdsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline">Gestionar Anuncios</h1>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Anuncio
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Tus Anuncios</CardTitle>
                    <CardDescription>Una lista de tus campañas de anuncios actuales y pasadas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Vistas</TableHead>
                                    <TableHead className="text-right">Clics</TableHead>
                                    <TableHead><span className="sr-only">Acciones</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockAds.map((ad) => (
                                    <TableRow key={ad.id}>
                                        <TableCell className="font-medium">{ad.title}</TableCell>
                                        <TableCell>
                                            <Badge variant={ad.status === 'Activo' ? 'default' : ad.status === 'Pausado' ? 'secondary' : 'destructive' } 
                                            className={cn(ad.status === 'Activo' && 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30',
                                                        ad.status === 'Pausado' && 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30',
                                                        ad.status === 'Expirado' && 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30'
                                            )}>
                                                {ad.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{ad.views.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{ad.clicks.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem>Editar</DropdownMenuItem>
                                                    <DropdownMenuItem>Pausar</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600">Eliminar</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
