import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle, AlertCircle, User } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSetup() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  useEffect(() => {
    checkCurrentStatus();
  }, []);

  const checkCurrentStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        setIsAdmin(!!roleData);
      }
    } catch (error) {
      console.error('Status check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAdminRole = async () => {
    if (!currentUser) {
      toast.error('Please sign in first');
      return;
    }

    setIsCreatingAdmin(true);
    try {
      // Try to insert admin role directly
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: currentUser.id,
          role: 'admin',
          assigned_by: currentUser.id
        });

      if (error) {
        if (error.code === '42P01') {
          toast.error('Please create user_roles table in Supabase first. Check console for SQL.');
          console.log('Run the secure SQL schema in Supabase SQL Editor');
          return;
        }
        if (error.code === '23505') {
          toast.error('You already have admin privileges!');
          return;
        }
        if (error.message.includes('policy')) {
          toast.error('Admin already exists. Only the first user or existing admins can create admin accounts.');
          return;
        }
        throw error;
      }

      setIsAdmin(true);
      toast.success('Admin role created successfully!');
    } catch (error) {
      console.error('Admin creation error:', error);
      toast.error('Failed to create admin role: ' + (error as Error).message);
    } finally {
      setIsCreatingAdmin(false);
    }
  };



  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Admin Setup
          </CardTitle>
          <CardDescription>
            Set up admin privileges for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentUser ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please sign in to set up admin privileges.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <User className="w-5 h-5" />
                <div>
                  <p className="font-medium">{currentUser.email}</p>
                  <p className="text-sm text-muted-foreground">Current User</p>
                </div>
                <Badge variant={isAdmin ? "default" : "secondary"}>
                  {isAdmin ? "Admin" : "User"}
                </Badge>
              </div>

              {isAdmin ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    You already have admin privileges! You can now access the inventory and admin panel.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You don't have admin privileges yet. Click the button below to grant yourself admin access.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    onClick={createAdminRole}
                    disabled={isCreatingAdmin}
                    className="w-full"
                  >
                    {isCreatingAdmin ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Admin Role...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Grant Admin Access
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Granted</CardTitle>
            <CardDescription>
              You now have access to all admin features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Inventory Management</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Manage spare parts, pricing, and stock levels
                </p>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/diagnose?tab=inventory'}>
                  Access Inventory
                </Button>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Admin Panel</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  User management, analytics, and content moderation
                </p>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin'}>
                  Open Admin Panel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}