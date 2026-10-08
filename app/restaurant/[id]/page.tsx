"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
};

type Restaurant = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
};

export default function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void params.then(({ id }) => {
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
        return data as Restaurant;
      })
      .then((data) => {
        if (active) setRestaurant(data);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load restaurant.");
      });
    return () => {
      active = false;
    };
  }, [restaurantId]);

  if (error) return <main className="page-shell"><p className="notice" role="alert">{error}</p></main>;
  if (!restaurant) return <main className="page-shell"><p className="muted">Loading restaurant…</p></main>;

  return (
    <main className="page-shell">
      <div className="screen-topbar">
        <div className="screen-kicker"><span className="brand-mark" aria-hidden="true">Z</span><span>RESTAURANT REVIEWS</span></div>
        <div className="wordmark" aria-label="Zomato Lite"><span>zomato</span><small>lite</small></div>
      </div>
      <header className="restaurant-heading">
        <h1>{restaurant.name}</h1>
        <p className="muted restaurant-meta"><span>{restaurant.cuisine}</span><span className="meta-divider" aria-hidden="true" /><span>{restaurant.area}</span></p>
      </header>

      <section className="rating-summary" aria-label="Restaurant rating">
        <div className="rating-copy">
          <p className="eyebrow">COMMUNITY RATING</p>
          <p className="review-count">Based on {restaurant.totalReviews} {restaurant.totalReviews === 1 ? "review" : "reviews"}</p>
        </div>
        <div className="rating-pill" aria-label="Average restaurant rating">
          <span className="average-rating">{restaurant.averageRating === null ? "—" : restaurant.averageRating}</span>
          <span className="rating-star" aria-hidden="true">★</span>
        </div>
      </section>

      {restaurant.latestReview ? (
        <section className="latest-review" aria-labelledby="latest-heading">
          <div className="latest-card-top">
            <div>
              <p className="eyebrow">FRESH FROM THE COMMUNITY</p>
              <h2 id="latest-heading">Latest review</h2>
            </div>
            <span className="review-rating-chip" aria-label={`${restaurant.latestReview.rating} out of 5 stars`}>
              {restaurant.latestReview.rating}<span aria-hidden="true"> ★</span>
            </span>
          </div>
          <p className="review-comment">{restaurant.latestReview.comment}</p>
          <time className="review-date" dateTime={restaurant.latestReview.createdAt}>{new Date(restaurant.latestReview.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</time>
        </section>
      ) : (
        <section className="empty-state">
          <span className="empty-mark" aria-hidden="true">✳</span>
          <h2>Be the first to leave a review</h2>
          <p className="muted">There are no reviews yet. Share how your visit went.</p>
        </section>
      )}

      {restaurant.reviews.length > 0 && (
        <section className="older-reviews" aria-labelledby="older-heading">
          <div className="older-heading-row">
            <div><p className="eyebrow">MORE TO EXPLORE</p><h2 id="older-heading" className="section-heading">Earlier reviews</h2></div>
            <span className="older-count">{restaurant.reviews.length}</span>
          </div>
          <ul className="review-list">
            {restaurant.reviews.map((review) => (
              <li key={review.id} className="review-item">
                <div className="section-label-row">
                  <span className="review-rating-chip small" aria-label={`${review.rating} out of 5 stars`}>
                    {review.rating}<span aria-hidden="true"> ★</span>
                  </span>
                  <time className="review-date" dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</time>
                </div>
                <p className="review-comment">{review.comment}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link className="text-link" href={`/review/${restaurantId}`}><span>Share your experience</span><span className="link-arrow" aria-hidden="true">→</span></Link>
    </main>
  );
}
