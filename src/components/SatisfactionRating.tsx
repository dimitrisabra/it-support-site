import { useState } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface SatisfactionRatingProps {
  conversationId: string;
  onClose: () => void;
}

export const SatisfactionRating = ({ conversationId, onClose }: SatisfactionRatingProps) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (rating === 0) return;
    await supabase
      .from("conversations")
      .update({ satisfaction_rating: rating, feedback_text: feedback || null } as any)
      .eq("id", conversationId) as any;
    setSubmitted(true);
    toast({ title: "Thank you!", description: "Your feedback helps us improve." });
    setTimeout(onClose, 1500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-card border border-border rounded-xl p-4 max-w-sm mx-auto"
      >
        {submitted ? (
          <div className="text-center py-4">
            <Star className="h-8 w-8 text-warning fill-warning mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Thanks for your feedback!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground">How was your experience?</p>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-1 justify-center mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(s)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      s <= (hover || rating) ? "text-warning fill-warning" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Any additional feedback? (optional)"
              className="bg-secondary border-border text-sm min-h-[60px] mb-3"
            />
            <Button onClick={submit} disabled={rating === 0} className="w-full bg-primary text-primary-foreground text-sm">
              Submit Rating
            </Button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
