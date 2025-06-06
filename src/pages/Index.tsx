
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodingInterface from '@/components/CodingInterface';
import AdminDashboard from '@/components/AdminDashboard';
import ThemeToggle from '@/components/ThemeToggle';
import { Shield, Code, BarChart3 } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen app-gradient">
      {/* Header */}
      <div className="header-gradient shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg shadow-md">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-sm">AI Cheating Detection System</h1>
                <p className="text-sm text-white/80">Advanced behavioral analysis for coding interviews</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="interview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-96 card-gradient border border-white/20 dark:border-white/10 shadow-lg">
            <TabsTrigger 
              value="interview" 
              className="flex items-center space-x-2 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all duration-300"
            >
              <Code className="h-4 w-4" />
              <span>Interview Platform</span>
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center space-x-2 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all duration-300"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Admin Dashboard</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interview">
            <CodingInterface />
          </TabsContent>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
