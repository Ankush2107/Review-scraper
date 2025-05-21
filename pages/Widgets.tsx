import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { apiRequest } from "../lib/queryClient";
import Layout from "../components/Layout";
import WidgetCard from "../components/WidgetCard";
import CreateWidgetModal from "../components/CreateWidgetModal";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { IBusinessUrlDisplay as IBusinessUrlForDropdown } from '@/lib/storage';
interface IBusinessUrlForWidget { 
  _id: string;
  source: 'google' | 'facebook';
  name: string; 
}
interface IWidget {
  _id: string;
  name: string;
  themeColor: string;
  type: "grid" | "carousel" | "list" | "masonry" | "badge";
  minRating: number;
  maxReviews?: number;
  showRatings: boolean;
  showDates: boolean;
  showProfilePictures: boolean;
  businessUrlId: string;
  businessUrl?: IBusinessUrlForWidget;
  createdAt?: string | Date;
  averageRating?: number;
  isActive?: boolean;
  settings?: Record<string, any>;
  views?: number;
}

type WidgetTab = "all" | "google" | "facebook";

const Widgets = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WidgetTab>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { status: authStatus } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (authStatus === 'loading') return;
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/widgets');
    }
  }, [authStatus, router]);

  const { data: widgetsData, isLoading: isWidgetsLoading } = useQuery<{ widgets: IWidget[] }>({
    queryKey: ['widgets'],
    queryFn: () => apiRequest<{ widgets: IWidget[] }>("GET", '/api/widgets'), 
    enabled: authStatus === 'authenticated',
  });
  const allWidgets = useMemo(() => widgetsData?.widgets || [], [widgetsData]);

  const { data: businessUrlsData, isLoading: isBusinessUrlsLoading } = useQuery<{ businessUrls: IBusinessUrlForDropdown[] }>({
    queryKey: ['businessUrls'],
    queryFn: () => apiRequest<{ businessUrls: IBusinessUrlForDropdown[] }>("GET", '/api/business-urls'),
    enabled: authStatus === 'authenticated',
  });
  console.log(`[${router.pathname}] businessUrlsData from useQuery:`, businessUrlsData);
  const derivedBusinessUrls = useMemo(() => businessUrlsData?.businessUrls || [], [businessUrlsData]);
  console.log(`[${router.pathname}] derivedBusinessUrls:`, derivedBusinessUrls);
  const deleteMutation = useMutation<unknown, Error, string>({ 
    mutationFn: (widgetId: string) => apiRequest("DELETE", `/api/widgets/${widgetId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast({ title: "Widget Deleted", description: "The widget has been successfully deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Deletion Failed", description: error.message || "Failed to delete widget.", variant: "destructive" });
    },
  });
  const filteredWidgets = useMemo(() => {
  console.log("Filtering widgets. Active tab:", activeTab, "allWidgets count:", allWidgets.length);   
    if (activeTab === "all") {
      return allWidgets;
    }
    return allWidgets.filter((widget: IWidget) => widget.businessUrl?.source === activeTab);
  }, [allWidgets, activeTab]);
  const handleWidgetCreated = () => {
    setIsCreateModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['widgets'] });
    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    toast({title: "Widget Created", description: "New widget added successfully!"});
  };
  if (authStatus === 'loading' || authStatus === 'unauthenticated') {
    return <Layout><div className="flex justify-center items-center h-screen"><p>Loading widgets...</p></div></Layout>;
  }
  return (
    <Layout>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
          <h1 className="text-2xl font-heading font-bold text-gray-800  mb-4 sm:mb-0">
            My Widgets
          </h1>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary-500 hover:bg-primary-600"
          >
            <i className="fas fa-plus mr-2"></i>
            Create Widget
          </Button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <Tabs 
            defaultValue="all" 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as WidgetTab)} 
            className="w-full"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Widgets</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
              <TabsTrigger value="facebook">Facebook</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-0">
              {isWidgetsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="bg-gray-100 rounded-xl h-48 animate-pulse"></div>
                  ))}
                </div>
              ) : filteredWidgets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredWidgets.map((widget: IWidget) => ( 
                    <WidgetCard
                      key={widget._id} 
                      widget={widget} 
                      onDelete={() => {
                        if (window.confirm("Are you sure you want to delete this widget?")) {
                          deleteMutation.mutate(widget._id); 
                        }
                      }}
                      isDeleting={deleteMutation.isPending && deleteMutation.variables === widget._id}
                    />
                  ))}
                  <div className="bg-white  rounded-xl shadow-sm border border-gray-100 overflow-hidden widget-card flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-5">
                        <i className="fas fa-plus text-xl"></i>
                      </div>
                      <h3 className="text-center font-medium text-gray-800 mb-2">Create a New Widget</h3>
                      <p className="text-center text-gray-500 text-sm mb-4">
                        Connect to Google or Facebook and start displaying your reviews
                      </p>
                      <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-primary-500 hover:bg-primary-600 text-gray-800"
                      >
                        <i className="fas fa-plus mr-2 text-gray-800"></i>
                        Create Widget
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-gray-100 text-gray-400  mb-5">
                    <i className="fas fa-th-large text-xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Widgets Found</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {activeTab === "all" 
                      ? "You haven't created any widgets yet. Create your first widget to start showcasing your reviews."
                      : `You haven't created any ${activeTab} widgets yet.`}
                  </p>
                  <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary-500 hover:bg-primary-600 text-gray-800"
                  >
                    <i className="fas fa-plus mr-2 text-gray-800"></i>
                    Create First Widget
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {isCreateModalOpen && (
        <CreateWidgetModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onWidgetCreated={handleWidgetCreated}
          businessUrls={derivedBusinessUrls} 
          isLoadingBusinessUrls={isBusinessUrlsLoading}
       />
      )}
    </Layout>
  );
};

export default Widgets;
