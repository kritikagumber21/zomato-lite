"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type RestaurantResponse = {
  name: string;
};

export default function ReviewPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void params.then(({ restaurantId: id }) => {
      if (active) setRestaurantId(id);
    });
    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    if (!restaurantId) return;
    let active = true;
    fetch(`/api/restaurants/${restaurantId}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load restaurant.");
        return data as RestaurantResponse;
      })
      .then((data) => {
        if (active) setRestaurantName(data.name);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load restaurant.");
      });
    return () => {
      active = false;
    };
  }, [restaurantId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating === null || !comment.trim() || !restaurantId) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: Number(restaurantId), rating, comment }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to submit review.");
        return;
      }
      router.push(`/restaurant/${restaurantId}`);
    } catch {
      setError("Unable to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <Link className="back-link" href={restaurantId ? `/restaurant/${restaurantId}` : "/"}>
        <span aria-hidden="true">←</span> Back to restaurant
      </Link>
      <header className="restaurant-heading form-heading">
        <p className="eyebrow">YOUR VISIT</p>
        <h1>{restaurantName ?? "Loading restaurant…"}</h1>
        <p className="muted">How was your experience?</p>
      </header>

      <form className="review-form" onSubmit={handleSubmit}>
        <fieldset className="rating-picker">
          <legend className="field-label">Your rating</legend>
          <div className="star-options">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`star-button${rating === value ? " selected" : ""}`}
                aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                aria-pressed={rating === value}
                onClick={() => setRating(value)}
              >
                {rating !== null && value <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="field-label" htmlFor="comment">Your review</label>
        <textarea
          id="comment"
          className="comment-input"
          rows={6}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="What stood out about your visit?"
        />

        {error && <p className="notice" role="alert">{error}</p>}

        <button
          className="submit-button"
          type="submit"
          disabled={rating === null || comment.trim().length === 0 || submitting}
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </main>
  );
}
