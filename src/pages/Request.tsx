import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  
  const RequestPage = () => {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
          <CardHeader>
            <CardTitle>Request</CardTitle>
            <CardDescription>This is the request page.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Request form will be here.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  export default RequestPage