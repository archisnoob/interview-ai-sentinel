
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodingInterface from '@/components/CodingInterface';
import AdminDashboard from '@/components/AdminDashboard';
import ThemeToggle from '@/components/ThemeToggle';
import { Shield, Code, BarChart3 } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary rounded-xl shadow-lg">
                <Shield className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  CodeGuard AI
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  Advanced Plagiarism Detection for Code Interviews
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <Tabs defaultValue="interview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:w-96 p-1">
            <TabsTrigger 
              value="interview" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 font-medium"
            >
              <Code className="h-4 w-4" />
              <span>Live Interview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 font-medium"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Admin Panel</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interview" className="animate-fade-in-up">
            <CodingInterface />
          </TabsContent>

          <TabsContent value="dashboard" className="animate-fade-in-up">
            <AdminDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
