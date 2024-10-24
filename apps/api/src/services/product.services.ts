import getDistanceFromLatLonInKm from '@/helpers/getDistance';
import { ErrorHandler } from '@/helpers/response';
import prisma from '@/prisma';
import { Branch, Prisma } from '@prisma/client';
import { Request } from 'express';

export class ProductService {
  // Untuk Search
  static async getAllProducts(req: Request) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 8;
      const skip = (page - 1) * limit;
      const { lat, long } = req.query;
      const maxDistance = 10;
      const branches = await prisma.branch.findMany({
        include: {
          address: true,
          ProductStocks: {
            include: {
              Product: true,
            },
          },
        },
        skip: skip,
        take: limit,
      });

      const shortest: { branch: Branch | undefined; distance: number } = {
        branch: undefined,
        distance: Infinity,
      };

      const nearbyProduct = branches.filter((branch) => {
        const distance = getDistanceFromLatLonInKm(
          Number(lat),
          Number(long),
          branch.address.lat,
          branch.address.lon,
        );

        if (distance <= maxDistance) {
          if (shortest?.distance > distance) {
            shortest.branch = branch;
            shortest.distance = distance;
          }

          return true;
        }
      });

      // Menghitung total jumlah produk
      const totalProducts = await prisma.productStock.count();

      // Query untuk produk dengan pagination
      const products = await prisma.productStock.findMany({
        include: {
          Product: true,
          Branch: {
            include: {
              address: true,
            },
          },
        },
        skip: skip,
        take: limit,
      });
      return {
        shortest,
        data: nearbyProduct,
        total: nearbyProduct.reduce(
          (total, branch) => branch.ProductStocks.length + total,
          0,
        ),
      };
    } catch (error) {
      throw new ErrorHandler('Failed to fetch products', 500);
    }
  }

  static async searchProducts(req: Request) {
    try {
      const { name } = req.query;

      if (!name) {
        throw new ErrorHandler('Product name is required', 400);
      }

      return await prisma.product.findMany({
        where: {
          product_name: {
            contains: String(name).toLowerCase(),
          },
        },
        include: {
          ProductStocks: {
            include: {
              Branch: true,
            },
          },
        },
      });
    } catch (error) {
      throw new ErrorHandler('Failed to search products', 500);
    }
  }

  static async getProductById(req: Request) {
    try {
      const { id } = req.params;
      const product = await prisma.product.findUnique({
        where: {
          id: Number(id),
        },
        include: {
          ProductStocks: {
            include: {
              Branch: {
                include: {
                  address: true,
                },
              },
            },
          },
        },
      });

      if (!product) {
        throw new ErrorHandler('Product not found', 404);
      }

      return product;
    } catch (error) {
      throw new ErrorHandler('Failed to fetch product', 500);
    }
  }
  // Product Detail
  // static async getProductDetail(req: Request) {
  //   try {
  //     const { id } = req.params;

  //     const product = await prisma.product.findUnique({
  //       where: {
  //         id: Number(id),
  //       },
  //       include: {
  //         category: true,
  //         ProductStocks: true,
  //         Discounts: true,
  //       },
  //     });

  //     if (!product) {
  //       throw new ErrorHandler('Product not found', 404);
  //     }

  //     const productWithImageUrl = {
  //       ...product,
  //       image: product.image ? `/images/product/${product.image}` : null,
  //     };

  //     return productWithImageUrl;
  //   } catch (error) {
  //     console.error('Error fetching product details:', error);
  //     throw new ErrorHandler('Failed to fetch product details', 500);
  //   }
  // }
  static async getProductDetail(req: Request) {
    try {
      const { id } = req.params;

      // const product = await prisma.product.findUnique({
      //   where: {
      //     id: Number(id),
      //   },
      //   include: {
      //     category: true,
      //     ProductStocks: true,
      //     Discounts: true,
      //     images: true,
      //   },
      // });

      // if (!product) {
      //   throw new ErrorHandler('Product not found', 404);
      // }

      // const productWithImageUrl = {
      //   ...product,
      //   images: product.images.map((img) => ({
      //     ...img,
      //     imageUrl: `/images/product/${img.imageUrl}`,
      //   })),
      // };

      // return productWithImageUrl;
    } catch (error) {
      throw new ErrorHandler('Failed to fetch product details', 500);
    }
  }
}
