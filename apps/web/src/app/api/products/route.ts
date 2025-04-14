import { NextResponse } from "next/server";
import {
  withDatabase,
  type DatabaseOperationCallback,
} from "@/lib/prisma-client";
import { withErrorHandler } from "@/utils/with-error-handler";
import type { ProductTableRow } from "@/types/models";

/** 1) READ (GET) */
export const GET = withErrorHandler(async (req: Request) => {
  // Example: Return all products
  return await withDatabase(async (db) => {
    const products = await db.products.findMany({
      select: {
        product_id: true,
        name: true,
        sku: true,
        grade: true,
        raw_materials: {
          select: {
            cas_number: true,
          },
        },
      },
    });

    return NextResponse.json(
      products.map((product: any) => {
        const { raw_materials, ...rest } = product;
        return {
          ...rest,
          cas_number: raw_materials?.cas_number ?? "",
        };
      })
    );
  });
});

/** 2) CREATE (POST) */
export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();

  return await withDatabase(async (db) => {
    const newProduct = await db.products.create({
      data: {
        name: body.name || "[name]",
        sku: body.sku || "[sku]",
        grade: body.grade || "[grade]",
      },
    });

    return NextResponse.json({ data: newProduct }, { status: 201 });
  });
});

/** 3) UPDATE (PATCH) */
export const PATCH = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);

  return await withDatabase(async (db) => {
    const updatedProduct = await db.products.update({
      where: {
        product_id: Number(searchParams.get("product_id")),
      },
      data: {
        name: searchParams.get("name") || "[name]",
        sku: searchParams.get("sku") || "[sku]",
        grade: searchParams.get("grade") || "[grade]",
      },
    });

    return NextResponse.json({ data: updatedProduct }, { status: 200 });
  });
});

/** 4) DELETE (DELETE) */
export const DELETE = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);

  return await withDatabase(async (db) => {
    const deletedProduct = await db.products.delete({
      where: {
        product_id: Number(searchParams.get("product_id")),
      },
    });

    return NextResponse.json({ data: deletedProduct });
  });
});
