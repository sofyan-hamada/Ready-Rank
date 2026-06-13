'use client';

import React, { useState, useEffect } from 'react';
import { dbService, Review } from '@/lib/db';
import { Star, MessageSquare, PlusCircle, CheckCircle } from 'lucide-react';

export default function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getReviews();
      // Only show approved reviews
      setReviews(data.filter(r => r.approved));
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    setSubmitting(true);
    try {
      const success = await dbService.addReview(name.trim(), rating, comment.trim());
      if (success) {
        setSuccess(true);
        setName('');
        setComment('');
        setRating(5);
        // Reload list
        await loadReviews();
        // Clear success message after 4s
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate statistics
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 
    ? Number((reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount).toFixed(1))
    : 0;

  // Star rendering helper
  const renderStars = (count: number, size = 16, onClick?: (rating: number) => void, onHover?: (val: number | null) => void) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = hoverRating !== null 
            ? starValue <= hoverRating 
            : starValue <= count;
            
          return (
            <Star
              key={starValue}
              onClick={() => onClick && onClick(starValue)}
              onMouseEnter={() => onHover && onHover(starValue)}
              onMouseLeave={() => onHover && onHover(null)}
              className={`${onClick ? 'cursor-pointer' : ''} ${
                isFilled 
                  ? 'text-yellow-400 fill-yellow-400 filter drop-shadow-[0_0_4px_rgba(234,179,8,0.4)]' 
                  : 'text-gray-700'
              }`}
              style={{ width: size, height: size }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <section className="py-12 border-t border-gray-900 bg-[#06060c]/40" id="reviews-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display font-extrabold text-3xl text-white tracking-wide">
            CUSTOMER <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 text-glow-purple">REVIEWS</span>
          </h2>
          <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest font-semibold">
            What our clients say about Ready Rank accounts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Rating Summary */}
          <div className="bg-[#0b0c16]/50 border border-gray-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-cyan-600/5 rounded-full blur-3xl"></div>
            
            <span className="text-gray-500 uppercase tracking-widest text-[10px] font-bold mb-2">Overall Rating</span>
            <span className="font-display font-extrabold text-6xl text-white tracking-tighter text-glow-cyan">
              {reviewCount > 0 ? averageRating : 'N/A'}
            </span>
            <div className="mt-3 mb-2">
              {renderStars(Math.round(averageRating), 22)}
            </div>
            <span className="text-xs text-gray-400">
              Based on <strong className="text-white font-semibold">{reviewCount}</strong> {reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          {/* Column 2: Recent Reviews List */}
          <div className="lg:col-span-2 space-y-4 max-h-[350px] overflow-y-auto pr-2">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
              Recent Feedbacks
            </span>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse bg-[#0b0c16]/30 border border-gray-800/50 rounded-xl p-4 h-24"></div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-[#0b0c16]/30 border border-gray-900 rounded-xl p-6 text-center text-gray-500 text-xs">
                No reviews yet. Be the first to review our service!
              </div>
            ) : (
              reviews.map((rev) => (
                <div 
                  key={rev.id} 
                  className="bg-[#0b0c16]/30 border border-gray-900 rounded-xl p-4 hover:border-gray-800 transition-colors"
                  id={`review-card-${rev.id}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-cyan-400" id={`review-user-${rev.id}`}>{rev.user_name}</span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(rev.created_at).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="mb-2">
                    {renderStars(rev.rating, 13)}
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed" id={`review-comment-${rev.id}`}>
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Submit Review Form (Centered Box below) */}
        <div className="mt-10 max-w-xl mx-auto bg-[#0b0c16]/60 border border-gray-800 rounded-2xl p-6 shadow-xl relative">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl"></div>
          
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            <h3 className="font-display font-bold text-lg text-white">Leave a Review</h3>
          </div>

          {success ? (
            <div className="flex flex-col items-center text-center py-6 bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-4 text-emerald-300 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
              <p className="font-bold text-sm">Review Submitted Successfully!</p>
              <p className="text-xs text-emerald-400/80">Thank you for rating our service.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">
                    Your Score
                  </label>
                  {renderStars(rating, 24, setRating, setHoverRating)}
                </div>

                <div className="w-full sm:w-1/2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1 block">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="GamerTag"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-950/80 border border-gray-800 rounded-lg py-1.5 px-3 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                    id="input-review-name"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1 block">
                  Review Comment
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="How was your account quality and delivery speed?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-gray-950/80 border border-gray-800 rounded-lg py-2 px-3 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  id="input-review-comment"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !name || !comment}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-white transition-all"
                id="btn-submit-review"
              >
                <PlusCircle className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          )}
        </div>

      </div>
    </section>
  );
}
