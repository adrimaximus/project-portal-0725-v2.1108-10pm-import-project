import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AccountSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Manage your account settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Account settings form will go here.</p>
      </CardContent>
    </Card>
  );
};

export default AccountSettings;