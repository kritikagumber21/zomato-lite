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
      <header className="restaurant-heading">
        <p className="eyebrow">RESTAURANT</p>
        <h1>{restaurant.name}</h1>
        <p className="muted">{restaurant.cuisine} <span aria-hidden="true">·</span> {restaurant.area}</p>
      </header>

      <section className="rating-summary" aria-label="Restaurant rating">
        <p className="average-rating">
          {restaurant.averageRating === null ? "—" : restaurant.averageRating}
        </p>
        <p className="review-count">
          {restaurant.totalReviews} {restaurant.totalReviews === 1 ? "review" : "reviews"}
        </p>
      </section>

      {restaurant.latestReview ? (
        <section className="latest-review" aria-labelledby="latest-heading">
          <div className="section-label-row">
            <h2 id="latest-heading">Latest review</h2>
            <span className="review-stars" aria-label={`${restaurant.latestReview.rating} out of 5 stars`}>
              {"★".repeat(restaurant.latestReview.rating)}{"☆".repeat(5 - restaurant.latestReview.rating)}
            </span>
          </div>
          <p className="review-comment">{restaurant.latestReview.comment}</p>
          <time className="muted" dateTime={restaurant.latestReview.createdAt}>{restaurant.latestReview.createdAt}</time>
        </section>
      ) : (
        <section className="empty-state">
          <h2>Be the first to leave a review</h2>
          <p className="muted">There are no reviews yet. Share how your visit went.</p>
        </section>
      )}

      {restaurant.reviews.length > 0 && (
        <section className="older-reviews" aria-labelledby="older-heading">
          <h2 id="older-heading" className="section-heading">Earlier reviews</h2>
          <ul className="review-list">
            {restaurant.reviews.map((review) => (
              <li key={review.id} className="review-item">
                <div className="section-label-row">
                  <span className="review-stars" aria-label={`${review.rating} out of 5 stars`}>
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </span>
                  <time className="muted" dateTime={review.createdAt}>{review.createdAt}</time>
                </div>
                <p className="review-comment">{review.comment}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link className="text-link" href={`/review/${restaurantId}`}>Write a review <span aria-hidden="true">→</span></Link>
    </main>
  );
}
