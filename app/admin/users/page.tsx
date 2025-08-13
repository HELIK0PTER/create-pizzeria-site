"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Shield,
  ShieldCheck,
  Users,
  MoreVertical,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User } from "@prisma/client";
import { cn } from "@/lib/utils";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"promote" | "demote" | null>(
    null
  );
  const [targetRole, setTargetRole] = useState<"admin" | "delivery" | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filtrer les utilisateurs en fonction de la recherche
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (user: User, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Mettre à jour l'utilisateur localement
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
        
        setShowDialog(false);
        setSelectedUser(null);
        setActionType(null);
        setTargetRole(null); // Reset target role on successful change
        
        // Afficher un message si les sessions ont été révoquées
        if (updatedUser.sessionRevoked) {
          console.log(`Sessions révoquées pour ${user.name} suite au changement de rôle`);
          // Optionnel: Afficher une notification toast ici
        }
      } else {
        console.error("Erreur lors de la modification du rôle");
      }
    } catch (error) {
      console.error("Erreur lors de la modification du rôle:", error);
    }
  };

  const openRoleDialog = (user: User, action: "promote" | "demote", role?: "admin" | "delivery") => {
    setSelectedUser(user);
    setActionType(action);
    setTargetRole(role ?? null);
    setShowDialog(true);
  };

  const confirmRoleChange = () => {
    if (selectedUser && actionType) {
      let newRole: string;

      if (actionType === "promote") {
        // Promotion avec rôle cible explicite
        if (!targetRole) return; // Sécurité: ne rien faire si pas de rôle cible
        newRole = targetRole;
      } else {
        // Logique de rétrogradation : admin -> delivery -> customer
        if (selectedUser.role === "admin") {
          newRole = "delivery";
        } else if (selectedUser.role === "delivery") {
          newRole = "customer";
        } else {
          newRole = "customer"; // Déjà customer
        }
      }

      handleRoleChange(selectedUser, newRole);
    }
  };

  const handleDelete = async () => {
    if (selectedUser) {
      try {
        const response = await fetch(`/api/users/${selectedUser.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setUsers(users.filter((u) => u.id !== selectedUser.id));
          setShowDeleteDialog(false);
        } else {
          console.error("Erreur lors de la suppression de l'utilisateur");
        }
      } catch (error) {
        console.error("Erreur lors de la suppression de l'utilisateur:", error);
      }
    }
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      handleDelete();
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return (
        <Badge variant="default" className="bg-orange-100 text-orange-700">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      );
    }
    if (role === "delivery") {
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-700">
          <Shield className="h-3 w-3 mr-1" />
          Livreur
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Users className="h-3 w-3 mr-1" />
        Client
      </Badge>
    );
  };

  const getStats = () => {
    const totalUsers = users.length;
    const adminUsers = users.filter((user) => user.role === "admin").length;
    const deliveryUsers = users.filter((user) => user.role === "delivery").length;
    const customerUsers = totalUsers - adminUsers - deliveryUsers;
    return { totalUsers, adminUsers, deliveryUsers, customerUsers };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const getPromoteTitle = (role: "admin" | "delivery" | null) => {
    if (role === "admin") return "Promouvoir en administrateur";
    if (role === "delivery") return "Promouvoir en livreur";
    return "Promouvoir l'utilisateur";
  };

  const getDemoteTitle = (user: User | null) => {
    if (!user) return "Rétrograder l'utilisateur";
    if (user.role === "admin") return "Rétrograder en livreur";
    if (user.role === "delivery") return "Rétrograder en client";
    return "Rétrograder l'utilisateur";
  };

  const getNextRole = (user: User | null, action: "promote" | "demote") => {
    if (!user) return "admin";
    if (action === "promote") {
      if (user.role === "customer") return "delivery";
      if (user.role === "delivery") return "admin";
      return "admin";
    } else {
      if (user.role === "admin") return "delivery";
      if (user.role === "delivery") return "customer";
      return "customer";
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-8 w-8 text-orange-600" />
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez les utilisateurs et leurs permissions
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total utilisateurs
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Comptes enregistrés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Administrateurs
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.adminUsers}</div>
              <p className="text-xs text-muted-foreground">
                Avec permissions admin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Livreurs
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deliveryUsers}</div>
              <p className="text-xs text-muted-foreground">
                Avec permissions livreur
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customerUsers}</div>
              <p className="text-xs text-muted-foreground">
                Utilisateurs standards
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table des utilisateurs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tous les utilisateurs</CardTitle>
                <CardDescription>
                  Liste complète des utilisateurs enregistrés
                </CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Date d&apos;inscription</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-orange-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.role === "customer" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => openRoleDialog(user, "promote", "delivery")}
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Promouvoir livreur
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openRoleDialog(user, "promote", "admin")}
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Promouvoir admin
                              </DropdownMenuItem>
                            </>
                          )}
                          {user.role === "delivery" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => openRoleDialog(user, "promote", "admin")}
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Promouvoir admin
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openRoleDialog(user, "demote")}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Rétrograder client
                              </DropdownMenuItem>
                            </>
                          )}
                          {user.role === "admin" && (
                            <DropdownMenuItem
                              onClick={() => openRoleDialog(user, "demote")}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Rétrograder livreur
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredUsers.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm
                  ? `Aucun utilisateur trouvé pour "${searchTerm}"`
                  : "Aucun utilisateur enregistré"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de confirmation */}
        <AlertDialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) { setSelectedUser(null); setActionType(null); setTargetRole(null); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionType === "promote"
                  ? getPromoteTitle(targetRole)
                  : getDemoteTitle(selectedUser)}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {actionType === "promote" ? (
                  <>
                    Confirmez-vous la promotion de {" "}
                    <strong>{selectedUser?.name}</strong> en {" "}
                    <strong>{targetRole === "admin" ? "administrateur" : "livreur"}</strong> ?
                    {targetRole === "admin" 
                      ? " Cette personne aura accès à toutes les fonctionnalités d'administration."
                      : " Cette personne aura accès aux fonctionnalités de livraison."}
                  </>
                ) : (
                  <>
                    Confirmez-vous la rétrogradation de {" "}
                    <strong>{selectedUser?.name}</strong> vers le rôle de {" "}
                    <strong>{getNextRole(selectedUser, "demote") === "delivery" ? "livreur" : "client"}</strong> ?
                    {getNextRole(selectedUser, "demote") === "customer"
                      ? " Cette personne n'aura plus accès aux fonctionnalités spéciales."
                      : " Cette personne n'aura plus accès aux fonctionnalités d'administration."}
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRoleChange}
                className={cn(
                  actionType === "promote"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-red-600 hover:bg-red-700"
                )}
              >
                {actionType === "promote" ? "Promouvoir" : "Rétrograder"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Voulez-vous vraiment supprimer l&apos;utilisateur{" "}
                <strong>{selectedUser?.name}</strong> ? Cette action est
                irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
