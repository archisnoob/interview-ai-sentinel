
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodingInterface from '@/components/CodingInterface';
import AdminDashboard from '@/components/AdminDashboard';
import ThemeToggle from '@/components/ThemeToggle';
import { Shield, Code, BarChart3, Search, Filter, Settings } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Modern Sticky Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-[#6C63FF] to-[#5A52E8] rounded-xl shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  CodeGuard AI
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  Advanced Plagiarism Detection for Code Interviews
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="interview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:w-96 bg-card border border-border shadow-sm p-1 rounded-xl">
            <TabsTrigger 
              value="interview" 
              className="flex items-center space-x-2 data-[state=active]:bg-[#6C63FF] data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium"
            >
              <Code className="h-4 w-4" />
              <span>Live Interview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center space-x-2 data-[state=active]:bg-[#6C63FF] data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium"
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
