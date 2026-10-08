import { getSql } from "@/lib/db";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const { restaurantId, rating, comment } = body as {
    restaurantId?: unknown;
    rating?: unknown;
    comment?: unknown;
  };

  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json(
      { error: "Rating must be an integer from 1 to 5." },
      { status: 400 },
    );
  }

  if (typeof comment !== "string" || comment.trim().length === 0) {
    return Response.json({ error: "Comment must not be empty." }, { status: 400 });
  }

  if (typeof restaurantId !== "number" || !Number.isInteger(restaurantId) || restaurantId < 1) {
    return Response.json({ error: "Restaurant does not exist." }, { status: 400 });
  }

  try {
    const sql = getSql();
    const restaurants = await sql`
      SELECT id FROM restaurants WHERE id = ${restaurantId} LIMIT 1
    `;

    if (restaurants.length === 0) {
      return Response.json({ error: "Restaurant does not exist." }, { status: 400 });
    }

    const insertedReviews = await sql`
      INSERT INTO reviews (restaurant_id, rating, comment)
      VALUES (${restaurantId}, ${rating}, ${comment.trim()})
      RETURNING id
    `;

    return Response.json(
      { success: true, reviewId: insertedReviews[0].id },
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "Unable to save review right now." }, { status: 500 });
  }
}
