import React, { useState } from 'react';
import { Star, ShieldCheck, CheckCircle2, X, Sparkles } from 'lucide-react';

const LENDER_QUICK_TAGS = [
  'Showroom Clean & Steamed',
  'Exact Fit & Measurements',
  'Punctual Campus Handoff',
  'Included Styling / Drape Pins',
  'Accurate 5-Point Pre-Log'
];

const BORROWER_QUICK_TAGS = [
  'Returned in Pristine Condition',
  'On-Time Return Meetup',
  'Clear 5-Point Return Photos',
  'Zero Odor / Stain Issues',
  'Respectful Communication'
];

export default function DualRatingModal({
  isOpen,
  onClose,
  booking,
  activeUser,
  users,
  onSubmitReview
}) {
  const [roleReviewed, setRoleReviewed] = useState('LENDER'); // 'LENDER' | 'BORROWER'
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState([
    'Showroom Clean & Steamed',
    'Punctual Campus Handoff'
  ]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const targetUser =
    roleReviewed === 'LENDER'
      ? booking?.lender || users?.[0]
      : booking?.borrower || users?.[1];

  const availableTags =
    roleReviewed === 'LENDER' ? LENDER_QUICK_TAGS : BORROWER_QUICK_TAGS;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleRoleSwitch = (newRole) => {
    setRoleReviewed(newRole);
    setSelectedTags(
      newRole === 'LENDER'
        ? ['Showroom Clean & Steamed', 'Punctual Campus Handoff']
        : ['Returned in Pristine Condition', 'On-Time Return Meetup']
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmitReview({
      booking_id: booking?.id,
      reviewer_id: activeUser?.id,
      reviewee_id: targetUser?.id,
      role_reviewed: roleReviewed,
      rating,
      quick_tags: selectedTags,
      comment
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setComment('');
      onClose();
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/75 flex items-center justify-center p-4">
      <div className="editorial-card max-w-lg w-full bg-[#FFFFFF] p-6 space-y-5">
        <div className="flex items-start justify-between border-b border-[#000000] pb-3">
          <div>
            <span className="editorial-badge-teal mb-1">
              Table 8: reviews • Dual-Sided Trust Rating
            </span>
            <h2 className="font-display font-bold text-xl text-[#000000]">
              Post-Rental Peer Rating & Quick Tags
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 border border-[#000000] bg-[#FFD5C2]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="bg-[#588B8B] text-[#FFFFFF] border border-[#000000] p-5 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#FFD5C2] mx-auto" />
            <div className="font-display font-bold text-lg">
              {rating}-Star {roleReviewed} Review Published!
            </div>
            <p className="text-xs">
              Updated {targetUser?.full_name}’s verified {roleReviewed.toLowerCase()} trust rating.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Switch between Rating the Lender vs Rating the Borrower */}
            <div className="grid grid-cols-2 gap-1 bg-[#FFD5C2] border border-[#000000] p-1">
              <button
                type="button"
                onClick={() => handleRoleSwitch('LENDER')}
                className={`py-2 text-xs font-bold uppercase border transition-all ${
                  roleReviewed === 'LENDER'
                    ? 'bg-[#F28F3B] text-[#000000] border-[#000000] shadow-editorial-sm'
                    : 'border-transparent text-[#000000]'
                }`}
              >
                Rate Closet Lender
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('BORROWER')}
                className={`py-2 text-xs font-bold uppercase border transition-all ${
                  roleReviewed === 'BORROWER'
                    ? 'bg-[#F28F3B] text-[#000000] border-[#000000] shadow-editorial-sm'
                    : 'border-transparent text-[#000000]'
                }`}
              >
                Rate Garment Borrower
              </button>
            </div>

            {/* Target Member Info */}
            <div className="bg-[#FFD5C2] border border-[#000000] p-3 flex items-center justify-between text-xs">
              <div>
                <span className="block text-[10px] font-mono uppercase">
                  Reviewing {roleReviewed}:
                </span>
                <span className="font-bold text-sm">
                  {targetUser?.full_name || 'Verified DSU Member'}
                </span>
              </div>
              <span className="editorial-badge-teal">
                Current ★{' '}
                {roleReviewed === 'LENDER'
                  ? targetUser?.lender_rating || '4.95'
                  : targetUser?.borrower_rating || '4.90'}
              </span>
            </div>

            {/* 1-5 Star Selector */}
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5">
                Select Star Rating (1–5 Stars)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    className={`flex-1 py-2.5 border border-[#000000] font-display font-bold text-sm flex items-center justify-center gap-1 transition-all ${
                      rating >= num
                        ? 'bg-[#F28F3B] text-[#000000] shadow-editorial-sm'
                        : 'bg-[#FFFFFF] text-[#000000]'
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        rating >= num ? 'fill-[#000000]' : ''
                      }`}
                    />
                    <span>{num}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Verification Tags */}
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5">
                Quick Verification Tags (Click to Toggle)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 text-xs font-bold border border-[#000000] transition-all ${
                        active
                          ? 'bg-[#588B8B] text-[#FFFFFF]'
                          : 'bg-[#FFD5C2] text-[#000000]'
                      }`}
                    >
                      {active ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">
                Written Feedback
              </label>
              <textarea
                rows="2"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share notes on fit, garment condition, and campus meetup punctuality..."
                className="editorial-input text-xs"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold border border-[#000000] bg-[#FFFFFF]"
              >
                Cancel
              </button>
              <button type="submit" className="editorial-btn-primary text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Submit Verified {roleReviewed} Rating</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
