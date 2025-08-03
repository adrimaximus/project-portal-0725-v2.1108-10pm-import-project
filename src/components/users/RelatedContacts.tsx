import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { relatedContacts } from "@/data/users";

export const RelatedContacts = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-medium">Related contacts. Consider inviting them too :)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {relatedContacts.map(contact => (
                        <div key={contact.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={`https://avatar.vercel.sh/${contact.email}.png`} alt={contact.name} />
                                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{contact.name}</p>
                                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">Assign them role</p>
                                <Button variant="outline" size="sm">Send invite</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}