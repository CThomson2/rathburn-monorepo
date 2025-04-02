
import React, { useState } from "react";
import { Bell, Send, User, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Sample notifications data
const notifications = [
  {
    id: 1,
    message: "Inventory count completed for warehouse A",
    sender: "System",
    time: "10 min ago",
    read: false,
    avatar: null,
    priority: "normal"
  },
  {
    id: 2,
    message: "Low stock alert: Aluminum Sheets (15 units remaining)",
    sender: "System",
    time: "1 hour ago",
    read: false,
    avatar: null,
    priority: "high"
  },
  {
    id: 3,
    message: "New order placed by TechCorp (Order #5823)",
    sender: "Sales System",
    time: "3 hours ago",
    read: true,
    avatar: null,
    priority: "normal"
  },
  {
    id: 4,
    message: "Sarah requested approval for purchase order #9283",
    sender: "Sarah Chen",
    time: "Yesterday",
    read: true,
    avatar: "/placeholder.svg",
    priority: "normal"
  },
  {
    id: 5,
    message: "Monthly inventory report is ready for review",
    sender: "Reports Bot",
    time: "2 days ago",
    read: true,
    avatar: null,
    priority: "normal"
  }
];

// Sample team members for message recipients
const teamMembers = [
  { id: 1, name: "Sarah Chen", role: "Inventory Manager", avatar: "/placeholder.svg" },
  { id: 2, name: "Michael Rodriguez", role: "Warehouse Supervisor", avatar: "/placeholder.svg" },
  { id: 3, name: "Jamie Taylor", role: "Purchasing Agent", avatar: "/placeholder.svg" },
  { id: 4, name: "Warehouse Team", role: "Group", avatar: null, isGroup: true },
  { id: 5, name: "Management", role: "Group", avatar: null, isGroup: true }
];

const NotificationsWidget = () => {
  const [activeTab, setActiveTab] = useState("inbox");
  const [unreadCount, setUnreadCount] = useState(2);
  const [messageText, setMessageText] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [selectedRecipientInput, setSelectedRecipientInput] = useState("");
  
  const markAllAsRead = () => {
    setUnreadCount(0);
    // In a real app, you would update notification status in the database
  };
  
  const markAsRead = (id: number) => {
    // In a real app, you would update just this notification
    setUnreadCount(Math.max(0, unreadCount - 1));
  };
  
  const sendMessage = () => {
    if (messageText.trim() === "" || selectedRecipients.length === 0) return;
    
    // In a real app, you would send this message to the selected recipients
    console.log("Message sent:", {
      message: messageText,
      recipients: selectedRecipients.map(id => 
        teamMembers.find(member => member.id === id)?.name
      )
    });
    
    // Reset form
    setMessageText("");
    setSelectedRecipients([]);
  };
  
  const toggleRecipient = (id: number) => {
    if (selectedRecipients.includes(id)) {
      setSelectedRecipients(selectedRecipients.filter(r => r !== id));
    } else {
      setSelectedRecipients([...selectedRecipients, id]);
    }
  };
  
  const filteredTeamMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(selectedRecipientInput.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
        <TabsList className="mb-2">
          <TabsTrigger value="inbox" className="relative">
            Inbox
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="send">Send Message</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inbox" className="flex-grow mt-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Recent Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7 px-2"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
          
          <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={cn(
                  "flex gap-3 p-2 rounded-md transition-colors",
                  notification.read ? "bg-background" : "bg-muted/50"
                )}
              >
                <div className="flex-shrink-0 mt-1">
                  {notification.avatar ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={notification.avatar} alt={notification.sender} />
                      <AvatarFallback>{notification.sender[0]}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bell className={cn(
                        "h-4 w-4",
                        notification.priority === "high" ? "text-red-500" : "text-primary"
                      )} />
                    </div>
                  )}
                </div>
                
                <div className="flex-grow">
                  <div 
                    className="text-sm mb-1"
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    {notification.message}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{notification.sender}</span>
                    <span>{notification.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="send" className="flex-grow mt-0 flex flex-col">
          <div className="mb-3">
            <label className="text-sm font-medium mb-1 block">Recipients:</label>
            <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[38px] mb-1">
              {selectedRecipients.map(id => {
                const recipient = teamMembers.find(m => m.id === id);
                return (
                  <div 
                    key={id}
                    className="bg-primary/10 text-xs px-2 py-1 rounded-md flex items-center gap-1"
                  >
                    {recipient?.isGroup ? (
                      <Users className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    <span>{recipient?.name}</span>
                    <button 
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => toggleRecipient(id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
              <Input 
                className="flex-1 min-w-[80px] border-none text-sm p-0 h-auto focus-visible:ring-0"
                placeholder={selectedRecipients.length === 0 ? "Search recipients..." : ""}
                value={selectedRecipientInput}
                onChange={(e) => setSelectedRecipientInput(e.target.value)}
              />
            </div>
            
            {selectedRecipientInput !== "" && (
              <div className="border rounded-md mt-1 max-h-[120px] overflow-y-auto">
                {filteredTeamMembers.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No matching recipients
                  </div>
                ) : (
                  <div className="p-1">
                    {filteredTeamMembers.map(member => (
                      <div 
                        key={member.id}
                        className={cn(
                          "flex items-center gap-2 p-1 rounded-sm cursor-pointer hover:bg-muted/50",
                          selectedRecipients.includes(member.id) && "bg-muted/50"
                        )}
                        onClick={() => toggleRecipient(member.id)}
                      >
                        {member.avatar ? (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            {member.isGroup ? (
                              <Users className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                          </div>
                        )}
                        <div>
                          <div className="text-sm">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex-grow flex flex-col">
            <label className="text-sm font-medium mb-1 block">Message:</label>
            <Textarea 
              placeholder="Type your message here..."
              className="flex-grow resize-none"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end mt-3">
            <Button onClick={sendMessage} disabled={messageText.trim() === "" || selectedRecipients.length === 0}>
              <Send className="h-4 w-4 mr-1" />
              Send Message
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsWidget;
