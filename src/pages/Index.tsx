
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodingInterface from '@/components/CodingInterface';
import AdminDashboard from '@/components/AdminDashboard';
import ThemeToggle from '@/components/ThemeToggle';
import { Shield, Code, BarChart3 } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="bg-card border-b border-default shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-accent rounded-lg shadow-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-card tracking-tight">
                  AI Cheating Detection System
                </h1>
                <p className="text-sm text-muted">
                  Advanced behavioral analysis for coding interviews
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="interview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-96 bg-card border border-default shadow-sm p-1">
            <TabsTrigger 
              value="interview" 
              className="flex items-center space-x-2 data-[state=active]:bg-accent data-[state=active]:text-white transition-all duration-300 rounded-md"
            >
              <Code className="h-4 w-4" />
              <span>Interview Platform</span>
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center space-x-2 data-[state=active]:bg-accent data-[state=active]:text-white transition-all duration-300 rounded-md"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Admin Dashboard</span>
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
