
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trash, Folder, Image, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StorageItem {
  name: string;
  size: number;
  type: 'app' | 'photo' | 'cache';
  lastUsed?: string;
  isDuplicate?: boolean;
}

interface StorageAnalysis {
  unusedApps: StorageItem[];
  duplicatePhotos: StorageItem[];
  cacheFiles: StorageItem[];
  totalStorageUsed: number;
  totalStorageAvailable: number;
  potentialCleanupSize: number;
  recommendations: string[];
}

const StorageOptimizer = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [analysis, setAnalysis] = useState<StorageAnalysis | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const simulateStorageAnalysis = (): StorageAnalysis => {
    const unusedApps: StorageItem[] = [
      { name: 'TikTok', size: 450, type: 'app', lastUsed: '30 days ago' },
      { name: 'Old Game', size: 1200, type: 'app', lastUsed: '60 days ago' },
      { name: 'Unused Social App', size: 320, type: 'app', lastUsed: '45 days ago' },
    ];

    const duplicatePhotos: StorageItem[] = [
      { name: 'IMG_001.jpg', size: 3.2, type: 'photo', isDuplicate: true },
      { name: 'IMG_001_copy.jpg', size: 3.2, type: 'photo', isDuplicate: true },
      { name: 'Screenshot_duplicate.png', size: 1.8, type: 'photo', isDuplicate: true },
    ];

    const cacheFiles: StorageItem[] = [
      { name: 'Browser Cache', size: 890, type: 'cache' },
      { name: 'App Cache Files', size: 340, type: 'cache' },
      { name: 'Temp Downloads', size: 156, type: 'cache' },
    ];

    const totalUsed = 28000; // 28GB
    const totalAvailable = 32000; // 32GB
    const cleanupSize = unusedApps.reduce((sum, app) => sum + app.size, 0) +
                       duplicatePhotos.reduce((sum, photo) => sum + photo.size, 0) +
                       cacheFiles.reduce((sum, cache) => sum + cache.size, 0);

    return {
      unusedApps,
      duplicatePhotos,
      cacheFiles,
      totalStorageUsed: totalUsed,
      totalStorageAvailable: totalAvailable,
      potentialCleanupSize: cleanupSize,
      recommendations: [
        'Delete unused apps to free up significant space',
        'Remove duplicate photos and screenshots',
        'Clear cache files regularly for better performance',
        'Move photos to cloud storage',
        'Uninstall apps not used in 30+ days'
      ]
    };
  };

  const runStorageAnalysis = async () => {
    setIsScanning(true);
    
    try {
      // Simulate scanning time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const analysisResult = simulateStorageAnalysis();
      setAnalysis(analysisResult);
      
      // Store analysis in database
      await supabase.from('storage_analysis').insert({
        device_info: {
          user_agent: navigator.userAgent,
          platform: navigator.platform,
          scan_date: new Date().toISOString()
        } as any,
        unused_apps: analysisResult.unusedApps as any,
        duplicate_photos: analysisResult.duplicatePhotos as any,
        cache_files: analysisResult.cacheFiles as any,
        total_storage_used: analysisResult.totalStorageUsed,
        total_storage_available: analysisResult.totalStorageAvailable,
        potential_cleanup_size: analysisResult.potentialCleanupSize,
        recommendations: analysisResult.recommendations as any
      });
      
      toast.success('Storage analysis completed!');
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
      console.error('Storage analysis error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const formatSize = (sizeInMB: number): string => {
    if (sizeInMB >= 1000) {
      return `${(sizeInMB / 1000).toFixed(1)} GB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const toggleItemSelection = (itemName: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemName)) {
      newSelected.delete(itemName);
    } else {
      newSelected.add(itemName);
    }
    setSelectedItems(newSelected);
  };

  const calculateSelectedSize = (): number => {
    if (!analysis) return 0;
    
    const allItems = [...analysis.unusedApps, ...analysis.duplicatePhotos, ...analysis.cacheFiles];
    return allItems
      .filter(item => selectedItems.has(item.name))
      .reduce((sum, item) => sum + item.size, 0);
  };

  const performCleanup = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to clean');
      return;
    }

    const cleanupSize = calculateSelectedSize();
    
    // Simulate cleanup process
    toast.success(`Cleaned up ${formatSize(cleanupSize)} successfully!`);
    
    // Reset selections and update analysis
    setSelectedItems(new Set());
    if (analysis) {
      const updatedAnalysis = { ...analysis };
      updatedAnalysis.totalStorageUsed -= cleanupSize;
      updatedAnalysis.potentialCleanupSize -= cleanupSize;
      setAnalysis(updatedAnalysis);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'app': return <Zap className="h-4 w-4 text-blue-600" />;
      case 'photo': return <Image className="h-4 w-4 text-purple-600" />;
      case 'cache': return <Folder className="h-4 w-4 text-orange-600" />;
      default: return <Folder className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <Button
          onClick={runStorageAnalysis}
          disabled={isScanning}
          size="lg"
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isScanning ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Scanning Storage...
            </>
          ) : (
            <>
              <Trash className="mr-2 h-5 w-5" />
              Start Storage Analysis
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-6">
          {/* Storage Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Storage Overview</CardTitle>
              <CardDescription>Current storage usage and cleanup potential</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Storage Used</span>
                    <span>{formatSize(analysis.totalStorageUsed)} / {formatSize(analysis.totalStorageAvailable)}</span>
                  </div>
                  <Progress value={(analysis.totalStorageUsed / analysis.totalStorageAvailable) * 100} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{formatSize(analysis.potentialCleanupSize)}</p>
                    <p className="text-sm text-green-700">Can be freed</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(((analysis.totalStorageAvailable - analysis.totalStorageUsed) / analysis.totalStorageAvailable) * 100)}%
                    </p>
                    <p className="text-sm text-blue-700">Free space</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cleanup Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Unused Apps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Unused Apps
                </CardTitle>
                <CardDescription>{analysis.unusedApps.length} apps found</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.unusedApps.map((app, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border rounded">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(app.name)}
                      onChange={() => toggleItemSelection(app.name)}
                      className="rounded"
                    />
                    {getItemIcon(app.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{app.name}</p>
                      <p className="text-xs text-gray-600">{formatSize(app.size)} • {app.lastUsed}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Duplicate Photos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-purple-600" />
                  Duplicate Photos
                </CardTitle>
                <CardDescription>{analysis.duplicatePhotos.length} duplicates found</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.duplicatePhotos.map((photo, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border rounded">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(photo.name)}
                      onChange={() => toggleItemSelection(photo.name)}
                      className="rounded"
                    />
                    {getItemIcon(photo.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{photo.name}</p>
                      <p className="text-xs text-gray-600">{formatSize(photo.size)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Cache Files */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-orange-600" />
                  Cache Files
                </CardTitle>
                <CardDescription>{analysis.cacheFiles.length} cache types found</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.cacheFiles.map((cache, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border rounded">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(cache.name)}
                      onChange={() => toggleItemSelection(cache.name)}
                      className="rounded"
                    />
                    {getItemIcon(cache.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{cache.name}</p>
                      <p className="text-xs text-gray-600">{formatSize(cache.size)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Cleanup Actions */}
          {selectedItems.size > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-green-800">
                      {selectedItems.size} items selected
                    </p>
                    <p className="text-sm text-green-700">
                      Will free up {formatSize(calculateSelectedSize())}
                    </p>
                  </div>
                  <Button onClick={performCleanup} className="bg-green-600 hover:bg-green-700">
                    <Trash className="mr-2 h-4 w-4" />
                    Clean Selected Items
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-blue-800 text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StorageOptimizer;
