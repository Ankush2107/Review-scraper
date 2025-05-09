import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

export interface IWidgetForCodeModal {
  _id: string;
  name: string;
}
interface WidgetCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  widget: IWidgetForCodeModal;
}

const WidgetCodeModal = ({ isOpen, onClose, widget }: WidgetCodeModalProps) => {
  const [activeTab, setActiveTab] = useState<"javascript" | "iframe">("javascript");
  const codeRef = useRef<HTMLPreElement>(null);
  const { toast } = useToast();

  // Get the current domain for embedding
  const domain = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-domain.com';
  
  // Generate embed code
  const javascriptCode = `<!-- ReviewHub Widget (Widget ID: ${widget._id}) -->
  <div id="reviewhub-widget-${widget._id}"></div>
  <script>
    (function() {
      var el = document.getElementById('reviewhub-widget-${widget._id}');
      if (!el) { console.warn('ReviewHub: Container element for widget ${widget._id} not found.'); return; }
      var script = document.createElement('script');
      script.src = '${domain}/widget.js'; // Ensure this path is correct
      script.async = true;
      script.defer = true; // Good practice for non-critical scripts
      script.onload = function() {
        if (window.ReviewHub && typeof window.ReviewHub.initWidget === 'function') {
          window.ReviewHub.initWidget({
            containerId: 'reviewhub-widget-${widget._id}', // Pass ID of the container
            widgetId: '${widget._id}'
            // You might pass other widget settings here if your widget.js expects them
            // e.g., themeColor: '${widget.themeColor}', layout: '${widget.layout}'
          });
        } else {
          console.error('ReviewHub: widget.js loaded but ReviewHub.initWidget is not available.');
        }
      };
      script.onerror = function() {
        console.error('ReviewHub: Failed to load widget.js from ${domain}/widget.js');
      };
      document.head.appendChild(script);
    })();
  </script>
  <!-- End ReviewHub Widget -->`;

  const iframeCode = `<!-- ReviewHub Widget (Widget ID: ${widget._id}) -->
  <iframe
    src="${domain}/embed/widget/${widget._id}"
    style="width: 100%; min-height: 400px; border: none; overflow: hidden;" /* Added min-height */
    title="${widget.name || 'Review Widget'}"
    loading="lazy"
    allowtransparency="true" /* Deprecated but often harmless */
    frameborder="0" /* For older browsers */
  ></iframe>
  <!-- End ReviewHub Widget -->`;

  // Handle copy to clipboard
  const handleCopyCode = () => {
    const codeToCopy = activeTab === "javascript" ? javascriptCode : iframeCode;
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy)
        .then(() => {
          toast({
            title: "Copied!",
            description: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} code copied to clipboard.`,
          });
        })
        .catch((err) => {
          console.error("Copy failed:", err);
          toast({
            title: "Copy Failed",
            description: "Could not copy code. Please try again or copy manually.",
            variant: "destructive",
          });
        });
    }
  };

  const currentCodeToShow = activeTab === 'javascript' ? javascriptCode : iframeCode;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl sm:max-w-3xl md:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Embed Widget on Your Website</DialogTitle>
          <DialogDescription>
            Copy the code below and paste it into your website where you want the widget to appear.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="javascript" value={activeTab} onValueChange={(value: string) => setActiveTab(value as "javascript" | "iframe")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="javascript">JavaScript (Recommended)</TabsTrigger>
            <TabsTrigger value="iframe">iFrame</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="py-4">
            <div className="bg-slate-800 dark:bg-gray-900 rounded-md overflow-hidden shadow-inner">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-700 dark:bg-gray-800 border-b border-slate-600 dark:border-gray-700">
                <span className="text-sm font-medium text-slate-200 dark:text-gray-300">
                  {activeTab === 'javascript' ? 'JavaScript Embed Code' : 'iFrame Embed Code'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm" 
                  className="text-slate-300 hover:text-white hover:bg-slate-600 dark:hover:bg-gray-700"
                  onClick={handleCopyCode}
                >
                  <i className="fas fa-copy mr-2 h-4 w-4"></i>
                  Copy
                </Button>
              </div>
              <pre ref={codeDisplayRef} className="p-4 text-sm text-slate-100 dark:text-gray-200 overflow-x-auto max-h-[300px]">
                <code>{currentCodeToShow}</code> 
              </pre>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-gray-400">
              {activeTab === 'javascript'
                ? "Dynamically loads the widget. Recommended for most integrations."
                : "Simpler to embed, but offers less flexibility and might affect SEO or page speed."}
            </p>
          </TabsContent>
        </Tabs>
          <DialogFooter className="pt-6 sm:justify-between"> {/* Adjusted footer layout */}
              <p className="text-xs text-slate-500 dark:text-gray-400 hidden sm:block">
                  Widget ID: <code className="bg-slate-100 dark:bg-slate-700 p-1 rounded text-xs">{widget._id}</code>
              </p>
              <div>
                  <Button type="button" variant="outline" onClick={onClose} className="mr-2">Close</Button>
                  <Button type="button" onClick={handleCopyCode}>
                      <i className="fas fa-copy mr-2 h-4 w-4"></i>Copy Active Code
                  </Button>
              </div>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WidgetCodeModal;
