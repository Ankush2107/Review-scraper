import Image from "next/image";
import { Rating } from "../components/ui/Rating";
import { formatRating } from "../lib/utils";

export interface IReviewItemFromAPI {
  _id?: string;
  reviewId?: string;
  author: string;
  content: string;
  rating?: number;
  postedAt: string;
  profilePicture?: string;
  recommendationStatus?: 'recommended' | 'not_recommended' | string;
}

export interface IWidgetSettingsFromForm {
  name?: string;
  themeColor: string;
  layout: "grid" | "carousel" | "list" | "masonry" | "badge";
  minRating: number;
  showRatings: boolean;
  showDates: boolean;
  showProfilePictures: boolean;
  businessUrl?: {
      _id: string;
      name: string;
      url?: string;
      source: 'google' | 'facebook';
  };
  maxReviews?: number;
}
interface WidgetPreviewProps {
  widget: IWidgetSettingsFromForm;
  reviews: IReviewItemFromAPI[];
  customizations?: {
    themeColor?: string;
    layout?: string;
    minRating?: number;
    showRatings?: boolean;
    showDates?: boolean;
    showProfilePictures?: boolean;
  };
}

const WidgetPreview = ({ 
  widget, 
  reviews, 
  customizations 
}: WidgetPreviewProps) => {
  const settings = {
    themeColor: customizations?.themeColor || widget.themeColor,
    layout: customizations?.layout || widget.layout,
    minRating: customizations?.minRating !== undefined ? customizations.minRating : widget.minRating,
    showRatings: customizations?.showRatings !== undefined ? customizations.showRatings : widget.showRatings,
    showDates: customizations?.showDates !== undefined ? customizations.showDates : widget.showDates,
    showProfilePictures: customizations?.showProfilePictures !== undefined ? customizations.showProfilePictures : widget.showProfilePictures,
  };

  const filteredReviews = reviews.filter(review => 
    !review.rating || review.rating >= settings.minRating
  );

  const avgRating = filteredReviews.length > 0 && filteredReviews.some(r => r.rating) 
    ? filteredReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / 
      filteredReviews.filter(r => r.rating).length 
    : 0;

  const colorStyle = {
    "--widget-theme-color": settings.themeColor,
  } as React.CSSProperties;

  const source = widget.businessUrl?.source || "google";
  const businessName = widget.businessUrl?.name || "Business Name";
  return (
    <div 
      className="border border-border dark:border-border rounded-lg p-6 mb-5 bg-card dark:bg-card transition-theme"
      style={colorStyle}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-muted dark:bg-muted flex items-center justify-center text-muted-foreground dark:text-muted-foreground transition-theme">
            <i className={`fab fa-${source === 'google' ? 'google' : 'facebook-f'} text-lg`}></i>
          </div>
          <div className="ml-3">
            <h4 className="font-semibold text-card-foreground dark:text-card-foreground transition-theme">{businessName}</h4>
            <div className="flex items-center">
              <Rating value={avgRating} size="lg" />
              <span className="ml-2 text-sm text-card-muted-foreground dark:text-card-muted-foreground transition-theme">
                {formatRating(avgRating)} out of 5
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-card-muted-foreground dark:text-card-muted-foreground mr-2 text-sm transition-theme">
            Based on {filteredReviews.length} reviews
          </span>
          <div className="w-6 h-6 flex items-center justify-center">
            <i className={`fab fa-${source === 'google' ? 'google' : 'facebook-f'} text-[var(--widget-theme-color)]`}></i>
          </div>
        </div>
      </div>
      {settings.layout === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {filteredReviews.slice(0, 6).map((review, index) => (
            <div key={review._id || index} className="bg-accent/50 dark:bg-accent/50 shadow-sm rounded-lg p-4 transition-theme border border-border/50 dark:border-border/50">
              <div className="flex items-center mb-3">
                {settings.showProfilePictures && (
                  <div className="w-10 h-10 rounded-full border border-border/50 dark:border-border/50 overflow-hidden bg-muted dark:bg-muted flex items-center justify-center text-muted-foreground dark:text-muted-foreground transition-theme">
                    {review.profilePicture ? (
                      <Image src={review.profilePicture} alt={review.author} className="w-full h-full object-cover" />
                    ) : (
                      <i className="fas fa-user"></i>
                    )}
                  </div>
                )}
                <div className="ml-3">
                  <h5 className="font-semibold text-card-foreground dark:text-card-foreground text-sm transition-theme">{review.author}</h5>
                  {settings.showDates && (
                    <span className="text-card-muted-foreground dark:text-card-muted-foreground text-xs transition-theme">{review.postedAt}</span>
                  )}
                </div>
              </div>
              {settings.showRatings && (
                <div className="flex mb-2">
                  {review.rating ? (
                    <Rating value={review.rating} size="sm" />
                  ) : review.recommendationStatus === 'recommended' ? (
                    <span className="text-success dark:text-success text-xs font-medium transition-theme">
                      <i className="fas fa-thumbs-up mr-1"></i> Recommended
                    </span>
                  ) : (
                    <span className="text-muted-foreground dark:text-muted-foreground text-xs transition-theme">No Rating</span>
                  )}
                </div>
              )}
              <p className="text-card-foreground dark:text-card-foreground text-sm leading-relaxed transition-theme">{review.content}</p>
            </div>
          ))}
        </div>
      )}
      {settings.layout === 'carousel' && (
        <div className="mb-4">
          <div className="relative w-full">
            <button
              onClick={() => {
                const carousel = document.getElementById('reviewCarousel');
                if (carousel) {
                  const slide = carousel.querySelector('.carousel-slide');
                  if (slide) {
                    const width = (slide as HTMLElement).offsetWidth; 
                    const currentTransform = carousel.style.transform || 'translateX(0px)';
                    const currentOffset = parseInt(currentTransform.replace(/[^\d-]/g, '') || '0');
                    const newOffset = Math.min(0, currentOffset + width);
                    carousel.style.transform = `translateX(${newOffset}px)`;
                  }
                }
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-gray-500 shadow-md border border-gray-200 dark:border-gray-700"
              aria-label="Previous review"
            >
              <i className="fa fa-chevron-left"></i>
            </button>
            <div className="overflow-hidden px-8">
              <div 
                className="flex transition-transform duration-300 ease-in-out" 
                id="reviewCarousel"
                style={{
                  transform: `translateX(0px)`,
                }}
              >
                {filteredReviews.slice(0, 10).map((review, index) => (
                  <div 
                    key={review._id || index} 
                    className="carousel-slide px-2 flex-shrink-0"
                    style={{ width: '330px' }}
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-md p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
                      <div className="flex items-start mb-2">
                        <div className="mr-2 text-xl">
                          <span className="inline-block w-6 h-6">
                            {source === 'google' ? (
                              <i className="fab fa-google text-blue-500"></i>
                            ) : (
                              <i className="fab fa-facebook text-blue-600"></i>
                            )}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            {settings.showProfilePictures && (
                              <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                                {review.profilePicture ? (
                                  <Image src={review.profilePicture} alt={review.author} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                                    <i className="fas fa-user text-gray-400 dark:text-gray-500"></i>
                                  </div>
                                )}
                              </div>
                            )}
                            <div>
                              <h5 className="font-medium text-gray-800 dark:text-gray-100">{review.author}</h5>
                              {settings.showDates && (
                                <div className="text-gray-500 dark:text-gray-400 text-xs">{review.postedAt}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {settings.showRatings && (
                        <div className="mb-2">
                          {review.rating ? (
                            <Rating value={review.rating} size="sm" color="#FFC107" />
                          ) : review.recommendationStatus === 'recommended' ? (
                            <span className="text-green-500 dark:text-green-400 text-xs font-medium">
                              <i className="fas fa-thumbs-up mr-1"></i> Recommended
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">No Rating</span>
                          )}
                        </div>
                      )}
                      <p className="text-gray-700 dark:text-gray-300 text-sm flex-grow mb-0 line-clamp-5">{review.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => {
                const carousel = document.getElementById('reviewCarousel');
                if (carousel) {
                  const slide = carousel.querySelector('.carousel-slide');
                  const totalWidth = carousel.scrollWidth;
                  const visibleWidth = (carousel.parentElement ? carousel.parentElement.offsetWidth - 64 : 0); // account for padding
                  
                  if (slide) {
                    const width = (slide as HTMLElement).offsetWidth; 
                    const currentTransform = carousel.style.transform || 'translateX(0px)';
                    const currentOffset = parseInt(currentTransform.replace(/[^\d-]/g, '') || '0');
                    const maxOffset = -(totalWidth - visibleWidth);
                    const newOffset = Math.max(maxOffset, currentOffset - width);
                    carousel.style.transform = `translateX(${newOffset}px)`;
                  }
                }
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-gray-500 shadow-md border border-gray-200 dark:border-gray-700"
              aria-label="Next review"
            >
              <i className="fa fa-chevron-right"></i>
            </button>
          </div>
          <div className="flex justify-center items-center mt-4 space-x-1">
            <button className="w-6 h-6 flex items-center justify-center text-sm text-gray-400 hover:text-gray-600">
              <i className="fa fa-chevron-left"></i>
            </button>
          
            <button className="w-2 h-2 rounded-full bg-blue-500"></button>
            <button className="w-2 h-2 rounded-full bg-gray-300"></button>
            <button className="w-2 h-2 rounded-full bg-gray-300"></button>
            <button className="w-2 h-2 rounded-full bg-gray-300"></button>
            
            <button className="w-6 h-6 flex items-center justify-center text-sm text-gray-400 hover:text-gray-600">
              <i className="fa fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}

      {settings.layout === 'list' && (
        <div className="space-y-4 mb-4">
          {filteredReviews.slice(0, 6).map((review, index) => (
            <div key={review._id || index} className="bg-accent/50 dark:bg-accent/50 shadow-sm rounded-lg p-4 border border-border/50 dark:border-border/50 transition-theme">
              <div className="flex items-center mb-3">
                {settings.showProfilePictures && (
                  <div className="w-10 h-10 rounded-full border border-border/50 dark:border-border/50 overflow-hidden bg-muted dark:bg-muted flex items-center justify-center text-muted-foreground dark:text-muted-foreground transition-theme">
                    {review.profilePicture ? (
                      <Image src={review.profilePicture} alt={review.author} className="w-full h-full object-cover" />
                    ) : (
                      <i className="fas fa-user"></i>
                    )}
                  </div>
                )}
                <div className="ml-3">
                  <h5 className="font-semibold text-card-foreground dark:text-card-foreground text-sm transition-theme">{review.author}</h5>
                  {settings.showDates && (
                    <span className="text-card-muted-foreground dark:text-card-muted-foreground text-xs transition-theme">{review.postedAt}</span>
                  )}
                </div>
                {settings.showRatings && (
                  <div className="ml-auto flex">
                    {review.rating ? (
                      <Rating value={review.rating} size="sm" />
                    ) : review.recommendationStatus === 'recommended' ? (
                      <span className="text-success dark:text-success text-xs font-medium transition-theme">
                        <i className="fas fa-thumbs-up mr-1"></i> Recommended
                      </span>
                    ) : (
                      <span className="text-muted-foreground dark:text-muted-foreground text-xs transition-theme">No Rating</span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-card-foreground dark:text-card-foreground text-sm leading-relaxed transition-theme">{review.content}</p>
            </div>
          ))}
        </div>
      )}
      
      {settings.layout === 'masonry' && (
        <div className="mb-4">
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {filteredReviews.slice(0, 9).map((review, index) => {
              return (
                <div 
                  key={review._id || index} 
                  className="bg-accent/50 dark:bg-accent/50 shadow-sm rounded-lg p-4 border border-border/50 dark:border-border/50 transition-theme break-inside-avoid mb-4 relative"
                >
                  <div className="flex items-center mb-3">
                    {settings.showProfilePictures && (
                      <div className="w-10 h-10 rounded-full border border-border/50 dark:border-border/50 overflow-hidden bg-muted dark:bg-muted flex items-center justify-center text-muted-foreground dark:text-muted-foreground transition-theme">
                        {review.profilePicture ? (
                          <Image src={review.profilePicture} alt={review.author} className="w-full h-full object-cover" />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                    )}
                    <div className="ml-3">
                      <h5 className="font-semibold text-card-foreground dark:text-card-foreground text-sm transition-theme">{review.author}</h5>
                      {settings.showDates && (
                        <span className="text-card-muted-foreground dark:text-card-muted-foreground text-xs transition-theme">{review.postedAt}</span>
                      )}
                    </div>
                  </div>
                  {settings.showRatings && (
                    <div className="flex mb-2">
                      {review.rating ? (
                        <Rating value={review.rating} size="sm" />
                      ) : review.recommendationStatus === 'recommended' ? (
                        <span className="text-success dark:text-success text-xs font-medium transition-theme">
                          <i className="fas fa-thumbs-up mr-1"></i> Recommended
                        </span>
                      ) : (
                        <span className="text-muted-foreground dark:text-muted-foreground text-xs transition-theme">No Rating</span>
                      )}
                    </div>
                  )}
                  <p className="text-card-foreground dark:text-card-foreground text-sm leading-relaxed transition-theme">{review.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {settings.layout === 'badge' && (
        <div className="mb-4">
          <div className="w-full max-w-xs mx-auto flex flex-col shadow-lg rounded-lg overflow-hidden border-2 border-[var(--widget-theme-color)]">
            <div className="bg-[var(--widget-theme-color)] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <i className={`fab fa-${source === 'google' ? 'google' : 'facebook-f'} text-xl mr-2`}></i>
                <span className="font-bold text-sm">{source === 'google' ? 'Google' : 'Facebook'} Rating</span>
              </div>
              <a 
                href={widget.businessUrl?.url || "#"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white hover:underline text-xs font-medium transition-all"
              >
                <i className="fas fa-external-link-alt mr-1"></i> View
              </a>
            </div>
            <div className="bg-white dark:bg-gray-900 p-4 text-center">
              <h4 className="font-bold text-card-foreground dark:text-card-foreground text-sm mb-2 transition-theme">{businessName}</h4>
              <div className="flex justify-center items-center mb-2">
                <div className="rounded-full bg-[var(--widget-theme-color)] text-white text-xl w-10 h-10 flex items-center justify-center mr-2 font-bold">
                  {formatRating(avgRating)}
                </div>
                <Rating value={avgRating} size="lg" color={settings.themeColor} />
              </div>
              
              <div className="text-sm font-semibold text-card-foreground dark:text-card-foreground transition-theme">
                Based on {filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'}
              </div>
            </div>
            <div className="bg-[var(--widget-theme-color)]/10 dark:bg-[var(--widget-theme-color)]/20 p-2 text-center border-t border-[var(--widget-theme-color)]/30">
              <div className="text-xs text-card-foreground dark:text-card-foreground transition-theme">
                <span className="font-bold">Verified</span> by <span className="text-[var(--widget-theme-color)] font-semibold">ReviewHub</span>
              </div>
            </div>
          </div>
          <div className="w-full max-w-xs mx-auto mt-4 bg-white dark:bg-gray-900 shadow-md rounded-md overflow-hidden border border-[var(--widget-theme-color)]/30 flex items-center transition-all hover:shadow-lg cursor-pointer">
            <div className="bg-[var(--widget-theme-color)] text-white p-3 flex-shrink-0">
              <div className="font-bold text-xl">{formatRating(avgRating)}</div>
              <div className="text-xs font-medium">out of 5</div>
            </div>
            <div className="p-3 flex-1">
              <div className="flex items-center mb-1">
                <Rating value={avgRating} size="sm" />
                <span className="ml-2 text-xs text-card-muted-foreground dark:text-card-muted-foreground transition-theme">
                  ({filteredReviews.length})
                </span>
              </div>
              <div className="text-xs text-card-foreground dark:text-card-foreground truncate transition-theme font-medium">
                {businessName}
              </div>
            </div>
            <div className="pr-3 flex items-center justify-center">
              <i className={`fab fa-${source === 'google' ? 'google' : 'facebook-f'} text-lg text-[var(--widget-theme-color)]`}></i>
            </div>
          </div>
          <div className="w-full max-w-xs mx-auto mt-4 flex items-center justify-center bg-white dark:bg-gray-900 shadow-sm rounded-full border border-[var(--widget-theme-color)]/30 py-1.5 px-3">
            <i className={`fab fa-${source === 'google' ? 'google' : 'facebook-f'} text-[var(--widget-theme-color)] mr-2`}></i>
            <Rating value={avgRating} size="sm" />
            <span className="mx-1 text-xs text-card-muted-foreground dark:text-card-muted-foreground transition-theme">
              {formatRating(avgRating)}/5
            </span>
            <span className="text-xs text-card-foreground dark:text-card-foreground transition-theme font-medium">
              • ReviewHub
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          <button className="w-8 h-8 rounded-full bg-muted dark:bg-muted flex items-center justify-center text-muted-foreground dark:text-muted-foreground hover:bg-accent dark:hover:bg-accent hover:text-accent-foreground dark:hover:text-accent-foreground transition-theme">
            <i className="fas fa-chevron-left text-xs"></i>
          </button>
          <button className="w-8 h-8 rounded-full bg-muted dark:bg-muted flex items-center justify-center text-muted-foreground dark:text-muted-foreground hover:bg-accent dark:hover:bg-accent hover:text-accent-foreground dark:hover:text-accent-foreground transition-theme">
            <i className="fas fa-chevron-right text-xs"></i>
          </button>
        </div>
        <a 
          href={widget.businessUrl?.url || "#"} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-[var(--widget-theme-color)] hover:underline transition-theme font-medium"
        >
          See all reviews on {source === 'google' ? 'Google' : 'Facebook'}
          <i className="fas fa-external-link-alt ml-1 text-xs"></i>
        </a>
      </div>
    </div>
  );
};

export default WidgetPreview;