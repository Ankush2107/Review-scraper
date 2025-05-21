import { useState } from "react";
import WidgetPreviewModal, { IWidgetForPreviewModal } from "./WidgetPreviewModal";
import WidgetCodeModal, { IWidgetForCodeModal } from "./WidgetCodeModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"; 
import { Button } from "../components/ui/button";
interface IBusinessUrlForWidgetCard {
  _id: string;
  source: 'google' | 'facebook';
  name: string;
  url?: string;
}
export interface IWidget {
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
  businessUrl?: IBusinessUrlForWidgetCard;
  createdAt?: string | Date;
  averageRating?: number;
  isActive?: boolean;
  settings?: Record<string, any>;
}

interface WidgetCardProps {
  widget: IWidget;
  onDelete?: () => void;
  onEdit?: (widgetId: string) => void;
  isDeleting?: boolean;
}

const WidgetCard = ({ widget, onDelete, onEdit, isDeleting }: WidgetCardProps) => {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  const createdDate = widget.createdAt
    ? new Date(widget.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'N/A';
    const getSourceIcon = (): string => {
      if (widget.businessUrl?.source === 'google') return 'google';
      if (widget.businessUrl?.source === 'facebook') return 'facebook-f';
      return 'store-alt';
    };
    const getSourceBgClass = (): string => {
      if (widget.businessUrl?.source === 'google') return 'bg-red-100';
      if (widget.businessUrl?.source === 'facebook') return 'bg-blue-100';
      return 'bg-gray-100';
    };
    const getSourceTextClass = (): string => {
      if (widget.businessUrl?.source === 'google') return 'text-red-600';
      if (widget.businessUrl?.source === 'facebook') return 'text-blue-600';
      return 'text-gray-600';
    };

    const widgetPropsForPreviewModal: IWidgetForPreviewModal = {
    _id: widget._id,
    name: widget.name,
    themeColor: widget.themeColor,
    layout: widget.type,
    minRating: widget.minRating,
    maxReviews: widget.maxReviews,
    showRatings: widget.showRatings,
    showDates: widget.showDates,
    showProfilePictures: widget.showProfilePictures,
    businessUrlId: widget.businessUrlId,
    businessUrl: widget.businessUrl ? { 
        _id: widget.businessUrl._id,
        name: widget.businessUrl.name,
        source: widget.businessUrl.source,
        url: widget.businessUrl.url,
    } : undefined,
    };

     const widgetPropsForCodeModal: IWidgetForCodeModal = {
        _id: widget._id,
        name: widget.name,
        themeColor: widget.themeColor,
        layout: widget.type,
      };

    const ratingToDisplay = widget.averageRating ?? 0;

  return (
    <>
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden widget-card transition-all duration-300 hover:shadow-xl ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <div className={`w-9 h-9 rounded-lg ${getSourceBgClass()} flex items-center justify-center ${getSourceTextClass()} flex-shrink-0`}>
              <i className={`fab fa-${getSourceIcon()}`}></i>
            </div>
            <h3 className="ml-3 font-semibold text-gray-800  truncate" title={widget.name}>
              {widget.name}
            </h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <i className="fas fa-ellipsis-v"></i> 
                <span className="sr-only">Open widget menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsPreviewModalOpen(true)}>
                <i className="fas fa-eye mr-2 h-4 w-4" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCodeModalOpen(true)}>
                <i className="fas fa-code mr-2 h-4 w-4" /> Get Code
              </DropdownMenuItem>
              {onEdit && ( 
                <DropdownMenuItem onClick={() => onEdit(widget._id)}>
                  <i className="fas fa-pen mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
              {onDelete && ( 
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-600 focus:text-red-600 focus:bg-red-500  "
                    disabled={isDeleting}
                  >
                    <i className="fas fa-trash-alt mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="px-5 py-4">
          <div className="flex items-center mb-3">
            <div className="flex text-warning-500">
              {Array.from({ length: 5 }).map((_, index) => {
                if (index < Math.floor(ratingToDisplay)) {
                  return <i key={index} className="fas fa-star"></i>;
                } else if (index === Math.floor(ratingToDisplay) && ratingToDisplay % 1 >= 0.4) {
                  return <i key={index} className="fas fa-star-half-alt"></i>;
                } else {
                  return <i key={index} className="far fa-star"></i>;
                }
              })}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700 truncate" title={widget.businessUrl?.name || 'Unknown Business'}>
              {widget.businessUrl?.name || 'Unknown Business'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div>
              <span>Created: </span>
              <span className="font-medium text-gray-700 ">{createdDate}</span>
            </div>
            <div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${widget.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {widget.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {isPreviewModalOpen && (
        <WidgetPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          widget={widgetPropsForPreviewModal}
        />
      )}
      {isCodeModalOpen && (
        <WidgetCodeModal
          isOpen={isCodeModalOpen}
          onClose={() => setIsCodeModalOpen(false)}
          widget={widgetPropsForCodeModal}
        />
      )}
    </>
  );
};
export default WidgetCard;