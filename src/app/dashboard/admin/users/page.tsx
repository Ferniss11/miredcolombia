
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, UserRole } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MoreVertical, Edit, Trash2, Loader2, ShieldQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { setUserRoleAction } from '@/lib/user-actions';


// This is a placeholder for the actual server action.
async function getAllUsersAction(): Promise<{ users?: UserProfile[], error?: string }> {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'Failed to fetch users');
        }
        const users = await response.json();
        return { users };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}


export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { user, claims } = useAuth();
    const [isUpdatingRole, startRoleUpdateTransition] = useTransition();

    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole>('User');
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    
    const isSAdmin = claims?.roles?.includes('SAdmin');

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            const result = await getAllUsersAction();
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else if (result.users) {
                setUsers(result.users);
            }
            setIsLoading(false);
        };
        fetchUsers();
    }, [toast]);

    const handleOpenRoleModal = (user: UserProfile) => {
        setSelectedUser(user);
        setSelectedRole(user.role);
        setIsAlertOpen(true);
    };
    
    const handleSetRole = () => {
        if (!selectedUser || !user) return;
        startRoleUpdateTransition(async () => {
            const result = await setUserRoleAction({ uid: selectedUser.uid, role: selectedRole }, user.uid);
            if (result.error) {
                 toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                 toast({ title: 'Éxito', description: `El rol de ${selectedUser.name} ha sido actualizado a ${selectedRole}.` });
                 setUsers(users.map(u => u.uid === selectedUser.uid ? { ...u, role: selectedRole } : u));
                 setIsAlertOpen(false);
            }
        });
    };

    const getRoleBadgeVariant = (role: UserProfile['role']) => {
        switch (role) {
            case 'Admin': return 'default';
            case 'SAdmin': return 'destructive';
            case 'Advertiser': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Users className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Gestión de Usuarios</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Todos los Usuarios Registrados</CardTitle>
                    <CardDescription>Una lista de todos los usuarios en la plataforma, incluyendo su rol.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : users.length > 0 ? (
                                    users.map(u => (
                                        <TableRow key={u.uid} className={u.uid === user?.uid ? 'bg-muted/50' : ''}>
                                            <TableCell className="font-medium">{u.name}</TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={getRoleBadgeVariant(u.role)}>{u.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={u.status === 'active' ? 'secondary' : 'destructive'} className={u.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                                                    {u.status === 'active' ? 'Activo' : 'Eliminado'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleOpenRoleModal(u)} disabled={!isSAdmin || u.uid === user?.uid}>
                                                            <Edit className="mr-2 h-4 w-4" /> Editar Rol
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem disabled className="text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">No se encontraron usuarios.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cambiar Rol de {selectedUser?.name}</AlertDialogTitle>
                        <AlertDialogDescription>
                           Selecciona el nuevo rol para el usuario. Esta acción cambiará sus permisos en toda la plataforma.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <RadioGroup defaultValue={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="User" id="r-user" />
                                <Label htmlFor="r-user">Usuario</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Advertiser" id="r-advertiser" />
                                <Label htmlFor="r-advertiser">Anunciante</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Admin" id="r-admin" />
                                <Label htmlFor="r-admin">Admin</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <Button onClick={handleSetRole} disabled={isUpdatingRole}>
                             {isUpdatingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Guardar Cambios
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
