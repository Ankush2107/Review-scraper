import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import WidgetPreview from "./WidgetPreview";

interface IBusinessUrlForSelect {
  _id: string;
  name: string;
  url: string;
  source: "google" | "facebook";
}
interface IReviewItem {
  _id?: string;
  reviewId?: string;
  author: string;
  content: string;
  rating?: number;
  postedAt: string;
  profilePicture?: string;
}
interface PreviewDataState {
  reviews: IReviewItem[];
  isLoading: boolean;
  error?: string | null;
}

export interface IWidgetPreviewData {
  name: string;
  themeColor: string;
  layout: "grid" | "carousel" | "list" | "masonry" | "badge";
  minRating: number;
  showRatings: boolean;
  showDates: boolean;
  showProfilePictures: boolean;
  businessUrl?: IBusinessUrlForSelect;
}

const createWidgetSchema = z.object({
  name: z.string().min(2, "Widget name must be at least 2 characters long."),
  businessUrlId: z.string().min(1, "Please select a business source."),
  themeColor: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      "Must be a valid hex color (e.g., #RRGGBB)."
    ),
  layout: z.enum(["grid", "carousel", "list", "masonry", "badge"]),
  minRating: z.number().min(0).max(5, "Rating must be between 0 and 5."),
  showRatings: z.boolean().default(true),
  showDates: z.boolean().default(true),
  showProfilePictures: z.boolean().default(true),
});

type CreateWidgetFormData = z.infer<typeof createWidgetSchema>;

interface CreateWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessUrls: IBusinessUrlForSelect[];
  isLoadingBusinessUrls?: boolean;
  onWidgetCreated: () => void;
}

const CreateWidgetModal = ({
  isOpen,
  onClose,
  businessUrls,
  isLoadingBusinessUrls,
  onWidgetCreated,
}: CreateWidgetModalProps) => {
  const [activeTab, setActiveTab] = useState<"settings" | "preview">(
    "settings"
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<CreateWidgetFormData>({
    resolver: zodResolver(createWidgetSchema),
    defaultValues: {
      name: "",
      businessUrlId: businessUrls.length > 0 ? businessUrls[0]._id : "",
      themeColor: "#3182CE", // Blue
      layout: "grid",
      minRating: 0,
      showRatings: true,
      showDates: true,
      showProfilePictures: true,
    },
  });
  const selectedBusinessUrlId = form.watch("businessUrlId");

  const {
    data: previewReviewsQueryResult,
    isLoading: isPreviewReviewsLoading,
    error: previewReviewsError,
    refetch: triggerFetchReviewsForPreview,
  } = useQuery<{ reviews: IReviewItem[] }>({
    queryKey: ["previewReviews", selectedBusinessUrlId],
    queryFn: async () => {
      if (!selectedBusinessUrlId) {
        return { reviews: [] };
      }
      return apiRequest<{ reviews: IReviewItem[] }>(
        "GET",
        `/api/business-urls/${selectedBusinessUrlId}/reviews`
      );
    },
    enabled: false,
  });

  const previewReviews = previewReviewsQueryResult?.reviews || [];

  useEffect(() => {
    if (selectedBusinessUrlId && activeTab === "preview") {
      triggerFetchReviewsForPreview();
    }
  }, [selectedBusinessUrlId, activeTab, triggerFetchReviewsForPreview]);

  const createWidgetMutation = useMutation<
    unknown,
    Error,
    CreateWidgetFormData
  >({
    mutationFn: (data: CreateWidgetFormData) => {
      return apiRequest("POST", "/api/widgets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast({ title: "Success", description: "Widget created successfully!" });
      onWidgetCreated();
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create widget.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateWidgetFormData) => {
    createWidgetMutation.mutate(data);
  };

  const handleBusinessUrlSelectChange = (value: string) => {
    form.setValue("businessUrlId", value, { shouldValidate: true });
  };

  const currentFormValues = form.watch();
  const selectedBusinessUrlObject = businessUrls.find(
    (b) => b._id === selectedBusinessUrlId
  );

  const previewWidgetDataForChild: IWidgetPreviewData = {
    name: currentFormValues.name || "Sample Widget",
    themeColor: currentFormValues.themeColor,
    layout: currentFormValues.layout,
    minRating: currentFormValues.minRating,
    showRatings: currentFormValues.showRatings,
    showDates: currentFormValues.showDates,
    showProfilePictures: currentFormValues.showProfilePictures,
    businessUrl: selectedBusinessUrlObject,
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-3xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create New Review Widget</DialogTitle>
          <DialogDescription>
            Customize and preview your widget before saving.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="settings"
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "settings" | "preview")
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="preview">Live Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="py-6 space-y-6">
            <Form {...form}>
              <form
                id="createWidgetForm"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Widget Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Homepage Google Reviews"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessUrlId"
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      <FormLabel>Business Source</FormLabel>
                      <Select
                        onValueChange={handleBusinessUrlSelectChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger disabled={isLoadingBusinessUrls}>
                            {" "}
                            <SelectValue
                              placeholder={
                                isLoadingBusinessUrls
                                  ? "Loading sources..."
                                  : "Select a business source"
                              }
                            />{" "}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {!isLoadingBusinessUrls &&
                            businessUrlsForModal.map((business: IBusinessUrlForSelect) => (
                              <SelectItem
                                key={business._id}
                                value={business._id}
                              >
                                {business.name} (
                                {business.source.charAt(0).toUpperCase() +
                                  business.source.slice(1)}
                                )
                              </SelectItem>
                            ))}
                          {isLoadingBusinessUrls && (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>{" "}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="themeColor"
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      <FormLabel>Theme Color</FormLabel>{" "}
                      <div className="flex items-center space-x-2 pt-1">
                        {" "}
                        {themeColors.map((color) => (
                          <button
                            type="button"
                            key={color.value}
                            title={color.name}
                            onClick={() =>
                              form.setValue("themeColor", color.value, {
                                shouldValidate: true,
                              })
                            }
                            className={`w-7 h-7 rounded-full border-2 hover:opacity-80 transition-opacity ${
                              field.value === color.value
                                ? "ring-2 ring-offset-2 dark:ring-offset-slate-900 ring-primary"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: color.value }}
                          />
                        ))}{" "}
                        <FormControl>
                          <Input type="text" {...field} className="w-32 ml-2" />
                        </FormControl>{" "}
                      </div>{" "}
                      <FormMessage />{" "}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="layout"
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      <FormLabel>Layout</FormLabel>{" "}
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        {" "}
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select layout" />
                          </SelectTrigger>
                        </FormControl>{" "}
                        <SelectContent>
                          {" "}
                          <SelectItem value="grid">Grid</SelectItem>{" "}
                          <SelectItem value="carousel">Carousel</SelectItem>{" "}
                          <SelectItem value="list">List</SelectItem>{" "}
                          <SelectItem value="masonry">Masonry</SelectItem>{" "}
                          <SelectItem value="badge">Badge</SelectItem>{" "}
                        </SelectContent>{" "}
                      </Select>{" "}
                      <FormMessage />{" "}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minRating"
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      <FormLabel>Minimum Rating to Display</FormLabel>{" "}
                      <Select
                        onValueChange={(value: string) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value !== undefined ? field.value.toString() : ""} 
                      >
                        {" "}
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select minimum rating" />
                          </SelectTrigger>
                        </FormControl>{" "}
                        <SelectContent>
                          {" "}
                          <SelectItem value="0">All Ratings</SelectItem>{" "}
                          <SelectItem value="3">3 Stars & Up</SelectItem>{" "}
                          <SelectItem value="4">4 Stars & Up</SelectItem>{" "}
                          <SelectItem value="5">5 Stars Only</SelectItem>{" "}
                        </SelectContent>{" "}
                      </Select>{" "}
                      <FormMessage />{" "}
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 pt-2">
                  <FormField
                    control={form.control}
                    name="showRatings"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        {" "}
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="showRatings"
                          />
                        </FormControl>{" "}
                        <FormLabel
                          htmlFor="showRatings"
                          className="font-normal text-sm !mt-0"
                        >
                          Show Star Ratings
                        </FormLabel>{" "}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="showDates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        {" "}
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="showDates"
                          />
                        </FormControl>{" "}
                        <FormLabel
                          htmlFor="showDates"
                          className="font-normal text-sm !mt-0"
                        >
                          Show Review Dates
                        </FormLabel>{" "}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="showProfilePictures"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        {" "}
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="showProfilePictures"
                          />
                        </FormControl>{" "}
                        <FormLabel
                          htmlFor="showProfilePictures"
                          className="font-normal text-sm !mt-0"
                        >
                          Show Profile Pictures
                        </FormLabel>{" "}
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="preview" className="py-6">
            <div className="min-h-[300px] p-4 border border-dashed rounded-md bg-slate-50 dark:bg-slate-800/50">
              {" "}
              {/* Added min height and bg */}
              {!selectedBusinessUrlId ? (
                <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                  <i className="fas fa-search text-3xl text-slate-400 mb-4"></i>
                  <p className="text-slate-500 dark:text-slate-400">
                    Select a business source in settings to see a preview.
                  </p>
                </div>
              ) : isPreviewReviewsLoading ? (
                <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  <p className="mt-3 text-slate-600 dark:text-slate-400">
                    Loading preview...
                  </p>
                </div>
              ) : previewReviewsError ? (
                <div className="text-center py-10 text-red-500">
                  Error loading preview. Please try again.
                </div>
              ) : (
                <WidgetPreview
                  widget={previewWidgetDataForChild}
                  reviews={previewReviews}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {activeTab === "settings" ? (
            <Button
              type="button"
              variant="default"
              onClick={() => {
                form.trigger().then((isValid) => {
                  if (isValid && selectedBusinessUrlId) {
                    setActiveTab("preview");
                    fetchReviewsForPreview();
                  } else if (!selectedBusinessUrlId) {
                    toast({
                      title: "No Business Selected",
                      description: "Please select a business source first.",
                      variant: "default",
                    });
                  } else {
                    toast({
                      title: "Validation Error",
                      description:
                        "Please fix errors in the settings before previewing.",
                      variant: "destructive",
                    });
                  }
                });
              }}
            >
              Next: Preview <i className="fas fa-arrow-right ml-2 text-xs"></i>
            </Button>
          ) : (
            <Button
              form="createWidgetForm"
              type="submit"
              disabled={createWidgetMutation.isPending}
            >
              {createWidgetMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>Creating...
                </>
              ) : (
                "Create Widget"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default CreateWidgetModal;