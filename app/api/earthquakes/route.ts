import { NextResponse } from "next/server";
import type { Document } from "mongodb";

import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isGeoJsonGeometry(value: unknown): value is GeoJSON.Geometry {
  const geometry = getObject(value);
  return (
    geometry !== null &&
    typeof geometry.type === "string" &&
    "coordinates" in geometry
  );
}

function toGeoJsonFeature(
  value: unknown
): GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties> | null {
  const feature = getObject(value);
  if (!feature) return null;

  const geometry = feature.geometry;
  if (!isGeoJsonGeometry(geometry)) return null;

  const properties = getObject(feature.properties);

  return {
    type: "Feature",
    id:
      typeof feature.id === "string" || typeof feature.id === "number"
        ? feature.id
        : undefined,
    geometry,
    properties: properties ?? {},
  };
}

function collectGeoJsonFeatures(
  documents: Document[]
): GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[] {
  return documents.flatMap((doc) => {
    if (doc.type === "FeatureCollection" && Array.isArray(doc.features)) {
      return doc.features
        .map((featureDoc: unknown) => toGeoJsonFeature(featureDoc))
        .filter(
          (
            feature: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties> | null
          ): feature is GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties> =>
            feature !== null
        );
    }

    if (doc.type === "Feature") {
      const parsedFeature = toGeoJsonFeature(doc);
      return parsedFeature ? [parsedFeature] : [];
    }

    if (isGeoJsonGeometry(doc.geometry)) {
      const wrappedFeature = toGeoJsonFeature({
        type: "Feature",
        id: typeof doc._id?.toString === "function" ? doc._id.toString() : undefined,
        geometry: doc.geometry,
        properties: getObject(doc.properties) ?? {},
      });
      return wrappedFeature ? [wrappedFeature] : [];
    }

    return [];
  });
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const collectionFromQuery = requestUrl.searchParams.get("collection");
    const debugEnabled = requestUrl.searchParams.get("debug") === "1";
    const databaseName = process.env.MONGODB_DB;
    const configuredCollectionName =
      collectionFromQuery ?? process.env.MONGODB_COLLECTION ?? "earthquakes";

    if (!databaseName) {
      return NextResponse.json(
        { error: "Missing MONGODB_DB environment variable" },
        { status: 500 }
      );
    }

    const client = await clientPromise;
    const db = client.db(databaseName);

    let collectionName = configuredCollectionName;
    let collection = db.collection(collectionName);

    let documents = await collection.find({}).limit(5000).toArray();

    if (documents.length === 0 && !collectionFromQuery && !process.env.MONGODB_COLLECTION) {
      const candidateCollections = await db
        .listCollections({}, { nameOnly: true })
        .toArray();

      const firstUserCollection = candidateCollections.find(
        (c) => c.name && !c.name.startsWith("system.")
      );

      if (firstUserCollection?.name && firstUserCollection.name !== collectionName) {
        collectionName = firstUserCollection.name;
        collection = db.collection(collectionName);
        documents = await collection.find({}).limit(5000).toArray();
      }
    }

    const features = collectGeoJsonFeatures(documents);

    if (debugEnabled) {
      const firstDocument = documents[0] ?? null;
      const firstDocumentObject =
        firstDocument && typeof firstDocument === "object"
          ? (firstDocument as Record<string, unknown>)
          : null;

      const firstPropertiesObject = getObject(firstDocumentObject?.properties);

      return NextResponse.json({
        ok: true,
        database: databaseName,
        collection: collectionName,
        documentCount: documents.length,
        featureCount: features.length,
        geometryTypes: Array.from(new Set(features.map((f) => f.geometry.type))),
        sampleTopLevelKeys: firstDocumentObject ? Object.keys(firstDocumentObject) : [],
        samplePropertiesKeys: firstPropertiesObject
          ? Object.keys(firstPropertiesObject)
          : [],
      });
    }

    return NextResponse.json({
      type: "FeatureCollection",
      features,
    } satisfies GeoJSON.FeatureCollection<
      GeoJSON.Geometry,
      GeoJSON.GeoJsonProperties
    >);
  } catch (error) {
    console.error("Error fetching area data:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load area data";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}