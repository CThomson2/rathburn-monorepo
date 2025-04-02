
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-2">InventoryPro System</h1>
        <p className="text-xl text-gray-600 text-center mb-12">
          Inventory management and workflow system
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Traditional Dashboard</CardTitle>
              <CardDescription>
                Access the standard workflow dashboard with predefined cards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                The traditional dashboard provides quick access to all workflow functions
                through organized card-based navigation.
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/dashboard" className="w-full">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Dashboard</CardTitle>
              <CardDescription>
                Access your personalized dashboard with widgets you select.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                The custom dashboard provides a personalized experience where you can add,
                remove and arrange widgets that are most relevant to your work.
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/custom-dashboard" className="w-full">
                <Button className="w-full">Go to Custom Dashboard</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Widget Library</CardTitle>
              <CardDescription>
                Browse and add widgets to customize your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                The widget library contains all available widgets that you can add to your
                custom dashboard. Browse, preview and select the ones you need.
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/widget-library" className="w-full">
                <Button className="w-full">Browse Widget Library</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Drum Management</CardTitle>
              <CardDescription>
                Access the drum management interface.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                The drum management page allows you to view, filter, and manage all drums
                in the inventory system with detailed information and actions.
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/drums" className="w-full">
                <Button className="w-full">Go to Drum Management</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
