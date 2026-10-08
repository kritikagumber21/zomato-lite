import { getSql } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const restaurantId = Number(id);

  if (!Number.isInteger(restaurantId) || restaurantId < 1) {
    return Response.json({ error: "Restaurant not found." }, { status: 404 });
  }

  try {
    const sql = getSql();
    const restaurants = await sql`
      SELECT name, cuisine, area
      FROM restaurants
      WHERE id = ${restaurantId}
      LIMIT 1
    `;

    if (restaurants.length === 0) {
      return Response.json({ error: "Restaurant not found." }, { status: 404 });
    }

    const restaurant = restaurants[0];
    const summaries = await sql`
      SELECT
        ROUND(AVG(rating)::numeric, 1)::double precision AS "averageRating",
        COUNT(*)::integer AS "totalReviews"
      FROM reviews
      WHERE restaurant_id = ${restaurantId}
    `;
    const summary = summaries[0];

    const latestReviews = await sql`
      SELECT id, rating, comment, created_at AS "createdAt"
      FROM reviews
      WHERE restaurant_id = ${restaurantId}
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `;
    const latestReview = latestReviews[0] ?? null;

    const reviews = latestReview
      ? await sql`
          SELECT id, rating, comment, created_at AS "createdAt"
          FROM reviews
          WHERE restaurant_id = ${restaurantId}
            AND id <> ${latestReview.id}
          ORDER BY created_at DESC, id DESC
        `
      : [];

    return Response.json({
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      area: restaurant.area,
      averageRating: summary.averageRating,
      totalReviews: summary.totalReviews,
      latestReview,
      reviews,
    });
  } catch {
    return Response.json({ error: "Unable to load restaurant right now." }, { status: 500 });
  }
}
