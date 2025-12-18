import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NutritionTracker } from './NutritionTracker';

export const NutritionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tracking");

  return (
    <div className="container mx-auto py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tracking">Nutrition Tracking</TabsTrigger>
          <TabsTrigger value="planning">Meal Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meal Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <NutritionTracker />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning">
          <Card>
            <CardHeader>
              <CardTitle>Meal Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Meal planning features coming soon!</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};