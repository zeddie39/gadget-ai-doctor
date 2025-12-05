import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, Shield, UserCog, Calendar, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
  isSuperAdmin?: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, super_admin');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles = (profiles || []).map(profile => {
        const userRoles = roles?.filter(r => r.user_id === profile.id) || [];
        return {
          ...profile,
          roles: userRoles.map(r => r.role),
          isSuperAdmin: userRoles.some(r => r.super_admin === true)
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast({
        title: 'Fetch Failed',
        description: 'Unable to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user', action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole } as any);

        if (error) throw error;

        toast({
          title: 'Role Added',
          description: `Successfully added ${newRole} role`,
        });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', newRole as any);

        if (error) throw error;

        toast({
          title: 'Role Removed',
          description: `Successfully removed ${newRole} role`,
        });
      }

      fetchUsers();
    } catch (error) {
      console.error('Update role error:', error);
      toast({
        title: 'Update Failed',
        description: 'Unable to update user role',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter);
    
    return matchesSearch && matchesRole;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          User Management
        </CardTitle>
        <CardDescription>
          View and manage user accounts, roles, and permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">
                  {users.filter(u => u.roles.includes('admin')).length}
                </p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <UserCog className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">
                  {users.filter(u => u.roles.includes('user')).length}
                </p>
                <p className="text-sm text-muted-foreground">Regular Users</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center p-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.full_name || 'User'} 
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold">
                            {user.full_name || 'Unnamed User'}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {user.email || 'No email'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Joined {format(new Date(user.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {user.roles.length > 0 ? (
                            user.roles.map(role => (
                              <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">No roles</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {user.isSuperAdmin ? (
                        <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-blue-600">
                          Super Admin
                        </Badge>
                      ) : user.roles.includes('admin') ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateUserRole(user.id, 'admin', 'remove')}
                        >
                          Remove Admin
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateUserRole(user.id, 'admin', 'add')}
                        >
                          <Shield className="w-3 h-3 mr-2" />
                          Make Admin
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
