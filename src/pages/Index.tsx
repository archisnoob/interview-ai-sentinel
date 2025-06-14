import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodingInterface from '@/components/CodingInterface';
import AdminDashboard from '@/components/AdminDashboard';
import ThemeToggle from '@/components/ThemeToggle';
import { Shield, Code, BarChart3 } from 'lucide-react';
const Index = () => {
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors bg-gray-900">
      {/* Header */}
      <div className="shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg transition-colors">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold transition-colors text-orange-700">AI Cheating Detection System</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">Advanced behavioral analysis for coding interviews</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="interview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-96 bg-white dark:bg-gray-800 border dark:border-gray-700">
            <TabsTrigger value="interview" className="flex items-center space-x-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/50 transition-colors">
              <Code className="h-4 w-4" />
              <span>Interview Platform</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center space-x-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/50 transition-colors">
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
    </div>;
};
export default Index;